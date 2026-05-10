import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin only routes
    if (path.startsWith("/dashboard") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Owner routes
    if (path.startsWith("/venue-owner") && token?.role !== "VENUE_OWNER") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (path.startsWith("/catering-owner") && token?.role !== "CATERING_OWNER") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Redirect owners/admin from public pages
    // Public browsing pages — owners should be redirected to their dashboards
    // Use exact match or /catering/ prefix to avoid matching /catering-owner
    const isPublicBrowsing =
      path === "/" ||
      path === "/venues" ||
      path.startsWith("/venues/") ||
      path === "/catering" ||
      path.startsWith("/catering/");

    if (token?.role === "ADMIN" && isPublicBrowsing) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (token?.role === "VENUE_OWNER" && isPublicBrowsing) {
      return NextResponse.redirect(new URL("/venue-owner", req.url));
    }

    if (token?.role === "CATERING_OWNER" && isPublicBrowsing) {
      return NextResponse.redirect(new URL("/catering-owner", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        // Public routes that don't require auth
        const publicRoutes = ["/", "/venues", "/catering", "/auth/signin", "/auth/signup"];
        if (publicRoutes.some(route => path === route || path.startsWith(route + "/"))) {
          return true;
        }

        // Protected routes require token
        return !!token;
      },
    },
  }
);

export const config = {
  // ONLY protected routes - NOT homepage or public pages
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/venue-owner/:path*",
    "/catering-owner/:path*",
    "/bookings/:path*",
    "/profile/:path*",
    "/wishlist/:path*",
  ],
};
