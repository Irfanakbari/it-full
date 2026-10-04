import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class EmployeeDirectoryQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(["EmployeeNo", "EmployeeName"])
  sortBy?: "EmployeeNo" | "EmployeeName";

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
  FirstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  LastName?: string;
}

export class DepartmentDirectoryQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}
