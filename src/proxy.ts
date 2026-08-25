import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/token";

function trialExpired(): boolean {
  const trialEndsAt = process.env.TRIAL_ENDS_AT;
  if (!trialEndsAt) return false;
  const deadline = new Date(trialEndsAt);
  return !Number.isNaN(deadline.getTime()) && Date.now() > deadline.getTime();
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (trialExpired()) {
    if (pathname !== "/trial-expired") {
      return NextResponse.redirect(new URL("/trial-expired", request.url));
    }
    return NextResponse.next();
  }
  if (pathname === "/trial-expired") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const session = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login") {
    if (session) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
