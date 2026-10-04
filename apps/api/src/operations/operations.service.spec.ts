import { ConflictException } from "@nestjs/common";
import type { AuditService } from "../audit/audit.service";
import type { PrismaService } from "../prisma/prisma.service";
import { OperationsService } from "./operations.service";

describe("Stock Opname lifecycle", () => {
  const actor = { Actor: "approver", ActorSource: "SSO" as const, RequestId: "req-1" };
  it("requires every snapshot detail to be processed before verify", async () => {
    const prisma = { stockOpname: { findUnique: jest.fn(async () => ({ Id: 1, Status: "IN_PROGRESS", Details: [{ IsPresent: null }] })) } };
    const service = new OperationsService(prisma as unknown as PrismaService, {} as AuditService);
    await expect(service.transitionStock(1, "verify", actor)).rejects.toBeInstanceOf(ConflictException);
  });
  it("enforces segregation of verifier and approver", async () => {
    const prisma = { stockOpname: { findUnique: jest.fn(async () => ({ Id: 1, Status: "VERIFIED", VerifiedBy: "approver", Details: [{ IsPresent: true }] })) } };
    const service = new OperationsService(prisma as unknown as PrismaService, {} as AuditService);
    await expect(service.transitionStock(1, "approve", actor)).rejects.toThrow("Verifier and approver must be different users");
  });
  it("does not allow cancellation after a scan", async () => {
    const prisma = { stockOpname: { findUnique: jest.fn(async () => ({ Id: 1, Status: "OPEN", Details: [{ IsPresent: true, ScannedAt: new Date() }] })) } };
    const service = new OperationsService(prisma as unknown as PrismaService, {} as AuditService);
    await expect(service.transitionStock(1, "cancel", actor)).rejects.toBeInstanceOf(ConflictException);
  });
});
