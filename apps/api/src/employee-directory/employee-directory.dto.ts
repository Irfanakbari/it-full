import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { PaginationQueryDto } from "../common/pagination.dto";

export class EmployeeDirectoryQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(["EmployeeNo", "EmployeeName"])
  declare sortBy?: "EmployeeNo" | "EmployeeName";

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder: "asc" | "desc" = "asc";

  @IsOptional()
  @IsString()
  @MaxLength(30)
  EmployeeNo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  EmployeeName?: string;
}

export class DepartmentDirectoryQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(["Code", "Name"])
  declare sortBy?: "Code" | "Name";

  @IsOptional()
  @IsString()
  @MaxLength(15)
  Code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  Name?: string;
}
