import { Controller, Get, Query } from "@nestjs/common";
import { Permissions } from "@vuteq/sso-client-nest";
import { DepartmentDirectoryQueryDto, EmployeeDirectoryQueryDto } from "./employee-directory.dto";
import { EmployeeDirectoryService } from "./employee-directory.service";

@Controller({ path: "employees", version: "1" })
export class EmployeeDirectoryController {
  constructor(private readonly service: EmployeeDirectoryService) {}

  @Get()
  @Permissions("ITAM.ASSET_READ")
  list(@Query() query: EmployeeDirectoryQueryDto) {
    return this.service.list(query);
  }
}

@Controller({ path: "departments", version: "1" })
export class DepartmentDirectoryController {
  constructor(private readonly service: EmployeeDirectoryService) {}

  @Get()
  @Permissions("ITAM.ASSET_READ")
  list(@Query() query: DepartmentDirectoryQueryDto) {
    return this.service.listDepartments(query);
  }
}
