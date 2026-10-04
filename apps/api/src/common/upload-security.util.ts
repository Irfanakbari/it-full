import { UnsupportedMediaTypeException } from "@nestjs/common";
import { extname } from "node:path";

export type BufferedUpload = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

export type SupportedAssetUpload = "png" | "jpeg" | "pdf" | "gif" | "webp";

const MIME_TYPES: Record<SupportedAssetUpload, readonly string[]> = {
  png: ["image/png"],
  jpeg: ["image/jpeg"],
  pdf: ["application/pdf"],
  gif: ["image/gif"],
  webp: ["image/webp"],
};

const EXTENSIONS: Record<SupportedAssetUpload, readonly string[]> = {
  png: ["png"],
  jpeg: ["jpg", "jpeg"],
  pdf: ["pdf"],
  gif: ["gif"],
  webp: ["webp"],
};

function hasBytes(buffer: Buffer, offset: number, bytes: readonly number[]) {
  return bytes.every((byte, index) => buffer[offset + index] === byte);
}

function hasAscii(buffer: Buffer, offset: number, value: string) {
  return buffer.subarray(offset, offset + value.length).toString("ascii") === value;
}

function matchesSignature(kind: SupportedAssetUpload, buffer: Buffer) {
  switch (kind) {
    case "png": return hasBytes(buffer, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "jpeg": return buffer.length >= 4 && hasBytes(buffer, 0, [0xff, 0xd8, 0xff]);
    case "pdf": return hasAscii(buffer, 0, "%PDF-");
    case "gif": return hasAscii(buffer, 0, "GIF87a") || hasAscii(buffer, 0, "GIF89a");
    case "webp": return hasAscii(buffer, 0, "RIFF") && hasAscii(buffer, 8, "WEBP");
  }
}

export function validateAssetUpload(file: BufferedUpload): SupportedAssetUpload {
  const extension = extname(file.originalname).slice(1).toLowerCase();
  const kind = (Object.keys(EXTENSIONS) as SupportedAssetUpload[]).find((candidate) => EXTENSIONS[candidate].includes(extension));
  if (!kind || !MIME_TYPES[kind].includes(file.mimetype.toLowerCase()) || !matchesSignature(kind, file.buffer)) {
    throw new UnsupportedMediaTypeException("File extension, MIME type, and content signature must match. Supported extensions: pdf, jpg, jpeg, png, gif, webp");
  }
  return kind;
}

export function extensionForUpload(kind: SupportedAssetUpload) {
  return kind === "jpeg" ? "jpg" : kind;
}
