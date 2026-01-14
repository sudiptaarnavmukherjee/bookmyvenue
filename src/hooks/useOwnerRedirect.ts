"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function useOwnerRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      
      // Allowed routes for owners/admin
      const ownerRoutes = ["/venue-owner", "/catering-owner", "/dashboard", "/bookings", "/profile", "/settings"];
      const isOwnerRoute = ownerRoutes.some(route => pathname.startsWith(route));
      
      // Pages that owners/admin should not access
      const publicPages = ["/", "/venues", "/catering", "/wishlist"];
      const isPublicPage = publicPages.some(page => pathname === page || pathname.startsWith(page + "/"));
      
      // If owner/admin is on public pages, redirect to their dashboard
      if (isPublicPage) {
        if (user.role === "VENUE_OWNER") {
          router.push("/venue-owner");
        } else if (user.role === "CATERING_OWNER") {
          router.push("/catering-owner");
        } else if (user.role === "ADMIN") {
          router.push("/dashboard");
        }
      }
    }
  }, [pathname, router]);
}
