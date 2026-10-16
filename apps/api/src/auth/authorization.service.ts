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
    const archived = await this.prisma.appUser.findUnique({
      where: { SsoObjectId: identity.id },
      include: { Role: { include: { Permissions: true } } },
    });
    if (archived?.DeletedAt) {
      return {
        roles: [],
        permissions: [],
        attributes: { localUserId: archived.Id, accessStatus: "BLOCKED" },
      };
    }
    const user = await this.prisma.appUser.upsert({
      where: { SsoObjectId: identity.id },
      create: {
        SsoObjectId: identity.id,
        UserName: identity.username ?? identity.email ?? identity.id,
        Name: identity.name ?? identity.username ?? "Vuteq User",
        Email: identity.email,
        CreatedBy: actor,
        UpdatedBy: actor,
      },
      update: {
        UserName: identity.username ?? identity.email ?? identity.id,
        Name: identity.name ?? identity.username ?? "Vuteq User",
        Email: identity.email,
        LastLogin: new Date(),
        UpdatedBy: actor,
      },
      include: { Role: { include: { Permissions: true } } },
    });

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
    const isActive = local ? local.IsActive && !local.DeletedAt : true;
    const hasRole = Boolean(local?.Role && local.Role.IsActive && !local.DeletedAt);
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
