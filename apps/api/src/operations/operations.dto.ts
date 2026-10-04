import { Transform, Type } from "class-transformer";
import { IsBoolean, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUrl, Min } from "class-validator";
import { PaginationQueryDto } from "../common/pagination.dto";

export class OperationQueryDto extends PaginationQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) AssetId?: number;
  @IsOptional() @IsString() Status?: string;
  @IsOptional() @Transform(({ value }) => value === true || value === "true") @IsBoolean() IsClosed?: boolean;
  @IsOptional() @Transform(({ value }) => value === true || value === "true") @IsBoolean() IsActive?: boolean;
}

export class MaintenanceBodyDto {
  @Type(() => Number) @IsInt() @Min(1) AssetId!: number;
  @IsDateString() MaintenanceDate!: string;
  @IsString() MaintenanceType!: string;
  @IsOptional() @IsDateString() MaintenanceEnd?: string;
  @IsOptional() @IsBoolean() IsClosed?: boolean;
  @IsOptional() @IsUrl({ protocols: ["https"], require_protocol: true }) SupportFile?: string;
  @IsOptional() @IsString() Problem?: string;
  @IsOptional() @IsString() Description?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) Cost?: number;
  @IsOptional() @IsString() Vendor?: string;
  @IsOptional() @IsBoolean() IsInternal?: boolean;
  @IsOptional() @IsString() PerformedBy?: string;
}

export class LicenseBodyDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) AssetId?: number;
  @IsString() LicenseName!: string;
  @IsOptional() @IsString() LicenseKey?: string;
  @IsString() LicenseType!: string;
  @IsOptional() @IsString() LicenseRemark?: string;
  @IsOptional() @IsUrl({ protocols: ["https"], require_protocol: true }) SupportFile?: string;
  @IsOptional() @IsDateString() StartDate?: string;
  @IsOptional() @IsDateString() EndDate?: string;
  @IsOptional() @IsBoolean() IsActive?: boolean;
}

export class StockOpnameBodyDto {
  @IsString() DocNumber!: string;
  @IsDateString() OpnameDate!: string;
  @IsOptional() @IsString() Period?: string;
  @IsOptional() @IsString() Remark?: string;
}

export class StockScanDto {
  @Type(() => Number) @IsInt() @Min(1) AssetId!: number;
  @IsBoolean() IsPresent!: boolean;
  @IsOptional() @IsIn(["GOOD", "DAMAGED", "LOST"]) Condition?: "GOOD" | "DAMAGED" | "LOST";
  @IsOptional() @IsString() Notes?: string;
  @IsOptional() @IsUrl({ protocols: ["https"], require_protocol: true }) PictureUrl?: string;
}
