import { Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import type { ActorContext } from "../common/api.types";
import { pageMeta } from "../common/pagination.dto";
import { PrismaService } from "../prisma/prisma.service";
import type { AdminQueryDto, AssignRoleDto, RoleBodyDto } from "./admin.dto";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async users(query: AdminQueryDto) {
    const where = { ...(query.IsActive !== undefined ? { IsActive: query.IsActive } : {}), ...(query.Name ? { Name: { contains: query.Name, mode: "insensitive" as const } } : {}), ...(query.UserName ? { UserName: { contains: query.UserName, mode: "insensitive" as const } } : {}), ...(query.RoleName ? { Role: { RoleName: query.RoleName } } : {}), ...(query.search ? { OR: [{ Name: { contains: query.search, mode: "insensitive" as const } }, { UserName: { contains: query.search, mode: "insensitive" as const } }, { Email: { contains: query.search, mode: "insensitive" as const } }] } : {}) };
    const [data, totalItems] = await Promise.all([
      this.prisma.appUser.findMany({ where, include: { Role: true }, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: { Name: "asc" } }),
      this.prisma.appUser.count({ where }),
    ]);
    return { data, meta: pageMeta(query.page, query.limit, totalItems) };
  }

  async assignRole(id: string, body: AssignRoleDto, actor: ActorContext) {
    const before = await this.prisma.appUser.findUnique({ where: { Id: id }, include: { Role: true } });
    if (!before) throw new NotFoundException("User not found");
    const result = await this.audit.execute({ functionId: "USER_ROLE_UPDATE", functionName: "Update user authorization", sourceType: "AppUser", sourceId: id, action: "UPDATE_AUTHORIZATION", actor, before, operation: (tx) => tx.appUser.update({ where: { Id: id }, data: { RoleId: body.RoleId ?? null, IsActive: body.IsActive, UpdatedBy: actor.Actor }, include: { Role: true } }) });
    return { data: result, message: "User authorization updated" };
  }

  async roles(query: AdminQueryDto) {
    const where = { ...(query.IsActive !== undefined ? { IsActive: query.IsActive } : {}), ...(query.search ? { OR: [{ RoleName: { contains: query.search, mode: "insensitive" as const } }, { Description: { contains: query.search, mode: "insensitive" as const } }] } : {}) };
    const [data, totalItems] = await Promise.all([
      this.prisma.role.findMany({ where, include: { Permissions: true, _count: { select: { Users: true } } }, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: { RoleName: "asc" } }),
      this.prisma.role.count({ where }),
    ]);
    return { data, meta: pageMeta(query.page, query.limit, totalItems) };
  }

  async saveRole(id: number | null, body: RoleBodyDto, actor: ActorContext) {
    const before = id ? await this.prisma.role.findUnique({ where: { Id: id }, include: { Permissions: true } }) : null;
    if (id && !before) throw new NotFoundException("Role not found");
    const permissions = await this.prisma.permission.findMany({ where: { Action: { in: body.PermissionActions } }, select: { Id: true } });
    const result = await this.audit.execute({
      functionId: id ? "ROLE_UPDATE" : "ROLE_CREATE", functionName: id ? "Update role" : "Create role", sourceType: "Role", sourceId: id ? String(id) : body.RoleName, action: id ? "UPDATE" : "CREATE", actor, before,
      operation: (tx) => id
        ? tx.role.update({ where: { Id: id }, data: { RoleName: body.RoleName, Description: body.Description, IsActive: body.IsActive, UpdatedBy: actor.Actor, Permissions: { set: permissions.map(({ Id }) => ({ Id })) } }, include: { Permissions: true } })
        : tx.role.create({ data: { RoleName: body.RoleName, Description: body.Description, IsActive: body.IsActive, CreatedBy: actor.Actor, UpdatedBy: actor.Actor, Permissions: { connect: permissions.map(({ Id }) => ({ Id })) } }, include: { Permissions: true } }),
    });
    return { data: result, message: "Role saved" };
  }

  async permissions(query: AdminQueryDto) {
    const where = { ...(query.Action ? { Action: { contains: query.Action, mode: "insensitive" as const } } : {}), ...(query.search ? { OR: [{ Action: { contains: query.search, mode: "insensitive" as const } }, { Description: { contains: query.search, mode: "insensitive" as const } }] } : {}) };
    const [data, totalItems] = await Promise.all([
      this.prisma.permission.findMany({ where, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: { Action: "asc" } }),
      this.prisma.permission.count({ where }),
    ]);
    return { data, meta: pageMeta(query.page, query.limit, totalItems) };
  }

  async logs(query: AdminQueryDto) {
    const where = { ...(query.ProcessStatus ? { ProcessStatus: query.ProcessStatus } : {}), ...(query.FunctionId ? { FunctionId: { contains: query.FunctionId, mode: "insensitive" as const } } : {}), ...(query.FunctionName ? { FunctionName: { contains: query.FunctionName, mode: "insensitive" as const } } : {}), ...(query.search ? { OR: [{ FunctionId: { contains: query.search, mode: "insensitive" as const } }, { FunctionName: { contains: query.search, mode: "insensitive" as const } }, { RequestId: { contains: query.search, mode: "insensitive" as const } }, { CreatedBy: { contains: query.search, mode: "insensitive" as const } }] } : {}) };
    const [records, totalItems] = await Promise.all([
      this.prisma.logProcess.findMany({ where, include: { LogProcessDetails: true, AuditEvents: true }, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: { ProcessStart: "desc" } }),
      this.prisma.logProcess.count({ where }),
    ]);
    const userIds = [...new Set(records.map((item) => item.CreatedBy).filter((item): item is string => Boolean(item)))];
    const users = await this.prisma.appUser.findMany({ where: { SsoObjectId: { in: userIds } }, select: { SsoObjectId: true, Name: true } });
    const names = new Map(users.map((user) => [user.SsoObjectId, user.Name]));
    const data = records.map((record) => ({ ...record, ActorDisplayName: record.CreatedBy ? names.get(record.CreatedBy) ?? "System" : "System" }));
    return { data, meta: pageMeta(query.page, query.limit, totalItems) };
  }
}
