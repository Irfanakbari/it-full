import { Injectable } from "@nestjs/common";

type NasApiResponse = { success: boolean; data?: { sid?: string }; error?: { code?: number } };

@Injectable()
export class NasUploadService {
  private config() {
    const values = {
      host: process.env.NAS_HOST?.trim(),
      port: process.env.NAS_PORT?.trim(),
      protocol: process.env.NAS_PROTOCOL?.trim(),
      user: process.env.NAS_USER?.trim(),
      password: process.env.NAS_PASSWORD,
      share: process.env.NAS_SMB_SHARE?.trim(),
      folder: process.env.NAS_SMB_SUBFOLDER?.trim(),
      baseUrl: process.env.NAS_BASE_URL?.trim(),
    };
    const missing = Object.entries(values).filter(([, value]) => !value).map(([key]) => key);
    if (missing.length) throw new Error(`NAS configuration is incomplete: ${missing.join(", ")}`);
    if (values.protocol !== "http" && values.protocol !== "https") throw new Error("NAS_PROTOCOL must be http or https");
    const baseUrl = new URL(values.baseUrl!);
    if (!["http:", "https:"].includes(baseUrl.protocol)) throw new Error("NAS_BASE_URL must use http or https");
    if (process.env.NODE_ENV === "production" && (values.protocol !== "https" || baseUrl.protocol !== "https:")) {
      throw new Error("NAS connections must use HTTPS in production");
    }
    return { ...values, protocol: values.protocol as "http" | "https", baseUrl } as const;
  }

  private async request(path: string, init?: RequestInit) {
    const config = this.config();
    const response = await fetch(`${config.protocol}://${config.host}:${config.port}/webapi/${path}`, {
      ...init,
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`NAS HTTP error: ${response.status}`);
    return response;
  }

  private async login() {
    const config = this.config();
    const params = new URLSearchParams({
      api: "SYNO.API.Auth", version: "6", method: "login", account: config.user!, passwd: config.password!,
      session: "FileStation", format: "sid",
    });
    const result = await this.request(`auth.cgi?${params}`).then((response) => response.json()) as NasApiResponse;
    if (!result.success || !result.data?.sid) throw new Error(`NAS login failed: ${result.error?.code ?? "unknown"}`);
    return result.data.sid;
  }

  private async logout(sid: string) {
    const params = new URLSearchParams({ api: "SYNO.API.Auth", version: "1", method: "logout", session: "FileStation", _sid: sid });
    await this.request(`auth.cgi?${params}`).catch(() => undefined);
  }

  private safeSegment(value: string) {
    const hasControlCharacter = [...value].some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127;
    });
    if (!value || value !== value.trim() || value === "." || value === ".." || /[/\\]/.test(value) || hasControlCharacter) throw new Error("Invalid NAS path segment");
    return value;
  }

  private destination(subFolder: string) {
    const config = this.config();
    return `/${this.safeSegment(config.share!)}/${this.safeSegment(config.folder!)}/${this.safeSegment(subFolder)}`;
  }

  private async ensureDirectory(sid: string, path: string) {
    const lastSlash = path.lastIndexOf("/");
    const params = new URLSearchParams({
      api: "SYNO.FileStation.CreateFolder", version: "2", method: "create",
      folder_path: JSON.stringify([path.slice(0, lastSlash)]), name: JSON.stringify([path.slice(lastSlash + 1)]),
      force_parent: "true", _sid: sid,
    });
    const result = await this.request(`entry.cgi?${params}`).then((response) => response.json()) as NasApiResponse;
    if (!result.success && result.error?.code !== 1104) throw new Error(`NAS folder creation failed: ${result.error?.code ?? "unknown"}`);
  }

  async uploadFile(input: { fileName: string; fileBuffer: Buffer; subFolder: string }) {
    const config = this.config();
    const fileName = this.safeSegment(input.fileName);
    const destination = this.destination(input.subFolder);
    const sid = await this.login();
    try {
      await this.ensureDirectory(sid, destination);
      const form = new FormData();
      form.append("api", "SYNO.FileStation.Upload");
      form.append("version", "2");
      form.append("method", "upload");
      form.append("_sid", sid);
      form.append("path", destination);
      form.append("create_parents", "true");
      form.append("overwrite", "false");
      form.append("file", new Blob([new Uint8Array(input.fileBuffer)]), fileName);
      const result = await this.request(`entry.cgi?_sid=${encodeURIComponent(sid)}`, { method: "POST", body: form }).then((response) => response.json()) as NasApiResponse;
      if (!result.success) throw new Error(`NAS upload failed: ${result.error?.code ?? "unknown"}`);
      return new URL(`${encodeURIComponent(input.subFolder)}/${encodeURIComponent(fileName)}`, `${config.baseUrl.toString().replace(/\/$/, "")}/`).toString();
    } finally {
      await this.logout(sid);
    }
  }

  private resolvePath(fileUrl: string) {
    const config = this.config();
    const url = new URL(fileUrl);
    if (url.origin !== config.baseUrl.origin || url.search || url.hash || url.username || url.password) throw new Error("Attachment URL is not managed by this NAS");
    const baseSegments = config.baseUrl.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    const segments = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    if (!baseSegments.every((segment, index) => segments[index] === segment)) throw new Error("Attachment URL is outside the managed NAS path");
    const relative = segments.slice(baseSegments.length).map((segment) => this.safeSegment(segment));
    if (relative.length < 2) throw new Error("Invalid attachment path");
    return `/${[config.share!, config.folder!, ...relative].join("/")}`;
  }

  async deleteFile(fileUrl: string) {
    const sid = await this.login();
    try {
      const params = new URLSearchParams({ api: "SYNO.FileStation.Delete", version: "2", method: "start", path: JSON.stringify([this.resolvePath(fileUrl)]), _sid: sid });
      const result = await this.request(`entry.cgi?${params}`).then((response) => response.json()) as NasApiResponse;
      if (!result.success) throw new Error(`NAS delete failed: ${result.error?.code ?? "unknown"}`);
    } finally {
      await this.logout(sid);
    }
  }

  async downloadFile(fileUrl: string) {
    const sid = await this.login();
    try {
      const params = new URLSearchParams({ api: "SYNO.FileStation.Download", version: "2", method: "download", path: JSON.stringify([this.resolvePath(fileUrl)]), mode: "download", _sid: sid });
      const response = await this.request(`entry.cgi?${params}`);
      return Buffer.from(await response.arrayBuffer());
    } finally {
      await this.logout(sid);
    }
  }
}
