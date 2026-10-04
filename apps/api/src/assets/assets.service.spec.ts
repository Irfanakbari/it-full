import { BadRequestException, NotFoundException } from "@nestjs/common";
import type { AuditService } from "../audit/audit.service";
import type { ActorContext } from "../common/api.types";
import type { NasUploadService } from "../common/nas-upload.service";
import type { EmployeeDirectoryService } from "../employee-directory/employee-directory.service";
import type { PrismaService } from "../prisma/prisma.service";
import { DepartmentAssignmentQueryDto } from "./assets.dto";
import { AssetsService } from "./assets.service";

const actor: ActorContext = { Actor: "tester", ActorSource: "SSO", RequestId: "request-1" };
const activeAsset = { Id: 7, DepartmentCode: "IT", IsActive: true, IsDisposed: false, DeletedAt: null };

describe("AssetsService department mutations", () => {
  function setup(overrides: { asset?: typeof activeAsset | null; latest?: { Id: number; StartUsed: Date } | null; departmentError?: Error } = {}) {
    const tx = {
      asset: {
        findFirst: jest.fn().mockResolvedValue(overrides.asset === undefined ? activeAsset : overrides.asset),
        update: jest.fn().mockResolvedValue({ ...activeAsset, DepartmentCode: "HR" }),
      },
      assetDepartmentAssignment: {
        findFirst: jest.fn().mockResolvedValue(overrides.latest ?? null),
        create: jest.fn().mockResolvedValue({ Id: 9, AssetId: 7, DepartmentCode: "HR" }),
      },
    };
    const prisma = { asset: { findFirst: jest.fn().mockResolvedValue(overrides.asset === undefined ? activeAsset : overrides.asset) } };
    const employeeDirectory = {
      resolveDepartment: overrides.departmentError
        ? jest.fn().mockRejectedValue(overrides.departmentError)
        : jest.fn().mockResolvedValue({ Code: "HR", Name: "Human Resources" }),
    };
    const audit = {
      execute: jest.fn(async (input: { prepare?: () => Promise<unknown>; operation: (transaction: typeof tx, prepared: unknown) => Promise<unknown> }) => {
        const prepared = input.prepare ? await input.prepare() : undefined;
        return input.operation(tx, prepared);
      }),
    };
    const service = new AssetsService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
      employeeDirectory as unknown as EmployeeDirectoryService,
      {} as NasUploadService,
    );
    return { service, tx, audit, employeeDirectory };
  }

  it("appends immutable history and updates the asset in one audited operation", async () => {
    const { service, tx, audit } = setup();
    const result = await service.assignDepartment({ AssetId: 7, DepartmentCode: "HR", StartUsed: "2026-01-02", Notes: "Transfer" }, actor);

    expect(result.message).toBe("Department mutation completed");
    expect(tx.assetDepartmentAssignment.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      AssetId: 7,
      DepartmentCode: "HR",
      DepartmentName: "Human Resources",
      Notes: "Transfer",
      CreatedBy: "tester",
    }) });
    expect(tx.asset.update).toHaveBeenCalledWith({ where: { Id: 7 }, data: { DepartmentCode: "HR", UpdatedBy: "tester" } });
    expect(audit.execute).toHaveBeenCalledWith(expect.objectContaining({ functionId: "ASSET_ASSIGN_DEPARTMENT", action: "ASSIGN_DEPARTMENT" }));
  });

  it.each([
    [{ ...activeAsset, IsActive: false }, "Only active, non-disposed assets"],
    [{ ...activeAsset, IsDisposed: true }, "Only active, non-disposed assets"],
    [{ ...activeAsset, DepartmentCode: "HR" }, "already assigned"],
  ])("rejects invalid asset state without appending history", async (asset, message) => {
    const { service, tx } = setup({ asset });
    await expect(service.assignDepartment({ AssetId: 7, DepartmentCode: "HR", StartUsed: "2026-01-02" }, actor)).rejects.toThrow(message);
    expect(tx.assetDepartmentAssignment.create).not.toHaveBeenCalled();
  });

  it("rejects a date that is not later than the latest assignment", async () => {
    const { service, tx } = setup({ latest: { Id: 8, StartUsed: new Date("2026-02-01") } });
    await expect(service.assignDepartment({ AssetId: 7, DepartmentCode: "HR", StartUsed: "2026-02-01" }, actor)).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.assetDepartmentAssignment.create).not.toHaveBeenCalled();
  });

  it("rejects unknown assets and departments", async () => {
    const missingAsset = setup({ asset: null });
    await expect(missingAsset.service.assignDepartment({ AssetId: 7, DepartmentCode: "HR", StartUsed: "2026-01-02" }, actor)).rejects.toBeInstanceOf(NotFoundException);

    const missingDepartment = setup({ departmentError: new NotFoundException("Department not found") });
    await expect(missingDepartment.service.assignDepartment({ AssetId: 7, DepartmentCode: "XX", StartUsed: "2026-01-02" }, actor)).rejects.toThrow("Department not found");
  });

  it("records future-date rejection through the audited mutation flow", async () => {
    const { service, audit } = setup();
    await expect(service.assignDepartment({ AssetId: 7, DepartmentCode: "HR", StartUsed: "2999-01-01" }, actor)).rejects.toThrow("future");
    expect(audit.execute).toHaveBeenCalledWith(expect.objectContaining({ functionId: "ASSET_ASSIGN_DEPARTMENT" }));
  });

  it("derives LastUsed from the next immutable assignment and returns page metadata", async () => {
    const first = { Id: 1, AssetId: 7, DepartmentCode: "IT", DepartmentName: null, StartUsed: new Date("2025-01-01"), Notes: null, CreatedAt: new Date("2025-01-01"), CreatedBy: "migration", Asset: { Id: 7, AssetTag: "IT-0007", Name: "Laptop" } };
    const prisma = {
      assetDepartmentAssignment: {
        findMany: jest.fn()
          .mockResolvedValueOnce([first])
          .mockResolvedValueOnce([
            { Id: 1, AssetId: 7, StartUsed: new Date("2025-01-01") },
            { Id: 2, AssetId: 7, StartUsed: new Date("2026-01-01") },
          ]),
        count: jest.fn().mockResolvedValue(1),
      },
    };
    const directory = { resolveDepartmentNames: jest.fn().mockResolvedValue(new Map([["IT", "Information Technology"]])) };
    const service = new AssetsService(
      prisma as unknown as PrismaService,
      {} as AuditService,
      directory as unknown as EmployeeDirectoryService,
      {} as NasUploadService,
    );
    const query = new DepartmentAssignmentQueryDto();

    const result = await service.departmentAssignmentList(query);

    expect(result.meta).toEqual({ page: 1, limit: 50, totalItems: 1, totalPages: 1 });
    expect(result.data[0]).toMatchObject({ DepartmentName: "Information Technology", LastUsed: new Date("2026-01-01") });
  });
});

describe("AssetsService asset attributes", () => {
  function setup(attributeIds = [3, 4]) {
    const tx = {
      category: { findFirst: jest.fn().mockResolvedValue({ Code: "LT" }) },
      location: { findFirst: jest.fn().mockResolvedValue({ Code: "JKT" }) },
      attributeDefinition: { findMany: jest.fn().mockResolvedValue(attributeIds.map((Id) => ({ Id }))) },
      asset: {
        create: jest.fn().mockResolvedValue({ Id: 12 }),
        update: jest.fn().mockResolvedValue({ Id: 12, AssetTag: "IT-LT-JKT-000012", Attributes: [] }),
      },
      assetDepartmentAssignment: { create: jest.fn().mockResolvedValue({ Id: 1 }) },
    };
    const audit = {
      execute: jest.fn(async (input: { prepare?: () => Promise<unknown>; operation: (transaction: typeof tx, prepared: unknown) => Promise<unknown> }) => {
        const prepared = input.prepare ? await input.prepare() : undefined;
        return input.operation(tx, prepared);
      }),
    };
    const directory = { resolveDepartment: jest.fn().mockResolvedValue({ Code: "IT", Name: "Information Technology" }) };
    const service = new AssetsService(
      {} as PrismaService,
      audit as unknown as AuditService,
      directory as unknown as EmployeeDirectoryService,
      {} as NasUploadService,
    );
    return { service, tx, audit };
  }

  const body = {
    Name: "Engineering Laptop",
    CategoryId: 1,
    LocationId: 2,
    DepartmentCode: "IT",
    Attributes: [
      { AttributeDefinitionId: 3, Value: " 16 GB " },
      { AttributeDefinitionId: 4, Value: "512 GB" },
    ],
  };

  it("creates selected attribute values atomically with the asset", async () => {
    const { service, tx } = setup();
    await service.create(body, actor);

    expect(tx.attributeDefinition.findMany).toHaveBeenCalledWith({ where: { Id: { in: [3, 4] }, IsActive: true, DeletedAt: null }, select: { Id: true } });
    expect(tx.asset.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      Name: "Engineering Laptop",
      Attributes: { create: [
        { AttributeDefinitionId: 3, Value: "16 GB", CreatedBy: "tester", UpdatedBy: "tester" },
        { AttributeDefinitionId: 4, Value: "512 GB", CreatedBy: "tester", UpdatedBy: "tester" },
      ] },
    }) });
  });

  it("rejects duplicate or inactive attribute definitions", async () => {
    const duplicate = setup();
    await expect(duplicate.service.create({ ...body, Attributes: [body.Attributes[0], body.Attributes[0]] }, actor)).rejects.toThrow("only be assigned once");
    expect(duplicate.tx.asset.create).not.toHaveBeenCalled();

    const inactive = setup([3]);
    await expect(inactive.service.create(body, actor)).rejects.toThrow("inactive or unavailable");
    expect(inactive.tx.asset.create).not.toHaveBeenCalled();
  });
});
