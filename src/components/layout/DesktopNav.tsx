"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles, Heart, Calendar, User, LogOut, Settings, LayoutDashboard, Search, MapPin, ChevronDown } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { getBmvLocation } from "@/components/home/LocationPermissionModal";

const LocationModal = dynamic(
  () => import("@/components/home/LocationPermissionModal"),
  { ssr: false, loading: () => null }
);

export default function DesktopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const user = session?.user;
  const loading = status === "loading";

  // Scroll-aware transparency — only on home page
  const isHome = pathname === "/";
  useEffect(() => {
    if (!isHome) { setScrolled(true); return; }
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  // Read stored location on mount + listen for updates
  useEffect(() => {
    const stored = getBmvLocation();
    if (stored) setLocationLabel(stored.label);
    const handler = (e: Event) => {
      const d = (e as CustomEvent<{ label: string }>).detail;
      if (d?.label) setLocationLabel(d.label);
    };
    window.addEventListener("bmv:locationUpdated", handler);
    return () => window.removeEventListener("bmv:locationUpdated", handler);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut({ redirect: false });
    router.push("/");
    setShowProfileMenu(false);
  }, [router]);

  // Active nav link helper with animated underline
  const NavLink = ({
    href,
    children,
    exact = false,
  }: {
    href: string;
    children: React.ReactNode;
    exact?: boolean;
  }) => {
    const isActive = exact ? pathname === href : pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={`relative flex items-center gap-1.5 py-1 font-medium text-sm transition-colors group ${
          isActive
            ? "text-purple-600"
            : "text-gray-700 hover:text-purple-600"
        }`}
      >
        {children}
        {/* Animated underline */}
        <span
          className={`absolute -bottom-0.5 left-0 h-0.5 rounded-full bg-purple-500 transition-all duration-300 ${
            isActive ? "w-full" : "w-0 group-hover:w-full"
          }`}
        />
      </Link>
    );
  };

  const navBg = "bg-white border-b border-gray-200 shadow-sm";

  return (
    <>
      <nav className={`hidden lg:block fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Sparkles className="h-7 w-7 text-purple-600" />
            <span className="text-xl font-bold text-gradient">
              ShubhSpace
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-7">
            {(!user || user.role === "USER") && (
              <>
                <NavLink href="/venues" exact>Venues</NavLink>
                <NavLink href="/catering" exact>Catering</NavLink>
                <NavLink href="/wishlist" exact>
                  <Heart className="h-4 w-4" /> Wishlist
                </NavLink>
              </>
            )}
            {user && user.role !== "ADMIN" && (
              <NavLink href="/bookings" exact>
                <Calendar className="h-4 w-4" />
                {user.role === "VENUE_OWNER"
                  ? "Venue Bookings"
                  : user.role === "CATERING_OWNER"
                  ? "Catering Bookings"
                  : "My Bookings"}
              </NavLink>
            )}
          </div>

          {/* Location button — desktop only */}
          <button
            onClick={() => setShowLocationModal(true)}
            className="flex items-center gap-1.5 text-left px-3 py-1.5 rounded-full border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
            <div>
              <p className="text-[9px] text-gray-400 leading-none">Location</p>
              <p className="text-xs font-semibold text-gray-900 leading-tight max-w-[110px] truncate">
                {locationLabel ?? "Set location"}
              </p>
            </div>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {/* Right: Search + User */}
          <div className="flex items-center gap-3">
            {/* Search icon — navigates to venues search */}
            {(!user || user.role === "USER") && (
              <button
                onClick={() => router.push("/venues")}
                className="p-2 rounded-full transition-colors hover:bg-gray-100 text-gray-600"
                aria-label="Search venues"
              >
                <Search className="h-5 w-5" />
              </button>
            )}

            {loading ? (
              <div className="h-9 w-24 animate-pulse rounded-full bg-gray-200/60" />
            ) : user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all hover:shadow-md bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                >
                  <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <span className="max-w-24 truncate">{user.name?.split(" ")[0] || "Me"}</span>
                </button>

                {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                      {/* User info header */}
                      <div className="p-4 border-b border-gray-100 bg-gradient-to-br from-purple-50 to-pink-50">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {(user.name || "U")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{user.name || "User"}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                        <span className="inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                          {user.role?.replace("_", " ")}
                        </span>
                      </div>

                      <div className="p-1.5">
                        <Link href="/profile" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">
                          <User className="h-4 w-4" /><span>My Profile</span>
                        </Link>

                        {user.role === "ADMIN" && (
                          <Link href="/admin" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">
                            <LayoutDashboard className="h-4 w-4" /><span>Admin Dashboard</span>
                          </Link>
                        )}
                        {user.role === "VENUE_OWNER" && (
                          <Link href="/venue-owner" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">
                            <LayoutDashboard className="h-4 w-4" /><span>Venue Dashboard</span>
                          </Link>
                        )}
                        {user.role === "CATERING_OWNER" && (
                          <Link href="/catering-owner" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">
                            <LayoutDashboard className="h-4 w-4" /><span>Catering Dashboard</span>
                          </Link>
                        )}
                        <Link href="/settings" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">
                          <Settings className="h-4 w-4" /><span>Settings</span>
                        </Link>

                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button onClick={handleSignOut} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                            <LogOut className="h-4 w-4" /><span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/signin"
                  className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-md transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
      {showLocationModal && (
        <LocationModal
          onLocationSet={(_lat, _lng, label) => {
            setLocationLabel(label);
            setShowLocationModal(false);
          }}
          onDismiss={() => setShowLocationModal(false)}
        />
      )}
    </>
  );
}
