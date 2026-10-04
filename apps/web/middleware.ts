import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const hasSessionCookie =
    request.cookies.has("itam_session") ||
    request.cookies.has("__Host-itam_session");

  if (request.nextUrl.pathname === "/" && hasSessionCookie) {
    return NextResponse.redirect(new URL("/apps", request.url));
  }

  if (!hasSessionCookie) {
    const isRsc =
      request.headers.get("RSC") === "1" ||
      request.headers.get("x-middleware-prefetch") === "1" ||
      request.nextUrl.searchParams.has("_rsc");

    if (isRsc) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/apps/:path*"],
};
