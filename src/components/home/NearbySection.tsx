"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin, Navigation, Loader2, ChevronRight,
  Star, Leaf, CheckCircle, Building2, ChefHat,
} from "lucide-react";
import { getBmvLocation, type StoredLocation } from "@/components/home/LocationPermissionModal";

// ── Constants ────────────────────────────────────────────────────────────────
const RADIUS_KM = 10;
const MAX_SHOWN = 6;
const VENUE_FALLBACK   = "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=300&q=70";
const CATERER_FALLBACK = "https://images.unsplash.com/photo-1555244162-803834f70033?w=200&q=70";

// ── Types ────────────────────────────────────────────────────────────────────
interface NearbyVenue {
  id: string; name: string; slug: string | null;
  area: string | null; city: string;
  coverImage: string | null; images: string | null;
  exactPrice: number | null; estimatedMinPrice: number | null;
  marriagePrice: number | null; birthdayPrice: number | null; otherEventPrice: number | null;
  maxGuests: number | null;
  isVerified: boolean; bookingEnabled: boolean;
  distanceKm: number | null; distanceText: string | null;
}

interface NearbyCaterer {
  id: string; name: string; slug: string | null;
  area: string | null; city: string;
  coverImage: string | null; images: string | null;
  minPlatePrice: number | null; silverPrice: number | null;
  isPureVeg: boolean; cuisines: string | null;
  rating: number | null;
  isVerified: boolean; bookingEnabled: boolean;
  distanceKm: number | null; distanceText: string | null;
}

// ── NearbySection ─────────────────────────────────────────────────────────────
export default function NearbySection() {
  const [location, setLocation]   = useState<StoredLocation | null>(null);
  const [venues, setVenues]       = useState<NearbyVenue[]>([]);
  const [caterers, setCaterers]   = useState<NearbyCaterer[]>([]);
  const [loading, setLoading]     = useState(false);
  const [activeTab, setActiveTab] = useState<"venues" | "caterers">("venues");
  const [mounted, setMounted]     = useState(false);
  const abortRef                  = useRef<AbortController | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Read location from localStorage on mount + listen for updates
  useEffect(() => {
    if (!mounted) return;
    const stored = getBmvLocation();
    if (stored) setLocation(stored);

    const handler = (e: Event) => {
      const d = (e as CustomEvent<{ lat: number; lng: number; label: string }>).detail;
      if (d?.lat && d?.lng) {
        setLocation({ lat: d.lat, lng: d.lng, label: d.label, ts: Date.now() });
      }
    };
    window.addEventListener("bmv:locationUpdated", handler);
    return () => window.removeEventListener("bmv:locationUpdated", handler);
  }, [mounted]);

  // Fetch nearby data whenever location changes
  const fetchNearby = useCallback(async (loc: StoredLocation) => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    try {
      const base = `lat=${loc.lat}&lng=${loc.lng}&sortBy=nearby&radius=${RADIUS_KM}&limit=20`;
      const [vRes, cRes] = await Promise.all([
        fetch(`/api/venues?${base}`,   { signal: ctrl.signal }),
        fetch(`/api/catering?${base}`, { signal: ctrl.signal }),
      ]);

      const [vData, cData] = await Promise.all([vRes.json(), cRes.json()]);
      setVenues((vData.venues  || []).slice(0, 20));
      setCaterers((cData.caterers || []).slice(0, 20));
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setVenues([]);
        setCaterers([]);
      }
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location) fetchNearby(location);
    return () => abortRef.current?.abort();
  }, [location, fetchNearby]);

  // Don't render until client-side hydrated
  if (!mounted) return null;
  // Don't render if no location set yet
  if (!location) return null;
  // Don't render if nothing found and not loading
  if (!loading && venues.length === 0 && caterers.length === 0) return null;

  const shownVenues   = venues.slice(0, MAX_SHOWN);
  const shownCaterers = caterers.slice(0, MAX_SHOWN);
  const hasVenues     = shownVenues.length > 0;
  const hasCaterers   = shownCaterers.length > 0;

  const qLink = `lat=${location.lat}&lng=${location.lng}`;

  return (
    <section className="px-4 pt-3 pb-1 max-w-7xl mx-auto">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Navigation className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-base leading-tight">Near You</h2>
            <p className="text-[11px] text-gray-400 leading-tight">
              {location.label} · within {RADIUS_KM} km
            </p>
          </div>
        </div>
        {loading && <Loader2 className="w-4 h-4 text-gray-300 animate-spin" />}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 bg-gray-100 rounded-full p-0.5 w-fit">
        <button
          onClick={() => setActiveTab("venues")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            activeTab === "venues"
              ? "bg-white text-purple-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          Venues
          {hasVenues && (
            <span className={`text-[10px] px-1 rounded-full ${
              activeTab === "venues" ? "bg-purple-100 text-purple-700" : "bg-gray-200 text-gray-500"
            }`}>
              {venues.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("caterers")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            activeTab === "caterers"
              ? "bg-white text-orange-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <ChefHat className="w-3.5 h-3.5" />
          Caterers
          {hasCaterers && (
            <span className={`text-[10px] px-1 rounded-full ${
              activeTab === "caterers" ? "bg-orange-100 text-orange-700" : "bg-gray-200 text-gray-500"
            }`}>
              {caterers.length}
            </span>
          )}
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2.5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 p-2.5 bg-white rounded-xl border border-gray-100 animate-pulse">
              <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Venues tab */}
      {!loading && activeTab === "venues" && (
        <>
          {hasVenues ? (
            <>
              <div className="space-y-2.5">
                {shownVenues.map(v => <NearbyVenueCard key={v.id} venue={v} />)}
              </div>
              {venues.length > MAX_SHOWN && (
                <Link
                  href={`/venues?sortBy=nearby&${qLink}`}
                  className="flex items-center justify-center gap-1 mt-3 py-2.5 border border-purple-200 text-purple-600 text-sm font-semibold rounded-xl hover:bg-purple-50 transition-colors"
                >
                  View all {venues.length} nearby venues <ChevronRight className="w-4 h-4" />
                </Link>
              )}
              {venues.length <= MAX_SHOWN && (
                <Link
                  href={`/venues?sortBy=nearby&${qLink}`}
                  className="flex items-center justify-center gap-1 mt-2 text-purple-600 text-xs font-medium hover:underline"
                >
                  View all venues <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </>
          ) : (
            <div className="py-8 text-center">
              <Building2 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-500 text-sm font-medium">No venues found within {RADIUS_KM} km</p>
              <Link
                href="/venues"
                className="text-purple-600 text-xs mt-1 inline-block hover:underline"
              >
                Browse all venues →
              </Link>
            </div>
          )}
        </>
      )}

      {/* Caterers tab */}
      {!loading && activeTab === "caterers" && (
        <>
          {hasCaterers ? (
            <>
              <div className="space-y-2.5">
                {shownCaterers.map(c => <NearbyCatererCard key={c.id} caterer={c} />)}
              </div>
              {caterers.length > MAX_SHOWN && (
                <Link
                  href={`/catering?sortBy=nearby&${qLink}`}
                  className="flex items-center justify-center gap-1 mt-3 py-2.5 border border-orange-200 text-orange-600 text-sm font-semibold rounded-xl hover:bg-orange-50 transition-colors"
                >
                  View all {caterers.length} nearby caterers <ChevronRight className="w-4 h-4" />
                </Link>
              )}
              {caterers.length <= MAX_SHOWN && (
                <Link
                  href={`/catering?sortBy=nearby&${qLink}`}
                  className="flex items-center justify-center gap-1 mt-2 text-orange-600 text-xs font-medium hover:underline"
                >
                  View all caterers <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </>
          ) : (
            <div className="py-8 text-center">
              <ChefHat className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-500 text-sm font-medium">No caterers found within {RADIUS_KM} km</p>
              <Link
                href="/catering"
                className="text-orange-600 text-xs mt-1 inline-block hover:underline"
              >
                Browse all caterers →
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ── Venue card ───────────────────────────────────────────────────────────────
function NearbyVenueCard({ venue }: { venue: NearbyVenue }) {
  const img   = venue.coverImage || (venue.images ? venue.images.split(",")[0].trim() : null) || VENUE_FALLBACK;
  const price = venue.marriagePrice || venue.exactPrice || venue.estimatedMinPrice || 0;

  return (
    <Link
      href={`/venues/${venue.slug || venue.id}`}
      className="flex gap-3 bg-white rounded-xl border border-gray-100 hover:border-purple-200 hover:shadow-sm transition-all p-2.5 active:scale-[0.99]"
      prefetch={false}
    >
      <div className="relative w-[72px] h-[72px] flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
        <Image src={img} alt={venue.name} fill sizes="72px" className="object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">{venue.name}</h3>
          {venue.distanceText && (
            <span className="flex-shrink-0 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full whitespace-nowrap">
              📍 {venue.distanceText}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{venue.area || venue.city}</span>
        </div>

        <div className="flex items-center justify-between mt-1.5 gap-1">
          <span className="text-purple-600 font-bold text-sm">
            {price > 0 ? `₹${(price / 1000).toFixed(0)}K` : "Call for price"}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            {venue.isVerified && (
              <span className="flex items-center gap-0.5 text-[9px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                <CheckCircle className="w-2.5 h-2.5" /> Verified
              </span>
            )}
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
              venue.bookingEnabled
                ? "bg-purple-100 text-purple-700"
                : "bg-gray-100 text-gray-500"
            }`}>
              {venue.bookingEnabled ? "Book" : "Call"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Caterer card ─────────────────────────────────────────────────────────────
function NearbyCatererCard({ caterer }: { caterer: NearbyCaterer }) {
  const img   = caterer.coverImage || (caterer.images ? caterer.images.split(",")[0].trim() : null) || CATERER_FALLBACK;
  const price = caterer.minPlatePrice || caterer.silverPrice || 0;

  return (
    <Link
      href={`/catering/${caterer.slug || caterer.id}`}
      className="flex gap-3 bg-white rounded-xl border border-gray-100 hover:border-orange-200 hover:shadow-sm transition-all p-2.5 active:scale-[0.99]"
      prefetch={false}
    >
      <div className="relative w-[72px] h-[72px] flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
        <Image src={img} alt={caterer.name} fill sizes="72px" className="object-cover" />
        {caterer.isPureVeg && (
          <div className="absolute top-1 left-1 bg-green-500 p-0.5 rounded">
            <Leaf className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">{caterer.name}</h3>
          {caterer.distanceText && (
            <span className="flex-shrink-0 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full whitespace-nowrap">
              📍 {caterer.distanceText}
            </span>
          )}
        </div>

        <p className="text-gray-400 text-xs truncate mt-0.5">{caterer.cuisines || "Multi-cuisine"}</p>

        <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{caterer.area || caterer.city}</span>
        </div>

        <div className="flex items-center justify-between mt-1.5 gap-1">
          <div className="flex items-center gap-1.5">
            <span className="text-orange-600 font-bold text-sm">
              ₹{price}<span className="text-gray-400 font-normal text-[10px]">/plate</span>
            </span>
            {caterer.rating && caterer.rating > 0 && (
              <span className="flex items-center gap-0.5 bg-green-600 text-white text-[9px] px-1.5 py-0.5 rounded font-semibold">
                <Star className="w-2 h-2 fill-current" />
                {caterer.rating.toFixed(1)}
              </span>
            )}
          </div>
          {caterer.isVerified && (
            <span className="flex items-center gap-0.5 text-[9px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded flex-shrink-0">
              <CheckCircle className="w-2.5 h-2.5" /> Verified
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
