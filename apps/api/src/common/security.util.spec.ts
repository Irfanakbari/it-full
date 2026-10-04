import { BadRequestException } from "@nestjs/common";
import { decryptSecret, encryptSecret, maskSecret, validateSupportUrl } from "./security.util";

describe("security utilities", () => {
  beforeAll(() => { process.env.LICENSE_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64"); });
  it("encrypts with a random IV and authenticates decryption", () => {
    const first = encryptSecret("AAAA-BBBB-CCCC");
    const second = encryptSecret("AAAA-BBBB-CCCC");
    expect(first).not.toBe(second);
    expect(decryptSecret(first)).toBe("AAAA-BBBB-CCCC");
    expect(maskSecret(first)).toBe("••••••••");
    const parts = first.split(".");
    parts[3] = Buffer.from("tampered").toString("base64");
    expect(() => decryptSecret(parts.join("."))).toThrow();
  });
  it("accepts only HTTPS support URLs", () => {
    expect(validateSupportUrl("https://files.vuteq.co.id/a.pdf")).toBe("https://files.vuteq.co.id/a.pdf");
    expect(() => validateSupportUrl("http://files.vuteq.co.id/a.pdf")).toThrow(BadRequestException);
    expect(() => validateSupportUrl("not-a-url")).toThrow(BadRequestException);
  });
});
