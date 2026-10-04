import { randomUUID } from "node:crypto";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { basename } from "node:path";
import { AuditService } from "../audit/audit.service";
import type { ActorContext } from "../common/api.types";
import { pageMeta } from "../common/pagination.dto";
import { validateSupportUrl } from "../common/security.util";
import { NasUploadService } from "../common/nas-upload.service";
import { extensionForUpload, validateAssetUpload, type BufferedUpload } from "../common/upload-security.util";
import { EmployeeDirectoryService } from "../employee-directory/employee-directory.service";
import { PrismaService } from "../prisma/prisma.service";
import type { AssetQueryDto, AssignmentBodyDto, CreateAssetBodyDto, DepartmentAssignmentBodyDto, DepartmentAssignmentQueryDto, DisposalBodyDto, UpdateAssetBodyDto } from "./assets.dto";
import { buildAssetTag } from "./asset-tag";

const assetInclude = {
  Category: true,
  Location: true,
  Attributes: { include: { AttributeDefinition: true } },
};

@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly employeeDirectory: EmployeeDirectoryService,
    private readonly nas: NasUploadService,
  ) {}

  private async withDepartmentNames<T extends { DepartmentCode: string | null }>(records: T[]) {
    try {
      const names = await this.employeeDirectory.resolveDepartmentNames(records.flatMap((record) => record.DepartmentCode ? [record.DepartmentCode] : []));
      return records.map((record) => ({ ...record, DepartmentName: record.DepartmentCode ? names.get(record.DepartmentCode) ?? record.DepartmentCode : null }));
    } catch {
      return records.map((record) => ({ ...record, DepartmentName: record.DepartmentCode }));
    }
  }

  async list(query: AssetQueryDto) {
    const allowedSort = ["Id", "AssetTag", "Name", "SerialNumber", "CreatedAt", "WarrantyEnd"];
    const sortBy = query.sortBy && allowedSort.includes(query.sortBy) ? query.sortBy : "AssetTag";
    const search = query.search?.trim();
    const where = {
      DeletedAt: null,
      ...(query.CategoryId ? { CategoryId: query.CategoryId } : {}),
      ...(query.LocationId ? { LocationId: query.LocationId } : {}),
      ...(query.DepartmentCode ? { DepartmentCode: { contains: query.DepartmentCode, mode: "insensitive" as const } } : {}),
      ...(query.CurrentEmployeeNo ? { CurrentEmployeeNo: { contains: query.CurrentEmployeeNo, mode: "insensitive" as const } } : {}),
      ...(query.IsActive !== undefined ? { IsActive: query.IsActive } : {}),
      ...(query.IsDisposed !== undefined ? { IsDisposed: query.IsDisposed } : {}),
      ...(query.AssetTag ? { AssetTag: { contains: query.AssetTag, mode: "insensitive" as const } } : {}),
      ...(query.SerialNumber ? { SerialNumber: { contains: query.SerialNumber, mode: "insensitive" as const } } : {}),
      ...(search ? { OR: ["AssetTag", "Name", "HostName", "Brand", "Model", "SerialNumber", "DepartmentCode", "CurrentEmployeeNo", "CurrentEmployeeName"].map((field) => ({ [field]: { contains: search, mode: "insensitive" as const } })) } : {}),
    };
    const [data, totalItems] = await Promise.all([
      this.prisma.asset.findMany({ where, include: assetInclude, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: { [sortBy]: query.sortOrder } }),
      this.prisma.asset.count({ where }),
    ]);
    return { data: await this.withDepartmentNames(data), meta: pageMeta(query.page, query.limit, totalItems) };
  }

  async detail(id: number) {
    const data = await this.prisma.asset.findFirst({
      where: { Id: id, DeletedAt: null },
      include: {
        ...assetInclude,
        UserAssignments: { orderBy: { StartUsed: "desc" } },
        MaintenanceRecords: { where: { DeletedAt: null }, orderBy: { MaintenanceDate: "desc" } },
        Licenses: { where: { DeletedAt: null }, select: { Id: true, LicenseName: true, LicenseType: true, EndDate: true, IsActive: true } },
        Disposals: { orderBy: { DisposalDate: "desc" } },
      },
    });
    if (!data) throw new NotFoundException("Asset not found");
    return { data: (await this.withDepartmentNames([data]))[0] };
  }

  private cleanBody<T extends CreateAssetBodyDto | UpdateAssetBodyDto>(body: T) {
    const { Attributes: ignoredAttributes, ...assetBody } = body as CreateAssetBodyDto;
    void ignoredAttributes;
    return {
      ...assetBody,
      WarrantyStart: body.WarrantyStart ? new Date(body.WarrantyStart) : undefined,
      WarrantyEnd: body.WarrantyEnd ? new Date(body.WarrantyEnd) : undefined,
      PurchaseDate: body.PurchaseDate ? new Date(body.PurchaseDate) : undefined,
    };
  }

  async listAttachments(id: number) {
    const asset = await this.prisma.asset.findFirst({ where: { Id: id, DeletedAt: null }, select: { Id: true } });
    if (!asset) throw new NotFoundException("Asset not found");
    const attachments = await this.prisma.assetAttachment.findMany({
      where: { AssetId: id, DeletedAt: null },
      select: { Id: true, OriginalFileName: true, FileSize: true, MimeType: true, CreatedAt: true, CreatedBy: true },
      orderBy: { CreatedAt: "desc" },
    });
    const data = attachments.map((attachment) => ({ ...attachment, IsLegacy: attachment.FileSize === 0 && attachment.MimeType === "application/octet-stream" }));
    return { data };
  }

  async uploadAttachments(id: number, files: BufferedUpload[] | undefined, actor: ActorContext) {
    if (!files?.length) throw new BadRequestException("Select at least one file");
    if (files.length > 10) throw new BadRequestException("A maximum of 10 files can be uploaded per request");
    const asset = await this.prisma.asset.findFirst({ where: { Id: id, DeletedAt: null }, select: { Id: true, AssetTag: true } });
    if (!asset) throw new NotFoundException("Asset not found");

    const preparedFiles = files.map((file) => {
      const kind = validateAssetUpload(file);
      const originalName = [...basename(file.originalname)]
        .map((character) => {
          const code = character.charCodeAt(0);
          return code < 32 || code === 127 ? "_" : character;
        })
        .join("")
        .slice(0, 255) || `attachment.${extensionForUpload(kind)}`;
      return { file, originalName, storedName: `${randomUUID()}.${extensionForUpload(kind)}` };
    });
    const uploadedPaths: string[] = [];
    try {
      const data = await this.audit.execute({
        functionId: "ASSET_ATTACHMENT_UPLOAD", functionName: "Upload asset attachments", sourceType: "Asset", sourceId: String(id), action: "UPLOAD_ATTACHMENTS", actor,
        prepare: async () => {
          const uploaded = [];
          for (const item of preparedFiles) {
            const filePath = await this.nas.uploadFile({ fileName: item.storedName, fileBuffer: item.file.buffer, subFolder: asset.AssetTag });
            uploadedPaths.push(filePath);
            uploaded.push({ ...item, filePath });
          }
          return uploaded;
        },
        operation: async (tx, uploaded) => {
          const created = [];
          for (const item of uploaded) {
            created.push(await tx.assetAttachment.create({ data: {
              AssetId: id, FileName: item.storedName, FilePath: item.filePath, OriginalFileName: item.originalName,
              FileSize: item.file.size, MimeType: item.file.mimetype, CreatedBy: actor.Actor,
            } }));
          }
          return created;
        },
      });
      return { data, message: `${data.length} attachment(s) uploaded successfully` };
    } catch (error) {
      await Promise.allSettled(uploadedPaths.map((filePath) => this.nas.deleteFile(filePath)));
      throw error;
    }
  }

  async downloadAttachment(assetId: number, attachmentId: number) {
    const attachment = await this.prisma.assetAttachment.findFirst({ where: { Id: attachmentId, AssetId: assetId, DeletedAt: null } });
    if (!attachment) throw new NotFoundException("Attachment not found");
    if (attachment.FileSize === 0 && attachment.MimeType === "application/octet-stream") {
      throw new BadRequestException("This migrated legacy link is not a NAS-managed file");
    }
    const buffer = await this.nas.downloadFile(attachment.FilePath);
    return { buffer, fileName: attachment.OriginalFileName, mimeType: attachment.MimeType };
  }

  async deleteAttachment(assetId: number, attachmentId: number, actor: ActorContext) {
    const before = await this.prisma.assetAttachment.findFirst({ where: { Id: attachmentId, AssetId: assetId, DeletedAt: null } });
    if (!before) throw new NotFoundException("Attachment not found");
    const data = await this.audit.execute({
      functionId: "ASSET_ATTACHMENT_DELETE", functionName: "Delete asset attachment", sourceType: "AssetAttachment", sourceId: String(attachmentId), action: "DELETE", actor, before,
      prepare: async () => {
        if (!(before.FileSize === 0 && before.MimeType === "application/octet-stream")) await this.nas.deleteFile(before.FilePath);
      },
      operation: (tx) => tx.assetAttachment.update({ where: { Id: attachmentId }, data: { DeletedAt: new Date(), DeletedBy: actor.Actor } }),
    });
    return { data, message: "Attachment deleted successfully" };
  }

  async create(body: CreateAssetBodyDto, actor: ActorContext) {
    const attributeValues = body.Attributes ?? [];
    const attributeIds = attributeValues.map((attribute) => attribute.AttributeDefinitionId);
    const result = await this.audit.execute({
      functionId: "ASSET_CREATE", functionName: "Create asset", sourceType: "Asset", action: "CREATE", actor,
      prepare: async () => {
        if (new Set(attributeIds).size !== attributeIds.length) {
          throw new BadRequestException("Each attribute can only be assigned once");
        }
        return this.employeeDirectory.resolveDepartment(body.DepartmentCode);
      },
      operation: async (tx, department) => {
        const [category, location, attributes] = await Promise.all([
          tx.category.findFirst({ where: { Id: body.CategoryId, IsActive: true, DeletedAt: null }, select: { Code: true } }),
          tx.location.findFirst({ where: { Id: body.LocationId, IsActive: true, DeletedAt: null }, select: { Code: true } }),
          attributeIds.length ? tx.attributeDefinition.findMany({
            where: { Id: { in: attributeIds }, IsActive: true, DeletedAt: null },
            select: { Id: true },
          }) : Promise.resolve([]),
        ]);
        if (!category?.Code) throw new BadRequestException("Selected category does not have an active code");
        if (!location?.Code) throw new BadRequestException("Selected location does not have an active code");
        if (attributes.length !== attributeIds.length) throw new BadRequestException("One or more selected attributes are inactive or unavailable");

        const created = await tx.asset.create({
          data: {
            ...this.cleanBody(body),
            DepartmentCode: department.Code,
            AssetTag: `PENDING-${randomUUID()}`,
            CreatedBy: actor.Actor,
            UpdatedBy: actor.Actor,
            ...(attributeValues.length ? { Attributes: { create: attributeValues.map((attribute) => ({
              AttributeDefinitionId: attribute.AttributeDefinitionId,
              Value: attribute.Value.trim(),
              CreatedBy: actor.Actor,
              UpdatedBy: actor.Actor,
            })) } } : {}),
          },
        });
        const AssetTag = buildAssetTag({
          assetNumber: created.Id,
          departmentCode: department.Code,
          categoryCode: category.Code,
          locationCode: location.Code,
        });
        const asset = await tx.asset.update({ where: { Id: created.Id }, data: { AssetTag }, include: assetInclude });
        await tx.assetDepartmentAssignment.create({ data: {
          AssetId: created.Id,
          DepartmentCode: department.Code,
          DepartmentName: department.Name,
          StartUsed: new Date(),
          Notes: "Initial department at asset creation",
          CreatedBy: actor.Actor,
        } });
        return asset;
      },
      sourceId: (asset) => asset.AssetTag,
    });
    return { data: result, message: "Asset created successfully" };
  }

  async update(id: number, body: UpdateAssetBodyDto, actor: ActorContext) {
    const before = await this.prisma.asset.findFirst({ where: { Id: id, DeletedAt: null } });
    if (!before) throw new NotFoundException("Asset not found");
    if (body.DepartmentCode && body.DepartmentCode.toUpperCase() !== before.DepartmentCode?.toUpperCase()) {
      throw new BadRequestException("Use Department Mutations to change an asset department");
    }
    const result = await this.audit.execute({
      functionId: "ASSET_UPDATE", functionName: "Update asset", sourceType: "Asset", sourceId: String(id), action: "UPDATE", actor, before,
      operation: (tx) => tx.asset.update({
        where: { Id: id },
        data: {
          ...this.cleanBody(body),
          DepartmentCode: undefined,
          UpdatedBy: actor.Actor,
        },
        include: assetInclude,
      }),
    });
    return { data: result, message: "Asset updated successfully" };
  }

  async archive(id: number, actor: ActorContext) {
    const before = await this.prisma.asset.findFirst({ where: { Id: id, DeletedAt: null } });
    if (!before) throw new NotFoundException("Asset not found");
    const result = await this.audit.execute({
      functionId: "ASSET_ARCHIVE", functionName: "Archive asset", sourceType: "Asset", sourceId: String(id), action: "ARCHIVE", actor, before,
      operation: (tx) => tx.asset.update({ where: { Id: id }, data: { DeletedAt: new Date(), IsActive: false, UpdatedBy: actor.Actor } }),
    });
    return { data: result, message: "Asset archived successfully" };
  }

  async assignUser(body: AssignmentBodyDto, actor: ActorContext) {
    const before = await this.prisma.asset.findFirst({ where: { Id: body.AssetId, DeletedAt: null } });
    if (!before) throw new NotFoundException("Asset not found");
    const result = await this.audit.execute({
      functionId: "ASSET_ASSIGN_USER", functionName: "Assign asset to user", sourceType: "Asset", sourceId: String(body.AssetId), action: "ASSIGN_USER", actor, before,
      prepare: () => this.employeeDirectory.resolveActive(body.EmployeeNo),
      operation: async (tx, employee) => {
        const now = new Date();
        await tx.assetUserAssignment.updateMany({ where: { AssetId: body.AssetId, LastUsed: null }, data: { LastUsed: now, UpdatedBy: actor.Actor } });
        const assignment = await tx.assetUserAssignment.create({
          data: {
            AssetId: body.AssetId,
            EmployeeNo: employee.EmployeeNo,
            EmployeeName: employee.EmployeeName,
            StartUsed: body.StartUsed ? new Date(body.StartUsed) : now,
            Notes: body.Notes,
            CreatedBy: actor.Actor,
            UpdatedBy: actor.Actor,
          },
        });
        await tx.asset.update({
          where: { Id: body.AssetId },
          data: {
            CurrentEmployeeNo: employee.EmployeeNo,
            CurrentEmployeeName: employee.EmployeeName,
            UpdatedBy: actor.Actor,
          },
        });
        return assignment;
      },
    });
    return { data: result, message: "User assignment completed" };
  }

  async dispose(id: number, body: DisposalBodyDto, actor: ActorContext) {
    const before = await this.prisma.asset.findFirst({ where: { Id: id, DeletedAt: null } });
    if (!before) throw new NotFoundException("Asset not found");
    if (before.IsDisposed) throw new BadRequestException("Asset is already disposed");
    const result = await this.audit.execute({
      functionId: "ASSET_DISPOSE", functionName: "Dispose asset", sourceType: "Asset", sourceId: String(id), action: "DISPOSE", actor, before,
      operation: async (tx) => {
        const disposal = await tx.disposal.create({ data: { AssetId: id, DisposalDate: new Date(body.DisposalDate), Reason: body.Reason, SupportFile: validateSupportUrl(body.SupportFile), CreatedBy: actor.Actor } });
        await tx.asset.update({ where: { Id: id }, data: { IsDisposed: true, IsActive: false, CurrentEmployeeNo: null, CurrentEmployeeName: null, UpdatedBy: actor.Actor } });
        const now = new Date();
        await tx.assetUserAssignment.updateMany({ where: { AssetId: id, LastUsed: null }, data: { LastUsed: now, UpdatedBy: actor.Actor } });
        return disposal;
      },
    });
    return { data: result, message: "Asset disposed successfully" };
  }

  async assignmentList(query: AssetQueryDto) {
    const search = query.search?.trim();
    const where = search ? {
      OR: [
        { Asset: { AssetTag: { contains: search, mode: "insensitive" as const } } },
        { Asset: { Name: { contains: search, mode: "insensitive" as const } } },
        { EmployeeNo: { contains: search, mode: "insensitive" as const } },
        { EmployeeName: { contains: search, mode: "insensitive" as const } },
      ],
    } : {};
    const [data, totalItems] = await Promise.all([
      this.prisma.assetUserAssignment.findMany({ where, include: { Asset: true }, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: { StartUsed: "desc" } }),
      this.prisma.assetUserAssignment.count({ where }),
    ]);
    return { data, meta: pageMeta(query.page, query.limit, totalItems) };
  }

  async departmentAssignmentList(query: DepartmentAssignmentQueryDto) {
    const search = query.search?.trim();
    const where = {
      ...(query.AssetTag ? { Asset: { AssetTag: { contains: query.AssetTag, mode: "insensitive" as const } } } : {}),
      ...(query.DepartmentCode ? { DepartmentCode: { contains: query.DepartmentCode, mode: "insensitive" as const } } : {}),
      ...(search ? { OR: [
        { Asset: { AssetTag: { contains: search, mode: "insensitive" as const } } },
        { Asset: { Name: { contains: search, mode: "insensitive" as const } } },
        { DepartmentCode: { contains: search, mode: "insensitive" as const } },
        { DepartmentName: { contains: search, mode: "insensitive" as const } },
        { Notes: { contains: search, mode: "insensitive" as const } },
        { CreatedBy: { contains: search, mode: "insensitive" as const } },
      ] } : {}),
    };
    const allowedSort = ["Id", "DepartmentCode", "StartUsed", "CreatedAt", "CreatedBy"];
    const sortBy = query.sortBy && allowedSort.includes(query.sortBy) ? query.sortBy : "StartUsed";
    const [data, totalItems] = await Promise.all([
      this.prisma.assetDepartmentAssignment.findMany({
        where,
        include: { Asset: { select: { Id: true, AssetTag: true, Name: true } } },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { [sortBy]: query.sortOrder === "asc" ? "asc" : "desc" },
      }),
      this.prisma.assetDepartmentAssignment.count({ where }),
    ]);
    const assetIds = [...new Set(data.map((assignment) => assignment.AssetId))];
    const timelines = assetIds.length ? await this.prisma.assetDepartmentAssignment.findMany({
      where: { AssetId: { in: assetIds } },
      select: { Id: true, AssetId: true, StartUsed: true },
      orderBy: [{ AssetId: "asc" }, { StartUsed: "asc" }, { Id: "asc" }],
    }) : [];
    const lastUsed = new Map<number, Date>();
    for (let index = 0; index < timelines.length - 1; index += 1) {
      if (timelines[index].AssetId === timelines[index + 1].AssetId) lastUsed.set(timelines[index].Id, timelines[index + 1].StartUsed);
    }
    let departmentNames = new Map<string, string>();
    try {
      departmentNames = await this.employeeDirectory.resolveDepartmentNames(data.filter((item) => !item.DepartmentName).map((item) => item.DepartmentCode));
    } catch {
      // Stored snapshots and codes keep history available while ESSA is unavailable.
    }
    return {
      data: data.map((assignment) => ({
        ...assignment,
        DepartmentName: assignment.DepartmentName ?? departmentNames.get(assignment.DepartmentCode) ?? assignment.DepartmentCode,
        LastUsed: lastUsed.get(assignment.Id) ?? null,
      })),
      meta: pageMeta(query.page, query.limit, totalItems),
    };
  }

  async assignDepartment(body: DepartmentAssignmentBodyDto, actor: ActorContext) {
    const startUsed = new Date(body.StartUsed);
    const before = await this.prisma.asset.findFirst({ where: { Id: body.AssetId, DeletedAt: null } });
    const result = await this.audit.execute({
      functionId: "ASSET_ASSIGN_DEPARTMENT",
      functionName: "Assign asset to department",
      sourceType: "Asset",
      sourceId: String(body.AssetId),
      action: "ASSIGN_DEPARTMENT",
      actor,
      before,
      prepare: async () => {
        if (startUsed.getTime() > Date.now()) throw new BadRequestException("Start used cannot be in the future");
        return this.employeeDirectory.resolveDepartment(body.DepartmentCode);
      },
      operation: async (tx, department) => {
        const asset = await tx.asset.findFirst({ where: { Id: body.AssetId, DeletedAt: null } });
        if (!asset) throw new NotFoundException("Asset not found");
        if (!asset.IsActive || asset.IsDisposed) throw new BadRequestException("Only active, non-disposed assets can change department");
        if (asset.DepartmentCode?.toUpperCase() === department.Code) throw new BadRequestException("Asset is already assigned to this department");
        const latest = await tx.assetDepartmentAssignment.findFirst({
          where: { AssetId: body.AssetId },
          orderBy: [{ StartUsed: "desc" }, { Id: "desc" }],
        });
        if (latest && startUsed.getTime() <= latest.StartUsed.getTime()) {
          throw new BadRequestException("Start used must be later than the latest department assignment");
        }
        const assignment = await tx.assetDepartmentAssignment.create({ data: {
          AssetId: body.AssetId,
          DepartmentCode: department.Code,
          DepartmentName: department.Name,
          StartUsed: startUsed,
          Notes: body.Notes,
          CreatedBy: actor.Actor,
        } });
        await tx.asset.update({ where: { Id: body.AssetId }, data: { DepartmentCode: department.Code, UpdatedBy: actor.Actor } });
        return assignment;
      },
    });
    return { data: result, message: "Department mutation completed" };
  }

  async disposalList(query: AssetQueryDto) {
    const where = query.search ? { OR: [{ Asset: { AssetTag: { contains: query.search, mode: "insensitive" as const } } }, { Reason: { contains: query.search, mode: "insensitive" as const } }] } : {};
    const [data, totalItems] = await Promise.all([
      this.prisma.disposal.findMany({ where, include: { Asset: true }, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: { DisposalDate: "desc" } }),
      this.prisma.disposal.count({ where }),
    ]);
    return { data, meta: pageMeta(query.page, query.limit, totalItems) };
  }
}
