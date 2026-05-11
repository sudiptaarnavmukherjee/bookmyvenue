"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ChevronDown, Heart, Building2, ChefHat, Calendar, Users, Star, Shield, Sparkles } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import Logo from "@/components/layout/Logo";
import { getBmvLocation } from "@/components/home/LocationPermissionModal";

// Dynamically import SearchModal to reduce initial bundle
const SearchModal = dynamic(() => import("@/components/home/SearchModal"), {
  ssr: false,
  loading: () => null,
});

// Dynamically import LocationPermissionModal (GPS + Ola Maps)
const LocationModal = dynamic(
  () => import("@/components/home/LocationPermissionModal"),
  { ssr: false, loading: () => null }
);

// ============================================
// Main Interactive Header & Search
// ============================================
export default function HomeInteractive({ 
  initialMode = "venues" 
}: { 
  initialMode?: "venues" | "catering" 
}) {
  const router = useRouter();
  
  // Use initialMode directly - no useSearchParams() which forces dynamic rendering
  const [activeTab, setActiveTab] = useState<"venues" | "catering">(initialMode);
  const [location, setLocation] = useState("Kolkata");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // On mount: read stored location + auto-show modal for first-time visitors
  useEffect(() => {
    const stored = getBmvLocation();
    if (stored) {
      setLocation(stored.label);
    } else {
      // Only auto-show once per session
      const prompted = sessionStorage.getItem("bmv_loc_prompted");
      if (!prompted) {
        const timer = setTimeout(() => {
          setShowLocationModal(true);
          sessionStorage.setItem("bmv_loc_prompted", "1");
        }, 800);
        return () => clearTimeout(timer);
      }
    }

    // Keep header in sync when location is set from NearbySection or elsewhere
    const handler = (e: Event) => {
      const d = (e as CustomEvent<{ label: string }>).detail;
      if (d?.label) setLocation(d.label);
    };
    window.addEventListener("bmv:locationUpdated", handler);
    return () => window.removeEventListener("bmv:locationUpdated", handler);
  }, []);

  // Tab change handler — update URL silently + notify HomeTabContent via event
  const handleTabChange = useCallback((tab: "venues" | "catering") => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("mode", tab);
    window.history.replaceState({}, "", url.toString());
    window.dispatchEvent(new CustomEvent("home:tabChanged", { detail: { tab } }));
  }, []);

  // Search handler
  const handleSearch = useCallback((params: {
    search: string;
    date?: string;
    guests?: number;
    isNearby?: boolean;
    lat?: number;
    lng?: number;
  }) => {
    const urlParams = new URLSearchParams();
    if (params.search) urlParams.set("search", params.search);
    if (params.date) urlParams.set("date", params.date);
    if (params.guests) urlParams.set("minGuests", params.guests.toString());
    if (params.isNearby && params.lat && params.lng) {
      urlParams.set("lat", params.lat.toString());
      urlParams.set("lng", params.lng.toString());
      urlParams.set("sort", "nearby");
    }
    router.push(`/${activeTab === "venues" ? "venues" : "catering"}?${urlParams.toString()}`);
  }, [activeTab, router]);

  // Quick search
  const handleQuickSearch = useCallback((area: string) => {
    router.push(`/${activeTab === "venues" ? "venues" : "catering"}?search=${encodeURIComponent(area)}`);
  }, [activeTab, router]);

  const quickAreas = ["Salt Lake", "New Town", "Rajarhat", "Howrah"];

  return (
    <>
      {/* ========================================================
          HERO SECTION — Full-screen gradient with search
      ======================================================== */}
      <section className="relative min-h-[88vh] lg:min-h-[92vh] flex flex-col overflow-hidden">

        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900" />

        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-pink-500/20 rounded-full blur-3xl translate-x-1/3 -translate-y-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-3xl -translate-x-1/3 translate-y-1/4 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-purple-400/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        {/* ── Mobile top bar (desktop uses DesktopNav) ── */}
        <div className="relative z-20 lg:hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-1.5">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-white text-lg font-bold tracking-tight">ShubhSpace</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLocationModal(true)}
                className="flex items-center gap-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-white/80" />
                <span className="text-white text-xs font-medium max-w-[80px] truncate">{location}</span>
                <ChevronDown className="w-3 h-3 text-white/60" />
              </button>
              <Link href="/wishlist" className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full p-2" prefetch={false}>
                <Heart className="w-4 h-4 text-white" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Hero content ── */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-8 pb-6 lg:pt-16 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-white/90 text-xs font-medium">Trusted by 10,000+ families in Kolkata</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl lg:text-6xl font-extrabold text-white leading-tight mb-4 max-w-3xl">
            Find Your Perfect{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                {activeTab === "venues" ? "Venue" : "Caterer"}
              </span>
              <span className="absolute inset-x-0 bottom-0 h-3 bg-yellow-400/20 rounded-full" />
            </span>
            {" "}in Kolkata
          </h1>

          <p className="text-white/70 text-base lg:text-lg mb-8 max-w-xl">
            {activeTab === "venues"
              ? "Compare 500+ wedding halls, banquet halls & party venues with transparent pricing."
              : "Discover top caterers for weddings, corporate events & social gatherings."}
          </p>

          {/* Tab switcher */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-1 mb-6">
            <button
              onClick={() => handleTabChange("venues")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "venues"
                  ? "bg-white text-purple-700 shadow-lg"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <Building2 className="w-4 h-4" />
              Venues
            </button>
            <button
              onClick={() => handleTabChange("catering")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "catering"
                  ? "bg-white text-orange-600 shadow-lg"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <ChefHat className="w-4 h-4" />
              Catering
            </button>
          </div>

          {/* Search card */}
          <div className="w-full max-w-2xl">
            <button
              onClick={() => setShowSearchModal(true)}
              className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-2xl shadow-purple-900/40 hover:shadow-3xl hover:-translate-y-0.5 transition-all text-left border border-white/50"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                activeTab === "venues" ? "bg-purple-600" : "bg-orange-500"
              }`}>
                <Search className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 font-semibold text-base">
                  {activeTab === "venues" ? "Search venues…" : "Search caterers…"}
                </p>
                <p className="text-gray-400 text-sm">
                  {activeTab === "venues"
                    ? "Location · Date · Guests"
                    : "Cuisine · Area · Budget"}
                </p>
              </div>
              {activeTab === "venues" && (
                <div className="hidden sm:flex items-center gap-3 flex-shrink-0 pr-1">
                  <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Date</span>
                  </div>
                  <div className="w-px h-5 bg-gray-200" />
                  <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                    <Users className="w-4 h-4" />
                    <span>Guests</span>
                  </div>
                </div>
              )}
            </button>

            {/* Quick area pills */}
            <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide justify-center">
              <span className="text-white/50 text-xs flex-shrink-0">Popular:</span>
              {quickAreas.map(area => (
                <button
                  key={area}
                  onClick={() => handleQuickSearch(area)}
                  className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white text-xs rounded-full border border-white/20 hover:bg-white/20 font-medium transition-colors"
                >
                  <MapPin className="w-2.5 h-2.5 opacity-70" />
                  {area}
                </button>
              ))}
            </div>
          </div>

          {/* Trust stats */}
          <div className="flex items-center gap-6 lg:gap-10 mt-10 text-center flex-wrap justify-center">
            {[
              { icon: Building2, value: "500+", label: "Venues" },
              { icon: ChefHat, value: "200+", label: "Caterers" },
              { icon: Star, value: "4.8★", label: "Avg Rating" },
              { icon: Shield, value: "100%", label: "Verified" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <Icon className="w-5 h-5 text-white/50 mb-0.5" />
                <span className="text-white font-bold text-xl leading-none">{value}</span>
                <span className="text-white/50 text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom wave */}
        <div className="relative z-10">
          <svg viewBox="0 0 1440 60" className="w-full h-10 lg:h-14" preserveAspectRatio="none" fill="#f9fafb">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      {/* Location Modal */}
      {showLocationModal && (
        <LocationModal
          onLocationSet={(lat, lng, label) => {
            setLocation(label);
            setShowLocationModal(false);
          }}
          onDismiss={() => setShowLocationModal(false)}
        />
      )}

      {showSearchModal && (
        <SearchModal
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          onSearch={handleSearch}
          activeTab={activeTab}
        />
      )}
    </>
  );
}

