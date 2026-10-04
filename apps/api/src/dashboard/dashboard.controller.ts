import { Controller, Get } from "@nestjs/common";
import { Permissions } from "@vuteq/sso-client-nest";
import { DashboardService } from "./dashboard.service";

@Controller({ path: "dashboard", version: "1" })
export class DashboardController {
  constructor(private readonly service: DashboardService) {}
  @Get() @Permissions("ITAM.DASHBOARD_READ") overview() { return this.service.overview(); }
}

@Controller({ path: "notifications", version: "1" })
export class NotificationsController {
  constructor(private readonly service: DashboardService) {}
  @Get() @Permissions("ITAM.DASHBOARD_READ") list() { return this.service.notifications(); }
}
