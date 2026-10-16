import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { CurrentUser, Permissions, type VuteqUser } from "@vuteq/sso-client-nest";
import { actorContext } from "../common/actor";
import type { RequestWithContext } from "../common/api.types";
import { AdminQueryDto, AssignRoleDto, RoleBodyDto } from "./admin.dto";
import { AdminService } from "./admin.service";

@Controller({ path: "users", version: "1" })
export class UsersController {
  constructor(private readonly service: AdminService) {}
  @Get() @Permissions("ITAM.USER_MANAGEMENT") list(@Query() query: AdminQueryDto) { return this.service.users(query); }
  @Patch(":id/authorization") @Permissions("ITAM.USER_MANAGEMENT") update(@Param("id") id: string, @Body() body: AssignRoleDto, @Req() request: RequestWithContext, @CurrentUser() user: VuteqUser) { return this.service.assignRole(id, body, actorContext(request, user)); }
  @Delete(":id") @Permissions("ITAM.USER_MANAGEMENT") delete(@Param("id") id: string, @Req() request: RequestWithContext, @CurrentUser() user: VuteqUser) { return this.service.deleteUser(id, actorContext(request, user)); }
}

@Controller({ path: "roles", version: "1" })
export class RolesController {
  constructor(private readonly service: AdminService) {}
  @Get() @Permissions("ITAM.USER_MANAGEMENT") list(@Query() query: AdminQueryDto) { return this.service.roles(query); }
  @Post() @Permissions("ITAM.USER_MANAGEMENT") create(@Body() body: RoleBodyDto, @Req() request: RequestWithContext, @CurrentUser() user: VuteqUser) { return this.service.saveRole(null, body, actorContext(request, user)); }
  @Patch(":id") @Permissions("ITAM.USER_MANAGEMENT") update(@Param("id") id: string, @Body() body: RoleBodyDto, @Req() request: RequestWithContext, @CurrentUser() user: VuteqUser) { return this.service.saveRole(Number(id), body, actorContext(request, user)); }
}

@Controller({ path: "permissions", version: "1" })
export class PermissionsController {
  constructor(private readonly service: AdminService) {}
  @Get() @Permissions("ITAM.USER_MANAGEMENT") list(@Query() query: AdminQueryDto) { return this.service.permissions(query); }
}

@Controller({ path: "system-logs", version: "1" })
export class SystemLogsController {
  constructor(private readonly service: AdminService) {}
  @Get() @Permissions("ITAM.SYSTEM_LOG_READ") list(@Query() query: AdminQueryDto) { return this.service.logs(query); }
}
