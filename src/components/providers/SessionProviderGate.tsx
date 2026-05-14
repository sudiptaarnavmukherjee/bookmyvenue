"use client";

import { usePathname } from "next/navigation";
import { SessionProvider } from "@/components/providers/SessionProvider";

export function SessionProviderGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const needsSessionProvider =
    pathname === "/auth/signin" ||
    pathname === "/auth/signup" ||
    pathname === "/auth/verify-phone" ||
    pathname === "/bookings" ||
    pathname.startsWith("/bookings/") ||
    pathname === "/profile" ||
    pathname === "/wishlist" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/venue-owner") ||
    pathname.startsWith("/catering-owner") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/venues/") ||
    pathname.startsWith("/catering/");

  if (!needsSessionProvider) {
    return children;
  }

  return <SessionProvider>{children}</SessionProvider>;
}