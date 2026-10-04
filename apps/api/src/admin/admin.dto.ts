import { Transform, Type } from "class-transformer";
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";
import { PaginationQueryDto } from "../common/pagination.dto";

export class AdminQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() Name?: string;
  @IsOptional() @IsString() UserName?: string;
  @IsOptional() @IsString() RoleName?: string;
  @IsOptional() @IsString() Action?: string;
  @IsOptional() @IsString() ProcessStatus?: string;
  @IsOptional() @IsString() FunctionId?: string;
  @IsOptional() @IsString() FunctionName?: string;
  @IsOptional() @Transform(({ value }) => value === true || value === "true") @IsBoolean() IsActive?: boolean;
}

export class AssignRoleDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) RoleId?: number | null;
  @IsBoolean() IsActive!: boolean;
}

export class RoleBodyDto {
  @IsString() RoleName!: string;
  @IsOptional() @IsString() Description?: string;
  @IsBoolean() IsActive = true;
  @IsArray() @IsString({ each: true }) PermissionActions!: string[];
}
