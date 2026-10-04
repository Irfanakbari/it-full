import { Module } from "@nestjs/common";
import { PermissionsController, RolesController, SystemLogsController, UsersController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({ controllers: [UsersController, RolesController, PermissionsController, SystemLogsController], providers: [AdminService] })
export class AdminModule {}
