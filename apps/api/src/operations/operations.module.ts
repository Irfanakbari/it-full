import { Module } from "@nestjs/common";
import { LicensesController, MaintenanceController, StockOpnamesController } from "./operations.controller";
import { OperationsService } from "./operations.service";

@Module({ controllers: [MaintenanceController, LicensesController, StockOpnamesController], providers: [OperationsService] })
export class OperationsModule {}
