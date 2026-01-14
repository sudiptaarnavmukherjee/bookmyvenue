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
    if (token?.role === "ADMIN" && (path === "/" || path.startsWith("/venues") || path.startsWith("/catering"))) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (token?.role === "VENUE_OWNER" && (path === "/" || path.startsWith("/venues") || path.startsWith("/catering"))) {
      return NextResponse.redirect(new URL("/venue-owner", req.url));
    }

    if (token?.role === "CATERING_OWNER" && (path === "/" || path.startsWith("/venues") || path.startsWith("/catering"))) {
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
  matcher: [
    "/dashboard/:path*",
    "/venue-owner/:path*",
    "/catering-owner/:path*",
    "/bookings/:path*",
    "/profile/:path*",
    "/wishlist/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
