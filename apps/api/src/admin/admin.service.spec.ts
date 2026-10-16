import { ConflictException, NotFoundException } from "@nestjs/common";
import type { AuditService } from "../audit/audit.service";
import type { ActorContext } from "../common/api.types";
import type { PrismaService } from "../prisma/prisma.service";
import { AdminService } from "./admin.service";

const actor: ActorContext = { Actor: "admin-sso-id", ActorSource: "SSO", RequestId: "request-1" };
const target = {
  Id: "user-id",
  SsoObjectId: "target-sso-id",
  UserName: "target.user",
  Name: "Target User",
  Email: "target@vuteq.co.id",
  PhoneNumber: "08123456789",
  IsActive: true,
  DeletedAt: null,
  Role: { Id: 1, RoleName: "USER" },
};

describe("AdminService user archival", () => {
  function setup(user: typeof target | null = target) {
    const tx = { appUser: { update: jest.fn().mockResolvedValue({ ...target, SsoObjectId: `archived:${target.Id}`, Email: null, PhoneNumber: null, IsActive: false, DeletedAt: new Date(), Role: null }) } };
    const prisma = { appUser: { findFirst: jest.fn().mockResolvedValue(user) } };
    const audit = { execute: jest.fn(async (input: { operation: (transaction: typeof tx) => Promise<unknown> }) => input.operation(tx)) };
    const service = new AdminService(prisma as unknown as PrismaService, audit as unknown as AuditService);
    return { service, prisma, audit, tx };
  }

  it("archives the old account and releases SSO identity fields for re-registration", async () => {
    const { service, audit, tx } = setup();

    const result = await service.archiveUser(target.Id, actor);

    expect(result.message).toBe("User archived successfully");
    expect(audit.execute).toHaveBeenCalledWith(expect.objectContaining({ functionId: "USER_ARCHIVE", action: "ARCHIVE", before: target }));
    expect(tx.appUser.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { Id: target.Id },
      data: expect.objectContaining({
        SsoObjectId: `archived:${target.Id}`,
        Email: null,
        PhoneNumber: null,
        IsActive: false,
        RoleId: null,
        DeletedBy: actor.Actor,
        UpdatedBy: actor.Actor,
        DeletedAt: expect.any(Date),
      }),
    }));
  });

  it("prevents deleting the current account", async () => {
    const { service, audit, tx } = setup({ ...target, SsoObjectId: actor.Actor });

    await expect(service.archiveUser(target.Id, actor)).rejects.toBeInstanceOf(ConflictException);
    expect(audit.execute).not.toHaveBeenCalled();
    expect(tx.appUser.update).not.toHaveBeenCalled();
  });

  it("does not archive missing or already archived accounts", async () => {
    const { service, audit } = setup(null);

    await expect(service.archiveUser(target.Id, actor)).rejects.toBeInstanceOf(NotFoundException);
    expect(audit.execute).not.toHaveBeenCalled();
  });
});
