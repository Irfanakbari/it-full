import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from "class-validator";
import { PartialType } from "@nestjs/swagger";
import { PaginationQueryDto } from "../common/pagination.dto";

export class AssetQueryDto extends PaginationQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) CategoryId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) LocationId?: number;
  @IsOptional() @IsString() CurrentEmployeeNo?: string;
  @IsOptional() @IsString() DepartmentCode?: string;
  @IsOptional() @IsString() AssetTag?: string;
  @IsOptional() @IsString() SerialNumber?: string;
  @IsOptional() @Transform(({ value }) => value === true || value === "true") @IsBoolean() IsActive?: boolean;
  @IsOptional() @Transform(({ value }) => value === true || value === "true") @IsBoolean() IsDisposed?: boolean;
}

export class CreateAssetBodyDto {
  @IsString() @MaxLength(255) Name!: string;
  @IsOptional() @IsString() @MaxLength(120) HostName?: string;
  @IsOptional() @IsString() @MaxLength(120) Brand?: string;
  @IsOptional() @IsString() @MaxLength(120) Model?: string;
  @IsOptional() @IsString() @MaxLength(160) SerialNumber?: string;
  @IsOptional() @IsString() Notes?: string;
  @Type(() => Number) @IsInt() @Min(1) CategoryId!: number;
  @Type(() => Number) @IsInt() @Min(1) LocationId!: number;
  @Transform(({ value }) => typeof value === "string" ? value.trim().toUpperCase() : value) @IsString() @MaxLength(15) DepartmentCode!: string;
  @IsOptional() @IsDateString() WarrantyStart?: string;
  @IsOptional() @IsDateString() WarrantyEnd?: string;
  @IsOptional() @IsDateString() PurchaseDate?: string;
  @IsOptional() @IsBoolean() IsActive?: boolean;
}

export class UpdateAssetBodyDto extends PartialType(CreateAssetBodyDto) {}

export class AssignmentBodyDto {
  @Type(() => Number) @IsInt() @Min(1) AssetId!: number;
  @IsString() @MaxLength(30) EmployeeNo!: string;
  @IsOptional() @IsDateString() StartUsed?: string;
  @IsOptional() @IsString() @MaxLength(500) Notes?: string;
}

export class DisposalBodyDto {
  @IsDateString() DisposalDate!: string;
  @IsString() Reason!: string;
  @IsOptional() @IsUrl({ protocols: ["https"], require_protocol: true }) SupportFile?: string;
}
