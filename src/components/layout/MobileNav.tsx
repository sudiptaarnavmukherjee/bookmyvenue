"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Building2, Calendar, User, LayoutDashboard, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

export function MobileNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const user = session?.user;
  const isLoading = status === "loading";

  const defaultNavItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/venues", icon: Building2, label: "Venues" },
    { href: "/bookings", icon: Calendar, label: "Bookings" },
    { href: "/wishlist", icon: Heart, label: "Saved" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  const getNavItems = () => {
    if (isLoading || !user) return defaultNavItems;
    if (user.role === "USER") return defaultNavItems;
    if (user.role === "VENUE_OWNER") return [
      { href: "/venue-owner", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/bookings", icon: Calendar, label: "Bookings" },
      { href: "/profile", icon: User, label: "Profile" },
    ];
    if (user.role === "CATERING_OWNER") return [
      { href: "/catering-owner", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/bookings", icon: Calendar, label: "Bookings" },
      { href: "/profile", icon: User, label: "Profile" },
    ];
    if (user.role === "ADMIN") return [
      { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/profile", icon: User, label: "Profile" },
    ];
    return defaultNavItems;
  };

  const navItems = getNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(15,23,42,0.08)] md:hidden">
      <div
        className="flex items-stretch"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-3 text-[10px] font-semibold transition-all",
                isActive ? "text-[#0b5fab]" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {/* Active top indicator line */}
              {isActive && (
                <div className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-b-full bg-[#0b5fab]" />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform",
                  isActive && "scale-110"
                )}
                strokeWidth={isActive ? 2.5 : 1.75}
                fill={isActive ? "currentColor" : "none"}
              />
              <span className={cn("transition-all", isActive ? "font-bold" : "")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
