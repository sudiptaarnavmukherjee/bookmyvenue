"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, Calendar, User, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  // Dynamic nav items based on user role
  const getNavItems = () => {
    // For regular users or not logged in
    if (!user || user.role === "USER") {
      return [
        { href: "/", icon: Home, label: "Home" },
        { href: "/wishlist", icon: Heart, label: "Wishlist" },
        { href: "/bookings", icon: Calendar, label: "Bookings" },
        { href: "/profile", icon: User, label: "Profile" },
      ];
    }

    // For venue owners
    if (user.role === "VENUE_OWNER") {
      return [
        { href: "/venue-owner", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/bookings", icon: Calendar, label: "Bookings" },
        { href: "/profile", icon: User, label: "Profile" },
      ];
    }
    
    // For catering owners
    if (user.role === "CATERING_OWNER") {
      return [
        { href: "/catering-owner", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/bookings", icon: Calendar, label: "Bookings" },
        { href: "/profile", icon: User, label: "Profile" },
      ];
    }
    
    // For admin - no bookings link
    if (user.role === "ADMIN") {
      return [
        { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/profile", icon: User, label: "Profile" },
      ];
    }

    return [
      { href: "/", icon: Home, label: "Home" },
      { href: "/profile", icon: User, label: "Profile" },
    ];
  };

  const navItems = getNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white md:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors",
                isActive
                  ? "text-rose-600"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Icon className={cn("h-6 w-6", isActive && "fill-rose-100")} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
