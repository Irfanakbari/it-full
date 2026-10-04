import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Matches,
  Min,
  ValidateNested,
} from "class-validator";
import { OmitType, PartialType } from "@nestjs/swagger";
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

export class AssetAttributeInputDto {
  @Type(() => Number) @IsInt() @Min(1) AttributeDefinitionId!: number;
  @IsString() @Matches(/\S/, { message: "Attribute value cannot be empty" }) @MaxLength(4000) Value!: string;
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
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => AssetAttributeInputDto)
  Attributes?: AssetAttributeInputDto[];
}

export class UpdateAssetBodyDto extends PartialType(OmitType(CreateAssetBodyDto, ["Attributes"] as const)) {}

export class AssignmentBodyDto {
  @Type(() => Number) @IsInt() @Min(1) AssetId!: number;
  @IsString() @MaxLength(30) EmployeeNo!: string;
  @IsOptional() @IsDateString() StartUsed?: string;
  @IsOptional() @IsString() @MaxLength(500) Notes?: string;
}

export class DepartmentAssignmentQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() @MaxLength(80) AssetTag?: string;
  @IsOptional() @IsString() @MaxLength(15) DepartmentCode?: string;
}

export class DepartmentAssignmentBodyDto {
  @Type(() => Number) @IsInt() @Min(1) AssetId!: number;
  @Transform(({ value }) => typeof value === "string" ? value.trim().toUpperCase() : value)
  @IsString() @MaxLength(15) DepartmentCode!: string;
  @IsDateString() StartUsed!: string;
  @IsOptional() @IsString() @MaxLength(500) Notes?: string;
}

export class DisposalBodyDto {
  @IsDateString() DisposalDate!: string;
  @IsString() Reason!: string;
  @IsOptional() @IsUrl({ protocols: ["https"], require_protocol: true }) SupportFile?: string;
}
