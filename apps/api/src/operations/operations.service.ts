import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import type { ActorContext } from "../common/api.types";
import { pageMeta } from "../common/pagination.dto";
import { decryptSecret, encryptSecret, maskSecret, validateSupportUrl } from "../common/security.util";
import { PrismaService } from "../prisma/prisma.service";
import type { LicenseBodyDto, MaintenanceBodyDto, OperationQueryDto, StockOpnameBodyDto, StockScanDto } from "./operations.dto";

@Injectable()
export class OperationsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async maintenanceList(query: OperationQueryDto) {
    const where = { DeletedAt: null, ...(query.AssetId ? { AssetId: query.AssetId } : {}), ...(query.IsClosed !== undefined ? { IsClosed: query.IsClosed } : {}), ...(query.search ? { OR: [{ MaintenanceType: { contains: query.search, mode: "insensitive" as const } }, { Problem: { contains: query.search, mode: "insensitive" as const } }, { Asset: { AssetTag: { contains: query.search, mode: "insensitive" as const } } }] } : {}) };
    const [data, totalItems] = await Promise.all([
      this.prisma.maintenance.findMany({ where, include: { Asset: true }, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: { MaintenanceDate: "desc" } }),
      this.prisma.maintenance.count({ where }),
    ]);
    return { data, meta: pageMeta(query.page, query.limit, totalItems) };
  }

  async createMaintenance(body: MaintenanceBodyDto, actor: ActorContext) {
    if (!body.IsClosed) {
      const open = await this.prisma.maintenance.findFirst({ where: { AssetId: body.AssetId, IsClosed: false, DeletedAt: null } });
      if (open) throw new ConflictException("This asset already has an open maintenance record");
    }
    const result = await this.audit.execute({
      functionId: "MAINTENANCE_CREATE", functionName: "Create maintenance", sourceType: "Maintenance", sourceId: String(body.AssetId), action: "CREATE", actor,
      operation: (tx) => tx.maintenance.create({ data: { ...body, MaintenanceDate: new Date(body.MaintenanceDate), MaintenanceEnd: body.MaintenanceEnd ? new Date(body.MaintenanceEnd) : null, SupportFile: validateSupportUrl(body.SupportFile), CreatedBy: actor.Actor, UpdatedBy: actor.Actor }, include: { Asset: true } }),
    });
    return { data: result, message: "Maintenance record created" };
  }

  async updateMaintenance(id: string, body: MaintenanceBodyDto, actor: ActorContext) {
    const before = await this.prisma.maintenance.findFirst({ where: { Id: id, DeletedAt: null } });
    if (!before) throw new NotFoundException("Maintenance record not found");
    if (!body.IsClosed) {
      const open = await this.prisma.maintenance.findFirst({ where: { AssetId: body.AssetId, IsClosed: false, DeletedAt: null, NOT: { Id: id } } });
      if (open) throw new ConflictException("This asset already has an open maintenance record");
    }
    const result = await this.audit.execute({
      functionId: "MAINTENANCE_UPDATE", functionName: "Update maintenance", sourceType: "Maintenance", sourceId: id, action: "UPDATE", actor, before,
      operation: (tx) => tx.maintenance.update({ where: { Id: id }, data: { ...body, MaintenanceDate: new Date(body.MaintenanceDate), MaintenanceEnd: body.MaintenanceEnd ? new Date(body.MaintenanceEnd) : null, SupportFile: validateSupportUrl(body.SupportFile), UpdatedBy: actor.Actor } }),
    });
    return { data: result, message: "Maintenance record updated" };
  }

  async archiveMaintenance(id: string, actor: ActorContext) {
    const before = await this.prisma.maintenance.findFirst({ where: { Id: id, DeletedAt: null } });
    if (!before) throw new NotFoundException("Maintenance record not found");
    const result = await this.audit.execute({ functionId: "MAINTENANCE_ARCHIVE", functionName: "Archive maintenance", sourceType: "Maintenance", sourceId: id, action: "ARCHIVE", actor, before, operation: (tx) => tx.maintenance.update({ where: { Id: id }, data: { DeletedAt: new Date(), UpdatedBy: actor.Actor } }) });
    return { data: result, message: "Maintenance record archived" };
  }

  async licenseList(query: OperationQueryDto) {
    const where = { DeletedAt: null, ...(query.AssetId ? { AssetId: query.AssetId } : {}), ...(query.IsActive !== undefined ? { IsActive: query.IsActive } : {}), ...(query.search ? { OR: [{ LicenseName: { contains: query.search, mode: "insensitive" as const } }, { LicenseType: { contains: query.search, mode: "insensitive" as const } }, { Asset: { AssetTag: { contains: query.search, mode: "insensitive" as const } } }] } : {}) };
    const [records, totalItems] = await Promise.all([
      this.prisma.license.findMany({ where, include: { Asset: true }, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: { LicenseName: "asc" } }),
      this.prisma.license.count({ where }),
    ]);
    const data = records.map(({ LicenseKeyCiphertext, ...record }) => ({ ...record, LicenseKey: maskSecret(LicenseKeyCiphertext) }));
    return { data, meta: pageMeta(query.page, query.limit, totalItems) };
  }

  async createLicense(body: LicenseBodyDto, actor: ActorContext) {
    const { LicenseKey, ...rest } = body;
    const result = await this.audit.execute({
      functionId: "LICENSE_CREATE", functionName: "Create license", sourceType: "License", sourceId: body.LicenseName, action: "CREATE", actor,
      operation: (tx) => tx.license.create({ data: { ...rest, LicenseKeyCiphertext: LicenseKey ? encryptSecret(LicenseKey) : null, SupportFile: validateSupportUrl(body.SupportFile), StartDate: body.StartDate ? new Date(body.StartDate) : null, EndDate: body.EndDate ? new Date(body.EndDate) : null, CreatedBy: actor.Actor, UpdatedBy: actor.Actor }, select: { Id: true, LicenseName: true, LicenseType: true, EndDate: true, IsActive: true } }),
    });
    return { data: result, message: "License created" };
  }

  async revealLicense(id: number, actor: ActorContext) {
    const license = await this.prisma.license.findFirst({ where: { Id: id, DeletedAt: null } });
    if (!license) throw new NotFoundException("License not found");
    const result = await this.audit.execute({
      functionId: "LICENSE_SECRET_READ", functionName: "Reveal license secret", sourceType: "License", sourceId: String(id), action: "REVEAL_SECRET", actor,
      operation: async () => ({ Id: license.Id, LicenseKey: license.LicenseKeyCiphertext ? decryptSecret(license.LicenseKeyCiphertext) : null }),
      after: () => ({ Id: license.Id, LicenseKey: "[REDACTED]" }),
    });
    return { data: result, message: "License secret revealed" };
  }

  async archiveLicense(id: number, actor: ActorContext) {
    const before = await this.prisma.license.findFirst({ where: { Id: id, DeletedAt: null } });
    if (!before) throw new NotFoundException("License not found");
    const result = await this.audit.execute({ functionId: "LICENSE_ARCHIVE", functionName: "Archive license", sourceType: "License", sourceId: String(id), action: "ARCHIVE", actor, before: { ...before, LicenseKeyCiphertext: "[REDACTED]" }, operation: (tx) => tx.license.update({ where: { Id: id }, data: { DeletedAt: new Date(), IsActive: false, UpdatedBy: actor.Actor }, select: { Id: true, LicenseName: true, IsActive: true, DeletedAt: true } }) });
    return { data: result, message: "License archived" };
  }

  async stockList(query: OperationQueryDto) {
    const statuses = ["OPEN", "IN_PROGRESS", "VERIFIED", "APPROVED", "CLOSED", "CANCELLED"] as const;
    const status = query.Status && statuses.includes(query.Status as typeof statuses[number]) ? query.Status as typeof statuses[number] : undefined;
    const where = { ...(status ? { Status: status } : {}), ...(query.search ? { OR: [{ DocNumber: { contains: query.search, mode: "insensitive" as const } }, { Period: { contains: query.search, mode: "insensitive" as const } }] } : {}) };
    const [data, totalItems] = await Promise.all([
      this.prisma.stockOpname.findMany({ where, include: { _count: { select: { Details: true } } }, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: { OpnameDate: "desc" } }),
      this.prisma.stockOpname.count({ where }),
    ]);
    return { data, meta: pageMeta(query.page, query.limit, totalItems) };
  }

  async stockDetail(id: number) {
    const data = await this.prisma.stockOpname.findUnique({ where: { Id: id }, include: { Details: { include: { Asset: { include: { Category: true, Location: true } } }, orderBy: { Asset: { AssetTag: "asc" } } } } });
    if (!data) throw new NotFoundException("Stock Opname not found");
    return { data };
  }

  async createStock(body: StockOpnameBodyDto, actor: ActorContext) {
    const active = await this.prisma.stockOpname.findFirst({ where: { Status: { in: ["OPEN", "IN_PROGRESS", "VERIFIED", "APPROVED"] } } });
    if (active) throw new ConflictException("Only one active Stock Opname is allowed");
    const assets = await this.prisma.asset.findMany({ where: { DeletedAt: null, IsActive: true, IsDisposed: false }, select: { Id: true } });
    const result = await this.audit.execute({
      functionId: "STOCK_OPNAME_CREATE", functionName: "Create Stock Opname snapshot", sourceType: "StockOpname", sourceId: body.DocNumber, action: "CREATE", actor,
      operation: (tx) => tx.stockOpname.create({ data: { DocNumber: body.DocNumber, OpnameDate: new Date(body.OpnameDate), Period: body.Period, Remark: body.Remark, CreatedBy: actor.Actor, UpdatedBy: actor.Actor, Details: { create: assets.map((asset) => ({ AssetId: asset.Id })) } }, include: { Details: true } }),
    });
    return { data: result, message: "Stock Opname snapshot created" };
  }

  async scanStock(id: number, body: StockScanDto, actor: ActorContext) {
    const opname = await this.prisma.stockOpname.findUnique({ where: { Id: id } });
    if (!opname) throw new NotFoundException("Stock Opname not found");
    if (!["OPEN", "IN_PROGRESS"].includes(opname.Status)) throw new ConflictException("Stock Opname cannot be scanned in its current state");
    const detail = await this.prisma.stockOpnameDetail.findUnique({ where: { StockOpnameId_AssetId: { StockOpnameId: id, AssetId: body.AssetId } } });
    if (!detail) throw new NotFoundException("Asset is not part of this Stock Opname snapshot");
    const result = await this.audit.execute({
      functionId: "STOCK_OPNAME_SCAN", functionName: "Scan Stock Opname asset", sourceType: "StockOpnameDetail", sourceId: String(detail.Id), action: "SCAN", actor, before: detail,
      operation: async (tx) => {
        const updated = await tx.stockOpnameDetail.update({ where: { Id: detail.Id }, data: { IsPresent: body.IsPresent, Condition: body.Condition, Notes: body.Notes, PictureUrl: validateSupportUrl(body.PictureUrl), ScannedAt: new Date(), ScannedBy: actor.Actor } });
        if (opname.Status === "OPEN") await tx.stockOpname.update({ where: { Id: id }, data: { Status: "IN_PROGRESS", UpdatedBy: actor.Actor } });
        return updated;
      },
    });
    return { data: result, message: "Asset scan saved" };
  }

  async transitionStock(id: number, action: "verify" | "approve" | "close" | "cancel", actor: ActorContext) {
    const opname = await this.prisma.stockOpname.findUnique({ where: { Id: id }, include: { Details: true } });
    if (!opname) throw new NotFoundException("Stock Opname not found");
    const now = new Date();
    let data: Record<string, unknown>;
    if (action === "verify") {
      if (opname.Status !== "IN_PROGRESS" || opname.Details.some((item) => item.IsPresent === null)) throw new ConflictException("Every snapshot item must be processed before verification");
      data = { Status: "VERIFIED", VerifiedBy: actor.Actor, VerifiedAt: now };
    } else if (action === "approve") {
      if (opname.Status !== "VERIFIED") throw new ConflictException("Stock Opname must be verified first");
      if (opname.VerifiedBy === actor.Actor) throw new ConflictException("Verifier and approver must be different users");
      data = { Status: "APPROVED", ApprovedBy: actor.Actor, ApprovedAt: now };
    } else if (action === "close") {
      if (opname.Status !== "APPROVED") throw new ConflictException("Stock Opname must be approved first");
      data = { Status: "CLOSED", ClosedBy: actor.Actor, ClosedAt: now };
    } else {
      if (opname.Status !== "OPEN" || opname.Details.some((item) => item.ScannedAt !== null)) throw new ConflictException("Only an unscanned OPEN Stock Opname may be cancelled");
      data = { Status: "CANCELLED", CancelledBy: actor.Actor, CancelledAt: now };
    }
    const result = await this.audit.execute({
      functionId: `STOCK_OPNAME_${action.toUpperCase()}`, functionName: `${action} Stock Opname`, sourceType: "StockOpname", sourceId: String(id), action: action.toUpperCase(), actor, before: opname,
      operation: (tx) => tx.stockOpname.update({ where: { Id: id }, data: { ...data, UpdatedBy: actor.Actor } }),
    });
    return { data: result, message: `Stock Opname ${action} completed` };
  }
}
