import { AuditService } from "./audit.service";
import type { PrismaService } from "../prisma/prisma.service";

function harness() {
  const tx = { actionAuditEvent: { create: jest.fn(async ({ data }) => data) } };
  const prisma = {
    logProcess: { create: jest.fn(async ({ data }) => data), update: jest.fn(async ({ data }) => data) },
    logProcessDetail: { create: jest.fn(async ({ data }) => data) },
    $transaction: jest.fn(async (work: unknown) => typeof work === "function" ? (work as (value: typeof tx) => Promise<unknown>)(tx) : Promise.all(work as Promise<unknown>[])),
  };
  return { service: new AuditService(prisma as unknown as PrismaService), prisma, tx };
}

describe("AuditService", () => {
  const actor = { Actor: "sso-sub", ActorSource: "SSO" as const, RequestId: "request-1" };
  it("records actor, request ID, before and after around a successful transaction", async () => {
    const { service, prisma, tx } = harness();
    const result = await service.execute({ functionId: "ASSET_UPDATE", functionName: "Update asset", sourceType: "Asset", sourceId: "7", action: "UPDATE", actor, before: { Name: "Old" }, operation: async () => ({ Name: "New" }) });
    expect(result).toEqual({ Name: "New" });
    expect(tx.actionAuditEvent.create).toHaveBeenCalledWith({ data: expect.objectContaining({ Actor: "sso-sub", RequestId: "request-1", Before: { Name: "Old" }, After: { Name: "New" } }) });
    expect(prisma.logProcess.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ ProcessStatus: "SUCCESS" }) }));
  });
  it("rolls back the domain transaction then marks the process failed separately", async () => {
    const { service, prisma } = harness();
    await expect(service.execute({ functionId: "FAIL", functionName: "Failure", sourceType: "Asset", sourceId: "7", action: "UPDATE", actor, operation: async () => { throw new Error("database unavailable"); } })).rejects.toThrow("database unavailable");
    expect(prisma.logProcess.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ ProcessStatus: "FAILED" }) }));
    expect(prisma.logProcessDetail.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ MessageId: "FAILED" }) }));
  });
  it("records a failed process when mutation preparation fails before the domain transaction", async () => {
    const { service, prisma } = harness();
    await expect(service.execute({
      functionId: "ASSET_ASSIGN_USER",
      functionName: "Assign asset to user",
      sourceType: "Asset",
      sourceId: "7",
      action: "ASSIGN_USER",
      actor,
      prepare: async () => { throw new Error("employee directory unavailable"); },
      operation: async () => ({ Id: "never-created" }),
    })).rejects.toThrow("employee directory unavailable");
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.logProcess.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ ProcessStatus: "FAILED" }) }));
  });
});
