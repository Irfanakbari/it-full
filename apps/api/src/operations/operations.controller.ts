import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { CurrentUser, Permissions, type VuteqUser } from "@vuteq/sso-client-nest";
import { actorContext } from "../common/actor";
import type { RequestWithContext } from "../common/api.types";
import { LicenseBodyDto, MaintenanceBodyDto, OperationQueryDto, StockOpnameBodyDto, StockScanDto } from "./operations.dto";
import { OperationsService } from "./operations.service";

@Controller({ path: "maintenance", version: "1" })
export class MaintenanceController {
  constructor(private readonly service: OperationsService) {}
  @Get() @Permissions("ITAM.MAINTENANCE_READ") list(@Query() query: OperationQueryDto) { return this.service.maintenanceList(query); }
  @Post() @Permissions("ITAM.MAINTENANCE_MANAGE") create(@Body() body: MaintenanceBodyDto, @Req() request: RequestWithContext, @CurrentUser() user: VuteqUser) { return this.service.createMaintenance(body, actorContext(request, user)); }
  @Patch(":id") @Permissions("ITAM.MAINTENANCE_MANAGE") update(@Param("id") id: string, @Body() body: MaintenanceBodyDto, @Req() request: RequestWithContext, @CurrentUser() user: VuteqUser) { return this.service.updateMaintenance(id, body, actorContext(request, user)); }
  @Delete(":id") @Permissions("ITAM.MAINTENANCE_MANAGE") archive(@Param("id") id: string, @Req() request: RequestWithContext, @CurrentUser() user: VuteqUser) { return this.service.archiveMaintenance(id, actorContext(request, user)); }
}

@Controller({ path: "licenses", version: "1" })
export class LicensesController {
  constructor(private readonly service: OperationsService) {}
  @Get() @Permissions("ITAM.LICENSE_READ") list(@Query() query: OperationQueryDto) { return this.service.licenseList(query); }
  @Post() @Permissions("ITAM.LICENSE_MANAGE") create(@Body() body: LicenseBodyDto, @Req() request: RequestWithContext, @CurrentUser() user: VuteqUser) { return this.service.createLicense(body, actorContext(request, user)); }
  @Post(":id/reveal") @Permissions("ITAM.LICENSE_SECRET_READ") reveal(@Param("id") id: string, @Req() request: RequestWithContext, @CurrentUser() user: VuteqUser) { return this.service.revealLicense(Number(id), actorContext(request, user)); }
  @Delete(":id") @Permissions("ITAM.LICENSE_MANAGE") archive(@Param("id") id: string, @Req() request: RequestWithContext, @CurrentUser() user: VuteqUser) { return this.service.archiveLicense(Number(id), actorContext(request, user)); }
}

@Controller({ path: "stock-opnames", version: "1" })
export class StockOpnamesController {
  constructor(private readonly service: OperationsService) {}
  @Get() @Permissions("ITAM.STOCK_OPNAME_READ") list(@Query() query: OperationQueryDto) { return this.service.stockList(query); }
  @Get(":id") @Permissions("ITAM.STOCK_OPNAME_READ") detail(@Param("id") id: string) { return this.service.stockDetail(Number(id)); }
  @Post() @Permissions("ITAM.STOCK_OPNAME_CREATE") create(@Body() body: StockOpnameBodyDto, @Req() request: RequestWithContext, @CurrentUser() user: VuteqUser) { return this.service.createStock(body, actorContext(request, user)); }
  @Post(":id/scan") @Permissions("ITAM.STOCK_OPNAME_SCAN") scan(@Param("id") id: string, @Body() body: StockScanDto, @Req() request: RequestWithContext, @CurrentUser() user: VuteqUser) { return this.service.scanStock(Number(id), body, actorContext(request, user)); }
  @Post(":id/verify") @Permissions("ITAM.STOCK_OPNAME_VERIFY") verify(@Param("id") id: string, @Req() request: RequestWithContext, @CurrentUser() user: VuteqUser) { return this.service.transitionStock(Number(id), "verify", actorContext(request, user)); }
  @Post(":id/approve") @Permissions("ITAM.STOCK_OPNAME_APPROVE") approve(@Param("id") id: string, @Req() request: RequestWithContext, @CurrentUser() user: VuteqUser) { return this.service.transitionStock(Number(id), "approve", actorContext(request, user)); }
  @Post(":id/close") @Permissions("ITAM.STOCK_OPNAME_CLOSE") close(@Param("id") id: string, @Req() request: RequestWithContext, @CurrentUser() user: VuteqUser) { return this.service.transitionStock(Number(id), "close", actorContext(request, user)); }
  @Post(":id/cancel") @Permissions("ITAM.STOCK_OPNAME_CANCEL") cancel(@Param("id") id: string, @Req() request: RequestWithContext, @CurrentUser() user: VuteqUser) { return this.service.transitionStock(Number(id), "cancel", actorContext(request, user)); }
}
