import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

function signInRedirect(req: NextRequest) {
  const signInUrl = new URL("/auth/signin", req.url);
  signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
  return NextResponse.redirect(signInUrl);
}

function roleHome(role?: string) {
  if (role === "ADMIN") return "/admin";
  if (role === "VENUE_OWNER") return "/venue-owner";
  if (role === "CATERING_OWNER") return "/catering-owner";
  return "/";
}

function verifyPhoneRedirect(req: NextRequest, callbackUrl?: string) {
  const verifyUrl = new URL("/auth/verify-phone", req.url);
  if (callbackUrl && callbackUrl.startsWith("/")) {
    verifyUrl.searchParams.set("callbackUrl", callbackUrl);
  }
  return NextResponse.redirect(verifyUrl);
}

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = await getToken({ req });
  const role = token?.role as string | undefined;
  const phoneVerified = Boolean(token?.phoneVerified);

  const isAuthRoute =
    path === "/auth/signin" || path === "/auth/signup" || path === "/auth/verify-phone";

  if (isAuthRoute) {
    if (token) {
      if (path === "/auth/verify-phone") {
        if (phoneVerified) {
          return NextResponse.redirect(new URL(roleHome(role), req.url));
        }
        return NextResponse.next();
      }

      if (!phoneVerified) {
        const callbackUrl = req.nextUrl.searchParams.get("callbackUrl") || roleHome(role);
        return verifyPhoneRedirect(req, callbackUrl);
      }

      return NextResponse.redirect(new URL(roleHome(role), req.url));
    }

    if (path === "/auth/verify-phone") {
      return signInRedirect(req);
    }

    return NextResponse.next();
  }

  if (!token) {
    return signInRedirect(req);
  }

  const requiresPhoneVerification =
    path.startsWith("/dashboard") ||
    path.startsWith("/admin") ||
    path.startsWith("/venue-owner") ||
    path.startsWith("/catering-owner") ||
    path.startsWith("/bookings") ||
    path.startsWith("/profile") ||
    path.startsWith("/wishlist");

  if (requiresPhoneVerification && !phoneVerified) {
    return verifyPhoneRedirect(req, `${req.nextUrl.pathname}${req.nextUrl.search}`);
  }

  if (path.startsWith("/dashboard")) {
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (path.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (path.startsWith("/venue-owner") && role !== "VENUE_OWNER") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (path.startsWith("/catering-owner") && role !== "CATERING_OWNER") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Protected routes + auth routes (to redirect already-logged-in users)
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/venue-owner/:path*",
    "/catering-owner/:path*",
    "/bookings/:path*",
    "/profile/:path*",
    "/wishlist/:path*",
    "/auth/signin",
    "/auth/signup",
    "/auth/verify-phone",
  ],
};
