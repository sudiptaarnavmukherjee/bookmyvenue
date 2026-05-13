"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search, Filter, MapPin, X, Loader2, AlertCircle,
  Navigation, SlidersHorizontal, CheckCircle, ChevronLeft,
} from "lucide-react";
import { VenueCard } from "@/components/venue/VenueCard";
import { useLocation } from "@/hooks/useLocation";
import { useSession } from "next-auth/react";

type Venue = {
  id: string;
  name: string;
  slug: string;
  city: string;
  area?: string;
  maxGuests?: number;
  minGuests?: number;
  exactPrice?: number | null;
  estimatedMinPrice?: number | null;
  estimatedMaxPrice?: number | null;
  primeDayPrice?: number | null;
  nonPrimeDayPrice?: number | null;
  priceMode?: string;
  marriagePrice?: number | null;
  birthdayPrice?: number | null;
  otherEventPrice?: number | null;
  isVerified: boolean;
  isAdminListed?: boolean;
  bookingEnabled?: boolean;
  viewCount?: number;
  images?: string;
  coverImage?: string;
  contactNumber?: string;
  contactName?: string;
  distanceText?: string | null;
  distanceKm?: number | null;
  latitude?: number | null;
  longitude?: number | null;
};

type Area = {
  id: string;
  name: string;
  city: string;
  isPopular: boolean;
  priority: number;
  venueCount: number;
};

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"area" | "price-low" | "price-high" | "popular" | "newest" | "nearby">("area");
  const { location, loading: locationLoading, isPermissionDenied } = useLocation();
  const { data: session } = useSession();
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [wishlistVenueIds, setWishlistVenueIds] = useState<Set<string>>(new Set());

  // Fetch user's wishlisted venue IDs once session is loaded
  useEffect(() => {
    if (!session) { setWishlistVenueIds(new Set()); return; }
    fetch("/api/wishlist", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const ids = new Set<string>();
        (d.wishlist || []).forEach((item: any) => { if (item.venueId) ids.add(item.venueId); });
        setWishlistVenueIds(ids);
      })
      .catch(() => {});
  }, [session]);

  useEffect(() => {
    if (locationLoading) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("sortBy", sortBy);
        if (selectedArea) params.set("area", selectedArea);
        if (location) {
          params.set("lat", location.lat.toString());
          params.set("lng", location.lng.toString());
        }
        const response = await fetch(`/api/venues?${params.toString()}`);
        const data = await response.json();
        if (data.error) {
          setError(data.error);
        } else {
          setVenues(data.venues || []);
          if (data.areas) setAreas(data.areas);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load venues");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sortBy, selectedArea, location, locationLoading]);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await fetch("/api/areas");
        const data = await response.json();
        if (data.success) setAreas(data.areas || []);
      } catch {}
    };
    fetchAreas();
  }, []);

  const popularAreas = areas.filter((a) => a.isPopular);

  const filteredVenues = useMemo(() => {
    return venues.filter((venue) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !venue.name.toLowerCase().includes(q) &&
          !venue.city.toLowerCase().includes(q) &&
          !(venue.area || "").toLowerCase().includes(q)
        )
          return false;
      }
      if (verifiedOnly && !venue.isVerified) return false;
      return true;
    });
  }, [venues, searchQuery, verifiedOnly]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSortBy("area");
    setSelectedArea("");
    setVerifiedOnly(false);
  }, []);

  const getVenueImage = useCallback((venue: Venue) => {
    if (venue.coverImage) return venue.coverImage;
    if (venue.images) {
      const imgs = venue.images.split(",");
      return imgs[0] || "https://images.unsplash.com/photo-1519167758481-83f29da8c456?w=800";
    }
    return "https://images.unsplash.com/photo-1519167758481-83f29da8c456?w=800";
  }, []);

  const activeFilterCount = (verifiedOnly ? 1 : 0) + (selectedArea ? 1 : 0);

  const SORT_OPTIONS = [
    { value: "area",       label: "📍 By Area" },
    { value: "nearby",     label: "🧭 Nearest" },
    { value: "popular",    label: "🔥 Popular" },
    { value: "price-low",  label: "💰 Low–High" },
    { value: "price-high", label: "💰 High–Low" },
    { value: "newest",     label: "🆕 Newest" },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ── Sticky top bar ─────────────────────────────── */}
      <div className="bg-white border-b sticky top-0 lg:top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 pt-3 pb-0">
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button onClick={() => window.history.back()} className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">Venues in Kolkata</h1>
                {!loading && (
                  <p className="text-xs text-gray-400">
                    {filteredVenues.length} venue{filteredVenues.length !== 1 ? "s" : ""} found
                  </p>
                )}
              </div>
            </div>
            {/* Filter button */}
            <button
              onClick={() => setShowFilters(true)}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors border ${
                activeFilterCount > 0
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white text-gray-700 border-gray-200 hover:border-purple-300"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white text-purple-600 text-[10px] font-bold rounded-full flex items-center justify-center border border-purple-300">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5 mb-3">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search venues, areas…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* Sort chips */}
          <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  sortBy === opt.value
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Location denied banner */}
        {isPermissionDenied && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            <Navigation className="w-4 h-4 flex-shrink-0" />
            <span>
              Location denied — distances from Kolkata centre.{" "}
              <button onClick={() => window.location.reload()} className="underline font-semibold">
                Allow location
              </button>
            </span>
          </div>
        )}

        {/* Area pills */}
        {popularAreas.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide mb-5">
            <button
              onClick={() => setSelectedArea("")}
              className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                !selectedArea
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"
              }`}
            >
              All Areas
            </button>
            {popularAreas.map((area) => (
              <button
                key={area.id}
                onClick={() => setSelectedArea(selectedArea === area.name ? "" : area.name)}
                className={`flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  selectedArea === area.name
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"
                }`}
              >
                <MapPin className="w-2.5 h-2.5" />
                {area.name}
                {area.venueCount > 0 && (
                  <span className={`text-[10px] ${selectedArea === area.name ? "text-purple-200" : "text-gray-400"}`}>
                    ({area.venueCount})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Active filter strip */}
        {(searchQuery || verifiedOnly) && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {searchQuery && (
              <span className="flex items-center gap-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full font-medium">
                &ldquo;{searchQuery}&rdquo;
                <button onClick={() => setSearchQuery("")}><X className="w-3 h-3" /></button>
              </span>
            )}
            {verifiedOnly && (
              <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium">
                Verified only
                <button onClick={() => setVerifiedOnly(false)}><X className="w-3 h-3" /></button>
              </span>
            )}
            <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-gray-600 underline">
              Clear all
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="aspect-[16/10] bg-gray-200" />
                <div className="p-4 space-y-2.5">
                  <div className="h-5 bg-gray-200 rounded-lg w-3/4" />
                  <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
                  <div className="h-4 bg-gray-100 rounded-lg w-2/3" />
                  <div className="h-10 bg-gray-200 rounded-xl mt-3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">Failed to Load</h3>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filteredVenues.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">No Venues Found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery || selectedArea ? "Try adjusting your filters" : "No venues available yet"}
            </p>
            {(searchQuery || selectedArea || verifiedOnly) && (
              <button
                onClick={clearFilters}
                className="px-5 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Venue grid */}
        {!loading && !error && filteredVenues.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVenues.map((venue) => (
              <VenueCard
                key={venue.id}
                id={venue.id}
                slug={venue.slug}
                name={venue.name}
                city={venue.city}
                area={venue.area}
                priceMode={(venue.priceMode as any) || "ESTIMATED"}
                exactPrice={venue.exactPrice || undefined}
                estimatedMinPrice={venue.estimatedMinPrice || undefined}
                estimatedMaxPrice={venue.estimatedMaxPrice || undefined}
                primeDayPrice={venue.primeDayPrice || undefined}
                nonPrimeDayPrice={venue.nonPrimeDayPrice || undefined}
                minGuests={venue.minGuests || 50}
                maxGuests={venue.maxGuests || 500}
                coverImage={getVenueImage(venue)}
                isVerified={venue.isVerified}
                bookingEnabled={venue.bookingEnabled}
                isAdminListed={venue.isAdminListed}
                contactNumber={venue.contactNumber}
                contactName={venue.contactName}
                viewCount={venue.viewCount}
                distanceText={venue.distanceText || undefined}
                marriagePrice={venue.marriagePrice || undefined}
                birthdayPrice={venue.birthdayPrice || undefined}
                otherEventPrice={venue.otherEventPrice || undefined}
                inWishlist={wishlistVenueIds.has(venue.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Filter bottom sheet ─────────────────────────────── */}
      {showFilters && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setShowFilters(false)}
          />
          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto sheet-enter">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            <div className="px-5 pb-8">
              <div className="flex items-center justify-between py-3 border-b mb-5">
                <h3 className="font-bold text-gray-900 text-lg">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-purple-600 font-semibold"
                >
                  Clear All
                </button>
              </div>

              {/* Verified toggle */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Availability</h4>
                <button
                  onClick={() => setVerifiedOnly(!verifiedOnly)}
                  className={`flex items-center gap-3 w-full p-3 rounded-xl border-2 transition-colors ${
                    verifiedOnly
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                      verifiedOnly ? "bg-purple-600 border-purple-600" : "border-gray-300"
                    }`}
                  >
                    {verifiedOnly && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">Verified Venues Only</p>
                    <p className="text-xs text-gray-500">Show venues verified by ShubhSpace</p>
                  </div>
                </button>
              </div>

              {/* Sort options — visible in sheet on mobile */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Sort By</h4>
                <div className="grid grid-cols-2 gap-2">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSortBy(opt.value)}
                      className={`p-3 rounded-xl border-2 text-sm font-medium text-left transition-colors ${
                        sortBy === opt.value
                          ? "border-purple-500 bg-purple-50 text-purple-700"
                          : "border-gray-200 text-gray-700 hover:border-purple-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Area selection */}
              {popularAreas.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Area</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedArea("")}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                        !selectedArea
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-white text-gray-600 border-gray-200"
                      }`}
                    >
                      All
                    </button>
                    {popularAreas.map((area) => (
                      <button
                        key={area.id}
                        onClick={() => setSelectedArea(selectedArea === area.name ? "" : area.name)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                          selectedArea === area.name
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-white text-gray-600 border-gray-200"
                        }`}
                      >
                        {area.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Apply button */}
              <button
                onClick={() => setShowFilters(false)}
                className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold text-base hover:bg-purple-700 transition-colors"
              >
                Show {filteredVenues.length} Venue{filteredVenues.length !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

