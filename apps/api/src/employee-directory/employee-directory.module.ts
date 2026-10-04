import { Module } from "@nestjs/common";
import { DepartmentDirectoryController, EmployeeDirectoryController } from "./employee-directory.controller";
import { EmployeeDirectoryService } from "./employee-directory.service";

@Module({
  controllers: [EmployeeDirectoryController, DepartmentDirectoryController],
  providers: [EmployeeDirectoryService],
  exports: [EmployeeDirectoryService],
})
export class EmployeeDirectoryModule {}
