import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isProtectedPath } from "@/lib/auth/session";

export function middleware(request: NextRequest) {
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get("sb-access-token")?.value);
  if (hasSession) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
