import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("browser API boundary", () => {
  it("uses the same-origin BFF in client data thunks", () => {
    const source = readFileSync(join(process.cwd(), "lib/client-api.ts"), "utf8");
    expect(source).toContain("/api/proxy/v1/");
    expect(source).not.toContain("process.env.API_URL");
    expect(source).not.toMatch(/https?:\/\//);
  });
});
