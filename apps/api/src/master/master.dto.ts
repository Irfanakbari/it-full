import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { PaginationQueryDto } from "../common/pagination.dto";

export class MasterQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() Name?: string;
  @IsOptional() @IsString() Code?: string;
  @IsOptional() @IsString() Key?: string;
  @IsOptional() @Transform(({ value }) => value === true || value === "true") @IsBoolean() IsActive?: boolean;
}

export class MasterBodyDto {
  @IsOptional() @Transform(({ value }) => typeof value === "string" ? value.trim().toUpperCase() : value) @IsString() @MaxLength(3) Code?: string;
  @IsOptional() @IsString() @MaxLength(150) Name?: string;
  @IsOptional() @IsString() @MaxLength(255) Description?: string;
  @IsOptional() @IsString() @MaxLength(255) Address?: string;
  @IsOptional() @IsString() @MaxLength(50) Floor?: string;
  @IsOptional() @IsString() @MaxLength(80) Room?: string;
  @IsOptional() @IsString() @MaxLength(120) Key?: string;
  @IsOptional() @IsBoolean() IsActive?: boolean;
}
