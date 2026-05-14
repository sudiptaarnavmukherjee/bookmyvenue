"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { Building2, Heart, Calendar, User, LogOut, Settings, LayoutDashboard, Search, MapPin, ChevronDown, ChefHat, Ticket } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { getBmvLocation } from "@/components/home/LocationPermissionModal";

const LocationModal = dynamic(() => import("@/components/home/LocationPermissionModal"), { ssr: false, loading: () => null });

export default function DesktopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const user = session?.user;
  const loading = status === "loading";

  useEffect(() => {
    const stored = getBmvLocation();
    if (stored) {
      setLocationLabel(stored.label);
    } else {
      const prompted = sessionStorage.getItem("bmv_loc_prompted");
      if (!prompted) {
        const timer = setTimeout(() => {
          setShowLocationModal(true);
          sessionStorage.setItem("bmv_loc_prompted", "1");
        }, 800);
        return () => clearTimeout(timer);
      }
    }

    const handler = (e: Event) => {
      const d = (e as CustomEvent<{ label: string }>).detail;
      if (d?.label) setLocationLabel(d.label);
    };

    window.addEventListener("bmv:locationUpdated", handler);
    return () => window.removeEventListener("bmv:locationUpdated", handler);
  }, []);

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

  const NavLink = ({ href, children, exact = false }: { href: string; children: React.ReactNode; exact?: boolean }) => {
    const isActive = exact ? pathname === href : pathname.startsWith(href);
    return (
      <Link href={href} className={`relative flex items-center gap-1.5 px-1 py-1 text-sm font-semibold transition-colors ${isActive ? "text-[#0b5fab]" : "text-slate-700 hover:text-[#0b5fab]"}`}>
        {children}
        <span className={`absolute left-1 right-1 -bottom-1 h-0.5 rounded-full bg-[#0b5fab] transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`} />
      </Link>
    );
  };

  return (
    <>
      <nav className="hidden lg:block fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-7 px-4">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0b5fab] text-white shadow-sm">
              <Ticket className="h-5 w-5" />
            </div>
            <div className="leading-none">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0b5fab]">Book</p>
              <p className="text-[18px] font-extrabold text-slate-900">MyVenue</p>
            </div>
          </Link>

          <div className="flex min-w-0 flex-1 items-center gap-5">
            {(!user || user.role === "USER") && (
              <>
                <NavLink href="/venues" exact><Building2 className="h-4 w-4" /> Venues</NavLink>
                <NavLink href="/catering" exact><ChefHat className="h-4 w-4" /> Catering</NavLink>
                <NavLink href="/wishlist" exact><Heart className="h-4 w-4" /> Saved</NavLink>
              </>
            )}
            {user && user.role !== "ADMIN" && (
              <NavLink href="/bookings" exact><Calendar className="h-4 w-4" /> My Bookings</NavLink>
            )}
          </div>

          <button onClick={() => setShowLocationModal(true)} className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-left transition-colors hover:border-[#0b5fab]/30 hover:bg-[#0b5fab]/5">
            <MapPin className="h-3.5 w-3.5 text-[#0b5fab]" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">City</p>
              <p className="max-w-[120px] truncate text-xs font-bold text-slate-900">{locationLabel ?? "Set location"}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          <div className="flex items-center gap-2">
            {(!user || user.role === "USER") && (
              <button onClick={() => router.push("/venues")} className="rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100" aria-label="Search venues">
                <Search className="h-5 w-5" />
              </button>
            )}

            {loading ? (
              <div className="h-9 w-24 animate-pulse rounded-full bg-slate-200" />
            ) : user ? (
              <div className="relative" ref={profileRef}>
                <button onClick={() => setShowProfileMenu((v) => !v)} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-2 pr-3.5 text-sm font-semibold text-slate-800 transition-colors hover:border-[#0b5fab]/40">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0b5fab] text-xs font-bold text-white">{(user.name || "U")[0].toUpperCase()}</div>
                  <span className="max-w-24 truncate">{user.name?.split(" ")[0] || "Me"}</span>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
                    <div className="border-b border-slate-100 bg-slate-50 p-4">
                      <div className="mb-1 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0b5fab] text-sm font-bold text-white">{(user.name || "U")[0].toUpperCase()}</div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{user.name || "User"}</p>
                          <p className="truncate text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-[#0b5fab]/10 px-2 py-0.5 text-[11px] font-semibold uppercase text-[#0b5fab]">{user.role?.replace(/_/g, " ")}</span>
                    </div>

                    <div className="p-1.5">
                      <Link href="/profile" onClick={() => setShowProfileMenu(false)} className="menu-item"><User className="h-4 w-4" /> My Profile</Link>
                      {user.role === "ADMIN" && <Link href="/admin" onClick={() => setShowProfileMenu(false)} className="menu-item"><LayoutDashboard className="h-4 w-4" /> Admin Dashboard</Link>}
                      {user.role === "VENUE_OWNER" && <Link href="/venue-owner" onClick={() => setShowProfileMenu(false)} className="menu-item"><LayoutDashboard className="h-4 w-4" /> Venue Dashboard</Link>}
                      {user.role === "CATERING_OWNER" && <Link href="/catering-owner" onClick={() => setShowProfileMenu(false)} className="menu-item"><LayoutDashboard className="h-4 w-4" /> Catering Dashboard</Link>}
                      <Link href="/settings" onClick={() => setShowProfileMenu(false)} className="menu-item"><Settings className="h-4 w-4" /> Settings</Link>
                      <div className="mt-1 border-t border-slate-100 pt-1">
                        <button onClick={handleSignOut} className="menu-item w-full text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" /> Sign Out</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/signin" className="px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:text-[#0b5fab]">Login</Link>
                <Link href="/auth/signup" className="rounded-full bg-[#ff7a00] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-[#e86f00]">Sign Up</Link>
              </div>
            )}
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
