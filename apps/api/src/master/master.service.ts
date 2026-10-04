import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import type { ActorContext } from "../common/api.types";
import { pageMeta } from "../common/pagination.dto";
import { PrismaService } from "../prisma/prisma.service";
import type { MasterBodyDto, MasterQueryDto } from "./master.dto";

export type MasterResource = "category" | "location" | "attributeDefinition";

const config = {
  category: { search: ["Code", "Name", "Description"], sort: ["Id", "Code", "Name", "IsActive", "CreatedAt"] },
  location: { search: ["Code", "Name", "Address", "Floor", "Room"], sort: ["Id", "Code", "Name", "Floor", "Room", "CreatedAt"] },
  attributeDefinition: { search: ["Key", "Description"], sort: ["Id", "Key", "CreatedAt"] },
} satisfies Record<MasterResource, { search: string[]; sort: string[] }>;

type Delegate = {
  findMany(args: Record<string, unknown>): Promise<unknown[]>;
  count(args: Record<string, unknown>): Promise<number>;
  findFirst(args: Record<string, unknown>): Promise<Record<string, unknown> | null>;
  create(args: Record<string, unknown>): Promise<unknown>;
  update(args: Record<string, unknown>): Promise<unknown>;
};

@Injectable()
export class MasterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private delegate(resource: MasterResource): Delegate {
    return this.prisma[resource] as unknown as Delegate;
  }

  async list(resource: MasterResource, query: MasterQueryDto) {
    const options = config[resource];
    const sortBy = query.sortBy && options.sort.includes(query.sortBy) ? query.sortBy : options.sort[1];
    const search = query.search?.trim();
    const where: Record<string, unknown> = {
      DeletedAt: null,
      ...(query.IsActive !== undefined ? { IsActive: query.IsActive } : {}),
      ...(query.Name ? { Name: { contains: query.Name, mode: "insensitive" } } : {}),
      ...(query.Code ? { Code: { contains: query.Code, mode: "insensitive" } } : {}),
      ...(query.Key ? { Key: { contains: query.Key, mode: "insensitive" } } : {}),
      ...(search
        ? { OR: options.search.map((field) => ({ [field]: { contains: search, mode: "insensitive" } })) }
        : {}),
    };
    const delegate = this.delegate(resource);
    const [data, totalItems] = await Promise.all([
      delegate.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { [sortBy]: query.sortOrder },
      }),
      delegate.count({ where }),
    ]);
    return { data, meta: pageMeta(query.page, query.limit, totalItems) };
  }

  async detail(resource: MasterResource, id: string) {
    const Id = Number(id);
    if (!Number.isInteger(Id)) throw new BadRequestException("Invalid ID");
    const data = await this.delegate(resource).findFirst({ where: { Id, DeletedAt: null } });
    if (!data) throw new NotFoundException("Record not found");
    return { data };
  }

  private body(resource: MasterResource, dto: MasterBodyDto, requireIdentifiers = false) {
    const allowed: Record<MasterResource, (keyof MasterBodyDto)[]> = {
      category: ["Code", "Name", "Description", "IsActive"],
      location: ["Code", "Name", "Address", "Floor", "Room", "IsActive"],
      attributeDefinition: ["Key", "Description", "IsActive"],
    };
    const body = Object.fromEntries(
      allowed[resource]
        .filter((key) => dto[key] !== undefined)
        .map((key) => [key, dto[key]]),
    );
    if (resource === "category" || resource === "location") {
      const maxCodeLength = resource === "category" ? 2 : 3;
      if (body.Code !== undefined) body.Code = String(body.Code).trim().toUpperCase();
      if (body.Code !== undefined && (!body.Code || String(body.Code).length > maxCodeLength)) {
        throw new BadRequestException(`${resource === "category" ? "Category" : "Location"} code must be at most ${maxCodeLength} characters`);
      }
      if (body.Code !== undefined && !/^[A-Z0-9]+$/.test(String(body.Code))) {
        throw new BadRequestException("Code must contain only uppercase letters and numbers");
      }
      if (requireIdentifiers && !body.Code) throw new BadRequestException("Code is required");
      if (requireIdentifiers && !body.Name) throw new BadRequestException("Name is required");
    }
    if (resource === "attributeDefinition" && requireIdentifiers && !body.Key) throw new BadRequestException("Key is required");
    return body;
  }

  async create(resource: MasterResource, dto: MasterBodyDto, actor: ActorContext) {
    const body = this.body(resource, dto, true);
    const result = await this.audit.execute({
      functionId: `MASTER_${resource.toUpperCase()}_CREATE`,
      functionName: `Create ${resource}`,
      sourceType: resource,
      sourceId: "new",
      action: "CREATE",
      actor,
      operation: (tx) => (tx[resource] as unknown as Delegate).create({
        data: { ...body, CreatedBy: actor.Actor, UpdatedBy: actor.Actor },
      }),
    });
    return { data: result, message: "Record created successfully" };
  }

  async update(resource: MasterResource, id: string, dto: MasterBodyDto, actor: ActorContext) {
    const Id = Number(id);
    const delegate = this.delegate(resource);
    const before = await delegate.findFirst({ where: { Id, DeletedAt: null } });
    if (!before) throw new NotFoundException("Record not found");
    const body = this.body(resource, dto);
    const result = await this.audit.execute({
      functionId: `MASTER_${resource.toUpperCase()}_UPDATE`,
      functionName: `Update ${resource}`,
      sourceType: resource,
      sourceId: String(Id),
      action: "UPDATE",
      actor,
      before,
      operation: (tx) => (tx[resource] as unknown as Delegate).update({
        where: { Id },
        data: { ...body, UpdatedBy: actor.Actor },
      }),
    });
    return { data: result, message: "Record updated successfully" };
  }

  async archive(resource: MasterResource, id: string, actor: ActorContext) {
    const Id = Number(id);
    const before = await this.delegate(resource).findFirst({ where: { Id, DeletedAt: null } });
    if (!before) throw new NotFoundException("Record not found");
    const result = await this.audit.execute({
      functionId: `MASTER_${resource.toUpperCase()}_ARCHIVE`,
      functionName: `Archive ${resource}`,
      sourceType: resource,
      sourceId: String(Id),
      action: "ARCHIVE",
      actor,
      before,
      operation: (tx) => (tx[resource] as unknown as Delegate).update({
        where: { Id },
        data: { DeletedAt: new Date(), IsActive: false, UpdatedBy: actor.Actor },
      }),
    });
    return { data: result, message: "Record archived successfully" };
  }
}
