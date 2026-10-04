import { BadRequestException } from "@nestjs/common";

type AssetTagInput = {
  assetNumber: number;
  departmentCode: string;
  categoryCode: string;
  locationCode: string;
  date?: Date;
};

function normalizeComponent(value: string, label: string) {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z0-9]+$/.test(normalized)) {
    throw new BadRequestException(`${label} must contain only uppercase letters and numbers`);
  }
  return normalized;
}

export function buildAssetTag(input: AssetTagInput) {
  if (!Number.isInteger(input.assetNumber) || input.assetNumber < 1 || input.assetNumber > 9999) {
    throw new BadRequestException("Asset number must be between 1 and 9999");
  }
  const number = String(input.assetNumber).padStart(4, "0");
  const department = normalizeComponent(input.departmentCode, "Department code");
  const category = normalizeComponent(input.categoryCode, "Category code");
  const location = normalizeComponent(input.locationCode, "Location code");
  const year = new Intl.DateTimeFormat("en", { year: "2-digit", timeZone: "Asia/Jakarta" }).format(input.date ?? new Date());
  return `${number}-${department}-${category}-${location}-${year}`;
}
