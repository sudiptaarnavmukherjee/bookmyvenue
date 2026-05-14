"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ChevronDown, Heart, Building2, ChefHat, Calendar, Users, Ticket } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getBmvLocation, markBmvLocationPrompted, shouldPromptBmvLocation } from "@/components/home/LocationPermissionModal";

const SearchModal = dynamic(() => import("@/components/home/SearchModal"), {
  ssr: false,
  loading: () => null,
});

const LocationModal = dynamic(
  () => import("@/components/home/LocationPermissionModal"),
  { ssr: false, loading: () => null }
);

const EVENT_CATEGORIES = [
  { label: "Wedding", href: "/venues?search=wedding" },
  { label: "Birthday", href: "/venues?search=birthday" },
  { label: "Corporate", href: "/venues?search=corporate" },
  { label: "Engagement", href: "/venues?search=engagement" },
  { label: "Catering", href: "/catering" },
];

export default function HomeInteractive({ initialMode = "venues" }: { initialMode?: "venues" | "catering" }) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"venues" | "catering">(initialMode);
  const [location, setLocation] = useState("Kolkata");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  useEffect(() => {
    const stored = getBmvLocation();
    if (stored) {
      setLocation(stored.label);
    } else if (shouldPromptBmvLocation()) {
      const timer = setTimeout(() => {
        setShowLocationModal(true);
        markBmvLocationPrompted();
      }, 800);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      const d = (e as CustomEvent<{ label: string }>).detail;
      if (d?.label) setLocation(d.label);
    };

    window.addEventListener("bmv:locationUpdated", handler);
    return () => window.removeEventListener("bmv:locationUpdated", handler);
  }, []);

  const handleTabChange = useCallback((tab: "venues" | "catering") => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("mode", tab);
    window.history.replaceState({}, "", url.toString());
    window.dispatchEvent(new CustomEvent("home:tabChanged", { detail: { tab } }));
  }, []);

  const handleSearch = useCallback(
    (params: {
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
      const target = activeTab === "venues" ? "venues" : "catering";
      router.push(`/${target}?${urlParams.toString()}`);
    },
    [activeTab, router]
  );

  return (
    <>
      <header className="lg:hidden sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0b5fab] text-white">
              <Ticket className="h-4.5 w-4.5" />
            </div>
            <div className="leading-none">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#0b5fab]">Happily</p>
              <p className="text-lg font-extrabold text-slate-900">Eated</p>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <Link href="/wishlist" className="rounded-full p-2 hover:bg-slate-100" prefetch={false}>
              <Heart className="h-5 w-5 text-slate-600" />
            </Link>
            <Link href="/auth/signin" className="rounded-full bg-[#ff7a00] px-3 py-1.5 text-xs font-bold text-white" prefetch={false}>
              Login
            </Link>
          </div>
        </div>

        <div className="px-4 pb-3">
          <button
            onClick={() => setShowLocationModal(true)}
            className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left"
          >
            <MapPin className="h-4 w-4 text-[#0b5fab]" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Current location</p>
              <p className="truncate text-sm font-bold text-slate-900">{location}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </header>

      <div className="travel-hero px-4 pb-8 pt-5 lg:px-6 lg:pb-12 lg:pt-9">
        <div className="mx-auto mb-6 max-w-4xl text-center lg:mb-7">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-sky-100">Venue and catering marketplace</p>
          <h1 className="text-3xl font-extrabold leading-tight text-white lg:text-5xl">Plan Events Like a Trip</h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-sky-100 lg:text-base">
            Discover verified venues and caterers with transparent pricing, instant booking, and location-first search.
          </p>
        </div>

        <div className="travel-search-card mx-auto max-w-4xl">
          <div className="flex border-b border-slate-200">
            <button onClick={() => handleTabChange("venues")} className={`travel-tab ${activeTab === "venues" ? "travel-tab-active" : ""}`}>
              <Building2 className="h-4 w-4" /> Venues
            </button>
            <button onClick={() => handleTabChange("catering")} className={`travel-tab ${activeTab === "catering" ? "travel-tab-active" : ""}`}>
              <ChefHat className="h-4 w-4" /> Catering
            </button>
          </div>

          <div className="grid gap-2 p-3 md:grid-cols-[1.2fr_1fr_1fr_auto] md:gap-0 md:p-0">
            <button onClick={() => setShowLocationModal(true)} className="travel-search-field md:rounded-none md:border-r md:border-b-0">
              <MapPin className="h-4.5 w-4.5 text-[#0b5fab]" />
              <div className="min-w-0 text-left">
                <p className="travel-label">City</p>
                <p className="truncate text-sm font-bold text-slate-900">{location}</p>
              </div>
              <ChevronDown className="ml-auto h-4 w-4 text-slate-400" />
            </button>

            <button onClick={() => setShowSearchModal(true)} className="travel-search-field md:rounded-none md:border-r md:border-b-0">
              <Calendar className="h-4.5 w-4.5 text-[#0b5fab]" />
              <div className="text-left">
                <p className="travel-label">Date</p>
                <p className="text-sm font-bold text-slate-900">Select date</p>
              </div>
            </button>

            <button onClick={() => setShowSearchModal(true)} className="travel-search-field md:rounded-none md:border-r md:border-b-0">
              <Users className="h-4.5 w-4.5 text-[#0b5fab]" />
              <div className="text-left">
                <p className="travel-label">Guests</p>
                <p className="text-sm font-bold text-slate-900">Add count</p>
              </div>
            </button>

            <button onClick={() => setShowSearchModal(true)} className="travel-search-button">
              <Search className="h-4.5 w-4.5" /> Search
            </button>
          </div>
        </div>

        <div className="mx-auto mt-4 flex max-w-4xl gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {EVENT_CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              onClick={() => {
                if (cat.href.startsWith("/catering")) handleTabChange("catering");
                else handleTabChange("venues");
              }}
              className="flex-shrink-0 rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </div>

      {showLocationModal && (
        <LocationModal
          onLocationSet={(_lat, _lng, label) => {
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
