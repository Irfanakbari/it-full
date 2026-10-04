import { BadRequestException } from "@nestjs/common";
import { buildAssetTag } from "./asset-tag";

describe("buildAssetTag", () => {
  it("builds the required uppercase asset tag format", () => {
    expect(buildAssetTag({
      assetNumber: 1,
      departmentCode: "it",
      categoryCode: "pr",
      locationCode: "krw",
      date: new Date("2026-10-03T00:00:00.000Z"),
    })).toBe("0001-IT-PR-KRW-26");
  });

  it("rejects numbers that cannot fit in four digits", () => {
    expect(() => buildAssetTag({
      assetNumber: 10000,
      departmentCode: "IT",
      categoryCode: "PR",
      locationCode: "KRW",
    })).toThrow(BadRequestException);
  });
});
