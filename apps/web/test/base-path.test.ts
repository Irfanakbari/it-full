import { describe, expect, it } from "vitest";
import { BASE_PATH, withBasePath, withoutBasePath } from "@/lib/base-path";

describe("base-path helpers", () => {
  it("prefixes browser-facing paths exactly once", () => {
    expect(BASE_PATH).toBe("/it-asset");
    expect(withBasePath("/apps")).toBe("/it-asset/apps");
    expect(withBasePath("api/health")).toBe("/it-asset/api/health");
    expect(withBasePath("/it-asset/apps")).toBe("/it-asset/apps");
  });

  it("normalizes incoming base-path URLs for route matching", () => {
    expect(withoutBasePath("/it-asset")).toBe("/");
    expect(withoutBasePath("/it-asset/apps/assets")).toBe("/apps/assets");
    expect(withoutBasePath("/outside")).toBe("/outside");
  });
});
