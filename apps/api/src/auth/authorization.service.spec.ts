import type { VuteqAccessClaims, VuteqIdentity, VuteqUser } from "@vuteq/sso-client-nest";
import type { PrismaService } from "../prisma/prisma.service";
import { AuthorizationService } from "./authorization.service";

describe("AuthorizationService", () => {
  const viewerRole = {
    Id: 4,
    RoleName: "VIEWER",
    IsActive: true,
    Permissions: [
      { Id: 1, Action: "ITAM.DASHBOARD_READ" },
      { Id: 2, Action: "ITAM.ASSET_READ" },
    ],
  };

  const identity: VuteqIdentity = {
    id: "sso-user-123",
    name: "John Viewer",
    username: "john.viewer",
    email: "john@vuteq.co.id",
    emailVerified: true,
  };

  it("assigns and grants VIEWER role to new user when global SSO role includes RO_ADMINISTRATOR", async () => {
    const claims: VuteqAccessClaims = {
      sub: identity.id,
      client_id: "test-client",
      grant_id: "grant-1",
      roles: ["RO_ADMINISTRATOR"],
    };

    const prisma = {
      role: {
        findUnique: jest.fn().mockResolvedValue(viewerRole),
      },
      permission: {
        findMany: jest.fn(),
      },
      appUser: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) => ({
          Id: "local-user-id",
          ...data,
          Role: viewerRole,
        })),
        update: jest.fn(),
      },
    };

    const service = new AuthorizationService(prisma as unknown as PrismaService);
    const auth = await service.resolve(identity, claims);

    expect(prisma.role.findUnique).toHaveBeenCalledWith({
      where: { RoleName: "VIEWER" },
      include: { Permissions: true },
    });
    expect(prisma.appUser.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          SsoObjectId: identity.id,
          RoleId: viewerRole.Id,
          IsActive: true,
        }),
      }),
    );
    expect(auth.roles).toEqual(["VIEWER"]);
    expect(auth.permissions).toEqual(["ITAM.DASHBOARD_READ", "ITAM.ASSET_READ"]);
    expect(auth.attributes?.accessStatus).toBe("ACTIVE");
  });

  it("updates existing user without role to VIEWER when global SSO role is RO_ADMINISTRATOR", async () => {
    const claims: VuteqAccessClaims = {
      sub: identity.id,
      client_id: "test-client",
      grant_id: "grant-1",
      roles: ["RO_ADMINISTRATOR"],
    };

    const existingUserWithoutRole = {
      Id: "local-user-id",
      SsoObjectId: identity.id,
      UserName: identity.username,
      Name: identity.name,
      Email: identity.email,
      RoleId: null,
      Role: null,
      IsActive: true,
    };

    const prisma = {
      role: {
        findUnique: jest.fn().mockResolvedValue(viewerRole),
      },
      permission: {
        findMany: jest.fn(),
      },
      appUser: {
        findUnique: jest.fn().mockResolvedValue(existingUserWithoutRole),
        update: jest.fn().mockImplementation(({ data }) => ({
          ...existingUserWithoutRole,
          ...data,
          Role: viewerRole,
        })),
      },
    };

    const service = new AuthorizationService(prisma as unknown as PrismaService);
    const auth = await service.resolve(identity, claims);

    expect(prisma.appUser.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { Id: existingUserWithoutRole.Id },
        data: expect.objectContaining({
          RoleId: viewerRole.Id,
        }),
      }),
    );
    expect(auth.roles).toEqual(["VIEWER"]);
    expect(auth.attributes?.accessStatus).toBe("ACTIVE");
  });

  it("keeps normal user without roles in PENDING status when not RO_ADMINISTRATOR", async () => {
    const claims: VuteqAccessClaims = {
      sub: identity.id,
      client_id: "test-client",
      grant_id: "grant-1",
      roles: [],
    };

    const prisma = {
      role: {
        findUnique: jest.fn(),
      },
      appUser: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) => ({
          Id: "local-user-id",
          ...data,
          Role: null,
        })),
      },
    };

    const service = new AuthorizationService(prisma as unknown as PrismaService);
    const auth = await service.resolve(identity, claims);

    expect(prisma.appUser.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          RoleId: null,
        }),
      }),
    );
    expect(auth.roles).toEqual([]);
    expect(auth.attributes?.accessStatus).toBe("PENDING");
  });

  it("profile() returns VIEWER and ACTIVE status for RO_ADMINISTRATOR even if local role unassigned", async () => {
    const vuteqUser: VuteqUser = {
      ...identity,
      roles: ["VIEWER"],
      permissions: ["ITAM.DASHBOARD_READ"],
      globalRoles: ["RO_ADMINISTRATOR"],
    };

    const prisma = {
      appUser: {
        findUnique: jest.fn().mockResolvedValue({
          Id: "local-user-id",
          SsoObjectId: identity.id,
          IsActive: true,
          Role: null,
        }),
      },
    };

    const service = new AuthorizationService(prisma as unknown as PrismaService);
    const profile = await service.profile(vuteqUser);

    expect(profile.RoleName).toBe("VIEWER");
    expect(profile.AccessStatus).toBe("ACTIVE");
    expect(profile.GlobalRoles).toContain("RO_ADMINISTRATOR");
  });
});
