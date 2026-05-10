"use client";

import { useState, useCallback, memo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ChevronDown, Heart, Building2, ChefHat, Calendar, Users } from "lucide-react";
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
  const accentBg = activeTab === "venues" ? "bg-purple-600" : "bg-orange-500";
  const accentText = activeTab === "venues" ? "text-purple-600" : "text-orange-600";

  return (
    <>
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <button 
                onClick={() => setShowLocationModal(true)}
                className="flex items-center gap-1 text-left"
              >
                <MapPin className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-[10px] text-gray-400 leading-none">Location</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-0.5">
                    {location}
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </p>
                </div>
              </button>
            </div>
            <div className="flex items-center gap-1">
              <Link href="/wishlist" className="p-2 hover:bg-gray-100 rounded-full" prefetch={false}>
                <Heart className="w-5 h-5 text-gray-600" />
              </Link>
              <Link 
                href="/auth/signin" 
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
                  activeTab === "venues" ? "text-purple-600 bg-purple-50" : "text-orange-600 bg-orange-50"
                }`}
                prefetch={false}
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Switcher */}
      <div className="bg-white border-b sticky top-[52px] z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex">
            <button
              onClick={() => handleTabChange("venues")}
              className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === "venues"
                  ? "text-purple-600 border-purple-600"
                  : "text-gray-500 border-transparent"
              }`}
            >
              <Building2 className="w-4 h-4" />
              Venues
            </button>
            <button
              onClick={() => handleTabChange("catering")}
              className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === "catering"
                  ? "text-orange-600 border-orange-600"
                  : "text-gray-500 border-transparent"
              }`}
            >
              <ChefHat className="w-4 h-4" />
              Catering
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className={`px-4 py-4 ${accentBg}`}>
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => setShowSearchModal(true)}
            className="w-full bg-white rounded-full p-2 pr-4 flex items-center gap-3 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${accentBg}`}>
              <Search className="w-5 h-5 text-white" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {activeTab === "venues" ? "Where to celebrate?" : "What's cooking?"}
              </p>
              <p className="text-xs text-gray-500">
                {activeTab === "venues" 
                  ? "Search venues · Add dates · Add guests"
                  : "Search caterers · Cuisine · Location"
                }
              </p>
            </div>
            {activeTab === "venues" && (
              <div className="flex items-center gap-2">
                <div className="w-px h-6 bg-gray-200" />
                <Calendar className="w-4 h-4 text-gray-400" />
                <div className="w-px h-6 bg-gray-200" />
                <Users className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </button>
          
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {quickAreas.map(area => (
              <button
                key={area}
                onClick={() => handleQuickSearch(area)}
                className="flex-shrink-0 px-3 py-1.5 bg-white/20 text-white text-xs rounded-full hover:bg-white/30 font-medium"
              >
                {area}
              </button>
            ))}
            <button
              onClick={() => setShowSearchModal(true)}
              className="flex-shrink-0 px-3 py-1.5 bg-white text-gray-700 text-xs rounded-full hover:bg-gray-100 font-medium flex items-center gap-1"
            >
              <Search className="w-3 h-3" />
              More
            </button>
          </div>
        </div>
      </div>

      {/* Location Modal - GPS + Ola Maps search */}
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


