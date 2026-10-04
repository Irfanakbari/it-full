import { UnsupportedMediaTypeException } from "@nestjs/common";
import { validateAssetUpload, type BufferedUpload } from "./upload-security.util";

function upload(overrides: Partial<BufferedUpload>): BufferedUpload {
  return {
    originalname: "invoice.pdf",
    mimetype: "application/pdf",
    size: 8,
    buffer: Buffer.from("%PDF-1.7"),
    ...overrides,
  };
}

describe("validateAssetUpload", () => {
  it("accepts a file when extension, MIME type, and signature match", () => {
    expect(validateAssetUpload(upload({}))).toBe("pdf");
  });

  it("rejects a renamed file with a mismatched content signature", () => {
    expect(() => validateAssetUpload(upload({ buffer: Buffer.from("not a pdf") }))).toThrow(UnsupportedMediaTypeException);
  });

  it("rejects an allowed signature paired with the wrong MIME type", () => {
    expect(() => validateAssetUpload(upload({ mimetype: "image/png" }))).toThrow(UnsupportedMediaTypeException);
  });
});
