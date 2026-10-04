import { Module } from "@nestjs/common";
import { DashboardController, NotificationsController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";

@Module({ controllers: [DashboardController, NotificationsController], providers: [DashboardService] })
export class DashboardModule {}
