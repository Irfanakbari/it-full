import { Module } from "@nestjs/common";
import { EmployeeDirectoryModule } from "../employee-directory/employee-directory.module";
import { NasUploadService } from "../common/nas-upload.service";
import { AssetDepartmentAssignmentsController, AssetsController, AssetUserAssignmentsController, DisposalsController } from "./assets.controller";
import { AssetsService } from "./assets.service";

@Module({
  imports: [EmployeeDirectoryModule],
  controllers: [AssetsController, AssetUserAssignmentsController, AssetDepartmentAssignmentsController, DisposalsController],
  providers: [AssetsService, NasUploadService],
})
export class AssetsModule {}
