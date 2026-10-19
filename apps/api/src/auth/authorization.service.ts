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

  private async getOrCreateViewerRole() {
    let role = await this.prisma.role.findUnique({
      where: { RoleName: "VIEWER" },
      include: { Permissions: true },
    });
    if (!role) {
      const readPermissions = await this.prisma.permission.findMany({
        where: { Action: { endsWith: "_READ" } },
      });
      role = await this.prisma.role.create({
        data: {
          RoleName: "VIEWER",
          Description: "Viewer application role with read-only permissions",
          IsActive: true,
          CreatedBy: "System",
          UpdatedBy: "System",
          Permissions: {
            connect: readPermissions.map(({ Id }) => ({ Id })),
          },
        },
        include: { Permissions: true },
      });
    }
    return role;
  }

  async resolve(
    identity: VuteqIdentity,
    claims: VuteqAccessClaims,
  ): Promise<VuteqLocalAuthorization> {
    const actor = identity.id;
    const email = identity.email ? identity.email.trim().toLowerCase() : null;
    const username = identity.username ?? identity.email ?? identity.id;
    const name = identity.name ?? identity.username ?? "Vuteq User";
    const globalRoles = Array.isArray(claims?.roles) ? claims.roles : [];
    const isRoAdmin = globalRoles.includes("RO_ADMINISTRATOR");
    const viewerRole = isRoAdmin ? await this.getOrCreateViewerRole() : null;

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
      // If user has no assigned role but has global RO_ADMINISTRATOR, assign VIEWER role
      const shouldAssignViewer = isRoAdmin && !user.RoleId && viewerRole?.IsActive;
      user = await this.prisma.appUser.update({
        where: { Id: user.Id },
        data: {
          SsoObjectId: identity.id,
          UserName: username,
          Name: name,
          Email: email,
          RoleId: shouldAssignViewer ? viewerRole.Id : undefined,
          LastLogin: new Date(),
          UpdatedBy: actor,
        },
        include: { Role: { include: { Permissions: true } } },
      });
    } else {
      // 3. Auto-provision new user; if global RO_ADMINISTRATOR, assign VIEWER, otherwise RoleId: null (PENDING)
      const defaultRoleId = isRoAdmin && viewerRole?.IsActive ? viewerRole.Id : null;
      user = await this.prisma.appUser.create({
        data: {
          SsoObjectId: identity.id,
          UserName: username,
          Name: name,
          Email: email,
          RoleId: defaultRoleId,
          IsActive: true,
          LastLogin: new Date(),
          CreatedBy: actor,
          UpdatedBy: actor,
        },
        include: { Role: { include: { Permissions: true } } },
      });
    }

    if (!user.IsActive) {
      return {
        roles: [],
        permissions: [],
        attributes: {
          localUserId: user.Id,
          accessStatus: "BLOCKED",
        },
      };
    }

    const effectiveRole = user.Role?.IsActive
      ? user.Role
      : (isRoAdmin && viewerRole?.IsActive ? viewerRole : null);

    if (!effectiveRole) {
      return {
        roles: [],
        permissions: [],
        attributes: {
          localUserId: user.Id,
          accessStatus: "PENDING",
        },
      };
    }

    return {
      roles: [effectiveRole.RoleName],
      permissions: effectiveRole.Permissions.map((permission) => permission.Action),
      attributes: { localUserId: user.Id, accessStatus: "ACTIVE" },
    };
  }

  async profile(user: VuteqUser) {
    const local = await this.prisma.appUser.findUnique({
      where: { SsoObjectId: user.id },
      include: { Role: true },
    });
    const isActive = local ? local.IsActive : true;
    const isRoAdmin = (user.globalRoles ?? []).includes("RO_ADMINISTRATOR");
    const activeRoleName = local?.Role && local.Role.IsActive
      ? local.Role.RoleName
      : (isRoAdmin ? "VIEWER" : null);
    const hasRole = Boolean(activeRoleName);
    const accessStatus = !isActive ? "BLOCKED" : (hasRole ? "ACTIVE" : "PENDING");
    return {
      Id: user.id,
      Name: user.name ?? local?.Name ?? "System",
      UserName: user.username ?? local?.UserName,
      Email: user.email ?? local?.Email,
      EmailVerified: user.emailVerified,
      GlobalRoles: user.globalRoles,
      LocalRole: activeRoleName,
      RoleName: activeRoleName,
      Permissions: user.permissions,
      IsActive: isActive,
      AccessStatus: accessStatus,
    };
  }
}
