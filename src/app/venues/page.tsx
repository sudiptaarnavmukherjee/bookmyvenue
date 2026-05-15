"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search, Filter, MapPin, X, Loader2, AlertCircle,
  Navigation, SlidersHorizontal, CheckCircle, ChevronLeft,
} from "lucide-react";
import { VenueCard } from "@/components/venue/VenueCard";
import { useLocation } from "@/hooks/useLocation";
import { getBmvLocation } from "@/components/home/LocationPermissionModal";

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
  description?: string;
  priceMode?: string;
  marriagePrice?: number | null;
  birthdayPrice?: number | null;
  otherEventPrice?: number | null;
  isVerified: boolean;
  isAdminListed?: boolean;
  taggedToOwnerId?: string | null;
  bookingEnabled?: boolean;
  updatedAt?: string;
  _count?: { reviews?: number; bookings?: number };
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
  const PAGE_SIZE = 24;
  const [venues, setVenues] = useState<Venue[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [sortBy, setSortBy] = useState<"area" | "price-low" | "price-high" | "popular" | "newest" | "nearby">("area");
  const { location, loading: locationLoading, isPermissionDenied } = useLocation();
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState<"" | "MARRIAGE" | "BIRTHDAY" | "OTHER">("MARRIAGE");
  const [wishlistVenueIds, setWishlistVenueIds] = useState<Set<string>>(new Set());
  const [currentLocationLabel, setCurrentLocationLabel] = useState("Kolkata");

  useEffect(() => {
    const stored = getBmvLocation();
    if (stored?.label) setCurrentLocationLabel(stored.label);
    const handler = (e: Event) => {
      const d = (e as CustomEvent<{ label: string }>).detail;
      if (d?.label) setCurrentLocationLabel(d.label);
    };
    window.addEventListener("bmv:locationUpdated", handler);
    return () => window.removeEventListener("bmv:locationUpdated", handler);
  }, []);

  // Fetch user's wishlisted venue IDs once session is loaded
  useEffect(() => {
    fetch("/api/wishlist", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const ids = new Set<string>();
        (d.wishlist || []).forEach((item: any) => { if (item.venueId) ids.add(item.venueId); });
        setWishlistVenueIds(ids);
      })
      .catch(() => setWishlistVenueIds(new Set()));
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [sortBy, selectedArea, debouncedSearch, location?.lat, location?.lng]);

  useEffect(() => {
    if (locationLoading) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("sortBy", sortBy);
        params.set("page", String(page));
        params.set("limit", String(PAGE_SIZE));
        if (selectedArea) params.set("area", selectedArea);
        if (debouncedSearch) params.set("search", debouncedSearch);
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
          setTotalPages(data.pagination?.totalPages || 1);
          setTotalResults(data.pagination?.total || data.total || 0);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load venues");
        setTotalPages(1);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sortBy, selectedArea, location, locationLoading, page, debouncedSearch]);

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
      if (verifiedOnly && !venue.isVerified) return false;
      // Event type filter — only exclude if the venue has at least one event-type price set
      // (venues without any event pricing pass through to avoid hiding non-priced venues)
      if (eventTypeFilter) {
        const hasAnyEventPrice = venue.marriagePrice || venue.birthdayPrice || venue.otherEventPrice;
        if (hasAnyEventPrice) {
          if (eventTypeFilter === "MARRIAGE" && !venue.marriagePrice) return false;
          if (eventTypeFilter === "BIRTHDAY" && !venue.birthdayPrice) return false;
          if (eventTypeFilter === "OTHER" && !venue.otherEventPrice) return false;
        }
      }
      return true;
    });
  }, [venues, verifiedOnly, eventTypeFilter]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSortBy("area");
    setSelectedArea("");
    setVerifiedOnly(false);
    setEventTypeFilter("MARRIAGE");
    setPage(1);
  }, []);

  const getVenueImage = useCallback((venue: Venue) => {
    if (venue.coverImage) return venue.coverImage;
    if (venue.images) {
      const imgs = venue.images.split(",");
      return imgs[0] || "https://images.unsplash.com/photo-1519167758481-83f29da8c456?w=800";
    }
    return "https://images.unsplash.com/photo-1519167758481-83f29da8c456?w=800";
  }, []);

  const activeFilterCount = (verifiedOnly ? 1 : 0) + (selectedArea ? 1 : 0) + (eventTypeFilter ? 1 : 0);

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
      <div className="sticky top-0 lg:top-16 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <button onClick={() => window.history.back()} className="flex items-center gap-2 rounded-full px-1 py-1 text-left">
              <ChevronLeft className="h-5 w-5 text-slate-600" />
              <div>
                <h1 className="text-lg font-extrabold leading-tight text-slate-900">Compare Venues in {currentLocationLabel}</h1>
                {!loading && <p className="text-xs text-slate-400">{totalResults} venue{totalResults !== 1 ? "s" : ""} • Research & shortlist</p>}
              </div>
            </button>
            <button
              onClick={() => setShowFilters(true)}
              className={`relative flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-bold transition-colors ${
                activeFilterCount > 0
                  ? "border-[#0b5fab] bg-[#0b5fab] text-white"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-[#0b5fab]/30 bg-white text-[10px] font-bold text-[#0b5fab]">{activeFilterCount}</span>
              )}
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-[#f8fbff] p-3 shadow-sm">
            <div className="grid gap-2 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-stretch">
              <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left" onClick={() => setShowFilters(true)}>
                <MapPin className="h-4 w-4 text-[#0b5fab]" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">City</p>
                  <p className="truncate text-sm font-bold text-slate-900">{currentLocationLabel}</p>
                </div>
              </button>
              <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left" onClick={() => setShowFilters(true)}>
                <Search className="h-4 w-4 text-[#0b5fab]" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Search</p>
                  <p className="truncate text-sm font-bold text-slate-900">{searchQuery || "Search venues"}</p>
                </div>
              </button>
              <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left" onClick={() => setShowSortSheet(true)}>
                <Navigation className="h-4 w-4 text-[#0b5fab]" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Sort</p>
                  <p className="truncate text-sm font-bold text-slate-900">{SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label}</p>
                </div>
              </button>
              <button onClick={() => setShowFilters(true)} className="travel-search-button min-h-[56px] px-5">All Filters</button>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    sortBy === opt.value
                      ? "border-[#0b5fab] bg-[#0b5fab] text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-[#0b5fab]/40 hover:text-[#0b5fab]"
                  }`}
                >
                  {opt.label.replace(/^[^A-Za-z]+\s*/, "")}
                </button>
              ))}
            </div>

            {/* Event type quick filter */}
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {([
                { value: "" as const, label: "All Events" },
                { value: "MARRIAGE" as const, label: "💍 Marriage" },
                { value: "BIRTHDAY" as const, label: "🎂 Birthday" },
                { value: "OTHER" as const, label: "🎪 Other" },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setEventTypeFilter(opt.value)}
                  className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    eventTypeFilter === opt.value
                      ? "border-rose-500 bg-rose-500 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-rose-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {popularAreas.slice(0, 6).map((area) => (
              <button
                key={area.id}
                onClick={() => setSelectedArea(selectedArea === area.name ? "" : area.name)}
                className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selectedArea === area.name
                    ? "border-[#0b5fab] bg-[#0b5fab] text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-[#0b5fab]/40"
                }`}
              >
                {area.name}
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
                    ? "bg-[#0b5fab] text-white border-[#0b5fab]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#0b5fab]/40"
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
                    ? "bg-[#0b5fab] text-white border-[#0b5fab]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#0b5fab]/40"
                }`}
              >
                <MapPin className="w-2.5 h-2.5" />
                {area.name}
                {area.venueCount > 0 && (
                  <span className={`text-[10px] ${selectedArea === area.name ? "text-sky-100" : "text-gray-400"}`}>
                    ({area.venueCount})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Active filter strip */}
        {(searchQuery || verifiedOnly || eventTypeFilter) && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {searchQuery && (
              <span className="flex items-center gap-1 text-xs bg-[#0b5fab]/5 text-[#0b5fab] border border-[#0b5fab]/20 px-2.5 py-1 rounded-full font-medium">
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
            {eventTypeFilter && (
              <span className="flex items-center gap-1 text-xs bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full font-medium">
                {eventTypeFilter === "MARRIAGE" ? "💍 Marriage" : eventTypeFilter === "BIRTHDAY" ? "🎂 Birthday" : "🎪 Other"}
                <button onClick={() => setEventTypeFilter("")}><X className="w-3 h-3" /></button>
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
              className="px-5 py-2 bg-[#0b5fab] text-white rounded-xl text-sm font-semibold hover:bg-[#084a86] transition-colors"
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
                className="px-5 py-2 bg-[#0b5fab] text-white rounded-xl text-sm font-semibold hover:bg-[#084a86] transition-colors"
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
                description={venue.description}
                imagesCount={venue.images ? venue.images.split(",").filter(Boolean).length : (venue.coverImage ? 1 : 0)}
                hasCoordinates={Boolean(venue.latitude && venue.longitude)}
                isVerified={venue.isVerified}
                bookingEnabled={venue.bookingEnabled}
                isAdminListed={venue.isAdminListed}
                taggedToOwnerId={venue.taggedToOwnerId || undefined}
                contactNumber={venue.contactNumber}
                contactName={venue.contactName}
                viewCount={venue.viewCount}
                updatedAt={venue.updatedAt}
                reviewCount={venue._count?.reviews || 0}
                bookingCount={venue._count?.bookings || 0}
                distanceText={venue.distanceText || undefined}
                marriagePrice={venue.marriagePrice || undefined}
                birthdayPrice={venue.birthdayPrice || undefined}
                otherEventPrice={venue.otherEventPrice || undefined}
                inWishlist={wishlistVenueIds.has(venue.id)}
              />
            ))}
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              Previous
            </button>
            <p className="text-sm text-slate-600">
              Page {page} of {totalPages}
            </p>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showSortSheet && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowSortSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl">
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-slate-200" />
            </div>
            <div className="px-5 pb-6">
              <div className="flex items-center justify-between border-b border-slate-200 py-3">
                <h3 className="text-lg font-bold text-slate-900">Sort By</h3>
                <button onClick={() => setShowSortSheet(false)} className="text-sm font-semibold text-[#0b5fab]">Done</button>
              </div>
              <div className="mt-4 space-y-2">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value);
                      setShowSortSheet(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors ${
                      sortBy === opt.value
                        ? "border-[#0b5fab] bg-[#0b5fab]/5"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <span className="font-semibold text-slate-900">{opt.label.replace(/^[^A-Za-z]+\s*/, "")}</span>
                    <span className={`h-4 w-4 rounded-full border-2 ${sortBy === opt.value ? "border-[#0b5fab] bg-[#0b5fab]" : "border-slate-300"}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Filter bottom sheet */}
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
                  className="text-sm text-[#0b5fab] font-semibold"
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
                      ? "border-[#0b5fab] bg-[#0b5fab]/5"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                      verifiedOnly ? "bg-[#0b5fab] border-[#0b5fab]" : "border-gray-300"
                    }`}
                  >
                    {verifiedOnly && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">Verified Venues Only</p>
                    <p className="text-xs text-gray-500">Show venues verified by Happily Eated</p>
                  </div>
                </button>
              </div>

              {/* Sort options — visible in sheet on mobile */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Event Type</h4>
                <div className="flex flex-wrap gap-2">
                  {([
                    { value: "" as const, label: "All Events" },
                    { value: "MARRIAGE" as const, label: "💍 Marriage / Wedding" },
                    { value: "BIRTHDAY" as const, label: "🎂 Birthday / Anniversary" },
                    { value: "OTHER" as const, label: "🎪 Other Events" },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setEventTypeFilter(opt.value)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
                        eventTypeFilter === opt.value
                          ? "border-rose-500 bg-rose-500 text-white"
                          : "bg-white text-gray-600 border-gray-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
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
                          ? "border-[#0b5fab] bg-[#0b5fab]/5 text-[#0b5fab]"
                          : "border-gray-200 text-gray-700 hover:border-[#0b5fab]/40"
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
                          ? "bg-[#0b5fab] text-white border-[#0b5fab]"
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
                            ? "bg-[#0b5fab] text-white border-[#0b5fab]"
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
                className="w-full py-4 bg-[#0b5fab] text-white rounded-2xl font-bold text-base hover:bg-[#084a86] transition-colors"
              >
                Show {totalResults} Venue{totalResults !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

