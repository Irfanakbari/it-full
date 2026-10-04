import { BadRequestException } from "@nestjs/common";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function encryptionKey() {
  const raw = process.env.LICENSE_ENCRYPTION_KEY;
  if (!raw) throw new Error("LICENSE_ENCRYPTION_KEY is required");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("LICENSE_ENCRYPTION_KEY must decode to 32 bytes");
  return key;
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), ciphertext.toString("base64")].join(".");
}

export function decryptSecret(value: string) {
  const [version, iv, tag, ciphertext] = value.split(".");
  if (version !== "v1" || !iv || !tag || !ciphertext) throw new Error("Invalid encrypted value");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export function maskSecret(value: string | null | undefined) {
  return value ? "••••••••" : null;
}

export function validateSupportUrl(value?: string | null) {
  if (!value) return value ?? null;
  let url: URL;
  try { url = new URL(value); } catch { throw new BadRequestException("SupportFile must be a valid HTTPS URL"); }
  if (url.protocol !== "https:") throw new BadRequestException("SupportFile must use HTTPS");
  return url.toString();
}
