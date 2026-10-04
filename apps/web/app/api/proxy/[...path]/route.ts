import { randomUUID } from "node:crypto";
import { apiFetch, dependencyUnavailable } from "@/lib/server-api";

export const dynamic = "force-dynamic";

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const pathname = `/${path.join("/")}`;
  const url = new URL(request.url);
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin) return Response.json({ success: false, code: "INVALID_ORIGIN", message: "Invalid request origin" }, { status: 403 });
  }
  const requestId = request.headers.get("x-request-id") ?? randomUUID();
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  headers.set("x-request-id", requestId);
  const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer();
  try {
    const upstream = await apiFetch(request, `${pathname}${url.search}`, { method: request.method, headers, body });
    const responseHeaders = new Headers();
    responseHeaders.set("content-type", upstream.headers.get("content-type") ?? "application/json");
    const contentDisposition = upstream.headers.get("content-disposition");
    const contentLength = upstream.headers.get("content-length");
    if (contentDisposition) responseHeaders.set("content-disposition", contentDisposition);
    if (contentLength) responseHeaders.set("content-length", contentLength);
    responseHeaders.set("cache-control", "no-store");
    responseHeaders.set("x-request-id", upstream.headers.get("x-request-id") ?? requestId);
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return dependencyUnavailable(pathname, requestId);
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
