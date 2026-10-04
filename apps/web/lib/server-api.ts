import "server-only";
import { randomUUID } from "node:crypto";
import { sso } from "./sso";

export const API_URL = process.env.API_URL ?? "http://localhost:7600";

export async function apiFetch(request: Request, path: string, init?: RequestInit) {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();
  const headers = new Headers(init?.headers);
  headers.set("x-request-id", requestId);
  return sso.fetch(request, `${API_URL}${path}`, { ...init, headers, cache: "no-store" });
}

export function dependencyUnavailable(path: string, requestId: string = randomUUID()) {
  return Response.json({ success: false, statusCode: 503, code: "API_UNAVAILABLE", message: "The application service is temporarily unavailable", data: null, timestamp: new Date().toISOString(), path, requestId }, { status: 503, headers: { "x-request-id": requestId } });
}

