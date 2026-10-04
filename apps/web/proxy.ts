import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withBasePath, withoutBasePath } from "./lib/base-path";

export function proxy(request: NextRequest) {
  const pathname = withoutBasePath(request.nextUrl.pathname);
  const hasSessionCookie =
    request.cookies.has("itam_session") ||
    request.cookies.has("__Host-itam_session");

  if (pathname === "/" && hasSessionCookie) {
    return NextResponse.redirect(new URL(withBasePath("/apps"), request.url));
  }

  if (!hasSessionCookie) {
    const isRsc =
      request.headers.get("RSC") === "1" ||
      request.headers.get("x-middleware-prefetch") === "1" ||
      request.nextUrl.searchParams.has("_rsc");

    if (isRsc) {
      return NextResponse.redirect(new URL(withBasePath("/"), request.url));
    }

    return NextResponse.redirect(new URL(withBasePath("/auth/login"), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/apps/:path*"],
};
