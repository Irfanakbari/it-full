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
  Role: { Id: 1, RoleName: "USER" },
};

describe("AdminService user deletion", () => {
  function setup(user: typeof target | null = target) {
    const tx = { appUser: { delete: jest.fn().mockResolvedValue(target) } };
    const prisma = { appUser: { findUnique: jest.fn().mockResolvedValue(user) } };
    const audit = { execute: jest.fn(async (input: { operation: (transaction: typeof tx) => Promise<unknown> }) => input.operation(tx)) };
    const service = new AdminService(prisma as unknown as PrismaService, audit as unknown as AuditService);
    return { service, prisma, audit, tx };
  }

  it("deletes the user account permanently ala ANSEI", async () => {
    const { service, audit, tx } = setup();

    const result = await service.deleteUser(target.Id, actor);

    expect(result.message).toBe("User deleted successfully");
    expect(audit.execute).toHaveBeenCalledWith(expect.objectContaining({ functionId: "USER_DELETE", action: "DELETE", before: target }));
    expect(tx.appUser.delete).toHaveBeenCalledWith({ where: { Id: target.Id } });
  });

  it("prevents deleting the current account", async () => {
    const { service, audit, tx } = setup({ ...target, SsoObjectId: actor.Actor });

    await expect(service.deleteUser(target.Id, actor)).rejects.toBeInstanceOf(ConflictException);
    expect(audit.execute).not.toHaveBeenCalled();
    expect(tx.appUser.delete).not.toHaveBeenCalled();
  });

  it("does not delete missing accounts", async () => {
    const { service, audit } = setup(null);

    await expect(service.deleteUser(target.Id, actor)).rejects.toBeInstanceOf(NotFoundException);
    expect(audit.execute).not.toHaveBeenCalled();
  });
});

