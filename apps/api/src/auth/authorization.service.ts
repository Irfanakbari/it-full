import { Injectable } from "@nestjs/common";
import type {
  VuteqAccessClaims,
  VuteqIdentity,
  VuteqLocalAuthorization,
  VuteqUser,
} from "@vuteq/sso-client-nest";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthorizationService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(
    identity: VuteqIdentity,
    _claims: VuteqAccessClaims,
  ): Promise<VuteqLocalAuthorization> {
    const actor = identity.id;
    const email = identity.email ? identity.email.trim().toLowerCase() : null;
    const username = identity.username ?? identity.email ?? identity.id;
    const name = identity.name ?? identity.username ?? "Vuteq User";

    // 1. Primary lookup by immutable SSO Subject
    let user = await this.prisma.appUser.findUnique({
      where: { SsoObjectId: identity.id },
      include: { Role: { include: { Permissions: true } } },
    });

    // 2. Safe Fallback: if not found by SsoObjectId, check by Email (only if email exists)
    if (!user && email) {
      const byEmail = await this.prisma.appUser.findUnique({
        where: { Email: email },
        include: { Role: { include: { Permissions: true } } },
      });
      // Only link if the existing record doesn't already have a conflicting SsoObjectId
      if (byEmail && (!byEmail.SsoObjectId || byEmail.SsoObjectId === identity.id)) {
        user = byEmail;
      }
    }

    if (user) {
      // Update SSO-owned attributes without touching application-owned RoleId or IsActive
      user = await this.prisma.appUser.update({
        where: { Id: user.Id },
        data: {
          SsoObjectId: identity.id,
          UserName: username,
          Name: name,
          Email: email,
          LastLogin: new Date(),
          UpdatedBy: actor,
        },
        include: { Role: { include: { Permissions: true } } },
      });
    } else {
      // 3. Auto-provision new user with RoleId: null (PENDING status)
      user = await this.prisma.appUser.create({
        data: {
          SsoObjectId: identity.id,
          UserName: username,
          Name: name,
          Email: email,
          RoleId: null,
          IsActive: true,
          LastLogin: new Date(),
          CreatedBy: actor,
          UpdatedBy: actor,
        },
        include: { Role: { include: { Permissions: true } } },
      });
    }

    if (!user.IsActive || !user.Role?.IsActive) {
      return {
        roles: [],
        permissions: [],
        attributes: {
          localUserId: user.Id,
          accessStatus: !user.IsActive ? "BLOCKED" : "PENDING",
        },
      };
    }
    return {
      roles: [user.Role.RoleName],
      permissions: user.Role.Permissions.map((permission) => permission.Action),
      attributes: { localUserId: user.Id, accessStatus: "ACTIVE" },
    };
  }

  async profile(user: VuteqUser) {
    const local = await this.prisma.appUser.findUnique({
      where: { SsoObjectId: user.id },
      include: { Role: true },
    });
    const isActive = local ? local.IsActive : true;
    const hasRole = Boolean(local?.Role && local.Role.IsActive);
    const accessStatus = !isActive ? "BLOCKED" : (hasRole ? "ACTIVE" : "PENDING");
    return {
      Id: user.id,
      Name: user.name ?? local?.Name ?? "System",
      UserName: user.username ?? local?.UserName,
      Email: user.email ?? local?.Email,
      EmailVerified: user.emailVerified,
      GlobalRoles: user.globalRoles,
      LocalRole: hasRole ? (local?.Role?.RoleName ?? null) : null,
      RoleName: hasRole ? (local?.Role?.RoleName ?? null) : null,
      Permissions: user.permissions,
      IsActive: isActive,
      AccessStatus: accessStatus,
    };
  }
}
