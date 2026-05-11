"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, Calendar, User, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

export function MobileNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const user = session?.user;
  const isLoading = status === "loading";

  const defaultNavItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/wishlist", icon: Heart, label: "Wishlist" },
    { href: "/bookings", icon: Calendar, label: "Bookings" },
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
    return [
      { href: "/", icon: Home, label: "Home" },
      { href: "/profile", icon: User, label: "Profile" },
    ];
  };

  const navItems = getNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-1px_12px_rgba(0,0,0,0.06)] md:hidden">
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
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors relative",
                isActive ? "text-purple-600" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {/* Active background pill */}
              {isActive && (
                <div className="absolute top-1.5 w-10 h-7 bg-purple-100 rounded-full -z-0" />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 relative z-10 transition-transform",
                  isActive && "scale-110"
                )}
                strokeWidth={isActive ? 2.5 : 1.75}
              />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
