"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search, MapPin, X, AlertCircle, Navigation,
  SlidersHorizontal, ChevronLeft, CheckCircle, Leaf, UtensilsCrossed,
} from "lucide-react";
import { CatererCard } from "@/components/catering/CatererCard";
import { useLocation } from "@/hooks/useLocation";
import { getBmvLocation } from "@/components/home/LocationPermissionModal";

type Caterer = {
  id: string;
  name: string;
  slug: string;
  city: string;
  area?: string;
  minPlatePrice?: number;
  pricePerPlate?: number;
  silverPrice?: number;
  goldPrice?: number;
  platinumPrice?: number;
  isPureVeg?: boolean;
  isVerified?: boolean;
  isAdminListed?: boolean;
  taggedToOwnerId?: string | null;
  bookingEnabled?: boolean;
  viewCount?: number;
  updatedAt?: string;
  description?: string;
  cuisines?: string;
  minGuests?: number;
  packages?: unknown[];
  latitude?: number | null;
  longitude?: number | null;
  images?: string;
  coverImage?: string;
  contactNumber?: string;
  contactName?: string;
  rating?: number;
  distanceText?: string | null;
  distanceKm?: number | null;
  _count?: { reviews: number; bookings: number };
};

const POPULAR_AREAS = [
  "Salt Lake", "New Town", "Rajarhat", "Park Street", "Ballygunge",
  "Jadavpur", "Behala", "Barasat", "Madhyamgram", "Howrah",
];

const SORT_OPTIONS = [
  { value: "default",    label: "Featured" },
  { value: "nearby",     label: "Nearest" },
  { value: "price-low",  label: "Price Low-High" },
  { value: "price-high", label: "Price High-Low" },
  { value: "veg-first",  label: "Veg First" },
] as const;

export default function CateringPage() {
  const PAGE_SIZE = 20;
  const [caterers, setCaterers] = useState<Caterer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [sortBy, setSortBy] = useState<"default" | "price-low" | "price-high" | "veg-first" | "nearby">("default");
  const { location, loading: locationLoading, isPermissionDenied } = useLocation();
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [pureVegOnly, setPureVegOnly] = useState(false);
  const [wishlistCatererIds, setWishlistCatererIds] = useState<Set<string>>(new Set());
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

  // Fetch user's wishlisted caterer IDs once session is loaded
  useEffect(() => {
    fetch("/api/wishlist", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const ids = new Set<string>();
        (d.wishlist || []).forEach((item: any) => { if (item.catererId) ids.add(item.catererId); });
        setWishlistCatererIds(ids);
      })
      .catch(() => setWishlistCatererIds(new Set()));
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [sortBy, selectedArea, pureVegOnly, debouncedSearch, location?.lat, location?.lng]);

  useEffect(() => {
    if (locationLoading) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        params.set("page", String(page));
        params.set("limit", String(PAGE_SIZE));
        if (selectedArea) params.set("area", selectedArea);
        if (pureVegOnly) params.set("isPureVeg", "true");
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (location) {
          params.set("lat", location.lat.toString());
          params.set("lng", location.lng.toString());
        }

        if (sortBy === "price-low") params.set("sortBy", "price-low");
        else if (sortBy === "price-high") params.set("sortBy", "price-high");
        else if (sortBy === "nearby") params.set("sortBy", "nearby");
        else if (sortBy === "default") params.set("sortBy", "newest");

        const response = await fetch(`/api/catering?${params.toString()}`);
        const data = await response.json();

        if (!response.ok || data.error) {
          throw new Error(data.error || "Failed to load caterers");
        }

        let nextCaterers: Caterer[] = data.caterers || [];

        if (sortBy === "veg-first") {
          nextCaterers = [...nextCaterers].sort((a, b) => Number(Boolean(b.isPureVeg)) - Number(Boolean(a.isPureVeg)));
        }

        setCaterers(nextCaterers);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalResults(data.pagination?.total || data.total || 0);
      } catch (err: any) {
        setError(err?.message || "Failed to load caterers");
        setCaterers([]);
        setTotalPages(1);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sortBy, selectedArea, pureVegOnly, location, locationLoading, page, debouncedSearch]);

  const filteredCaterers = useMemo(() => {
    return caterers;
  }, [caterers]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSortBy("default");
    setSelectedArea("");
    setPureVegOnly(false);
    setPage(1);
  }, []);

  const getCatererImage = useCallback((c: Caterer) => {
    if (c.coverImage) return c.coverImage;
    if (c.images) return c.images.split(",")[0] || "https://images.unsplash.com/photo-1555244162-803834f70033?w=800";
    return "https://images.unsplash.com/photo-1555244162-803834f70033?w=800";
  }, []);

  const activeFilterCount = (pureVegOnly ? 1 : 0) + (selectedArea ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Sticky top bar */}
      <div className="bg-white border-b sticky top-0 lg:top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 pt-3 pb-0">
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button onClick={() => window.history.back()} className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">Caterers in {currentLocationLabel}</h1>
                {!loading && (
                  <p className="text-xs text-gray-400">
                    {totalResults} caterer{totalResults !== 1 ? "s" : ""} found
                  </p>
                )}
              </div>
            </div>
            {/* Filter button */}
            <button
              onClick={() => setShowFilters(true)}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors border ${
                activeFilterCount > 0
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-gray-700 border-gray-200 hover:border-orange-300"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white text-orange-600 text-[10px] font-bold rounded-full flex items-center justify-center border border-orange-300">
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
              placeholder="Search caterers, cuisines, areas..."
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
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-700"
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
              Location denied - distances from Kolkata centre.{" "}
              <button onClick={() => window.location.reload()} className="underline font-semibold">
                Allow location
              </button>
            </span>
          </div>
        )}

        {/* Area + Veg pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide mb-5">
          <button
            onClick={() => setSelectedArea("")}
            className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              !selectedArea && !pureVegOnly
                ? "bg-[#0b5fab] text-white border-[#0b5fab]"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#0b5fab]/40"
            }`}
          >
            All
          </button>
          {/* Veg quick-toggle chip */}
          <button
            onClick={() => setPureVegOnly(!pureVegOnly)}
            className={`flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              pureVegOnly
                ? "bg-[#0b5fab] text-white border-[#0b5fab]"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#0b5fab]/40"
            }`}
          >
            <Leaf className="w-2.5 h-2.5" /> Pure Veg
          </button>
          {POPULAR_AREAS.map((area) => (
            <button
              key={area}
              onClick={() => setSelectedArea(selectedArea === area ? "" : area)}
              className={`flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                selectedArea === area
                  ? "bg-[#0b5fab] text-white border-[#0b5fab]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#0b5fab]/40"
              }`}
            >
              <MapPin className="w-2.5 h-2.5" />
              {area}
            </button>
          ))}
        </div>

        {/* Active filters strip */}
        {(searchQuery || pureVegOnly) && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {searchQuery && (
              <span className="flex items-center gap-1 text-xs bg-[#0b5fab]/5 text-[#0b5fab] border border-[#0b5fab]/20 px-2.5 py-1 rounded-full font-medium">
                &ldquo;{searchQuery}&rdquo;
                <button onClick={() => setSearchQuery("")}><X className="w-3 h-3" /></button>
              </span>
            )}
            {pureVegOnly && (
              <span className="flex items-center gap-1 text-xs bg-[#0b5fab]/5 text-[#0b5fab] border border-[#0b5fab]/20 px-2.5 py-1 rounded-full font-medium">
                Pure veg only
                <button onClick={() => setPureVegOnly(false)}><X className="w-3 h-3" /></button>
              </span>
            )}
            <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-gray-600 underline">
              Clear all
            </button>
          </div>
        )}

        {/* Loading skeletons - list style */}
        {loading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 p-3 bg-white rounded-2xl border border-gray-100 animate-pulse">
                <div className="w-24 h-24 flex-shrink-0 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
                  <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
                  <div className="h-3 bg-gray-100 rounded-lg w-2/3" />
                  <div className="h-4 bg-gray-200 rounded-lg w-1/3 mt-2" />
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
        {!loading && !error && filteredCaterers.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
            <UtensilsCrossed className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">No Caterers Found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery || selectedArea || pureVegOnly ? "Try adjusting your filters" : "No caterers available yet"}
            </p>
            {(searchQuery || selectedArea || pureVegOnly) && (
              <button onClick={clearFilters} className="px-5 py-2 bg-[#0b5fab] text-white rounded-xl text-sm font-semibold hover:bg-[#084a86] transition-colors">
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Caterer list */}
        {!loading && !error && filteredCaterers.length > 0 && (
          <div className="space-y-3">
            {filteredCaterers.map((caterer) => (
              <CatererCard
                key={caterer.id}
                id={caterer.id}
                slug={caterer.slug}
                name={caterer.name}
                city={caterer.city}
                area={caterer.area}
                minPlatePrice={caterer.minPlatePrice || caterer.silverPrice || 0}
                silverPrice={caterer.silverPrice}
                goldPrice={caterer.goldPrice}
                platinumPrice={caterer.platinumPrice}
                rating={caterer.rating || 0}
                totalReviews={caterer._count?.reviews || 0}
                isPureVeg={caterer.isPureVeg || false}
                coverImage={getCatererImage(caterer)}
                description={caterer.description}
                imagesCount={caterer.images ? caterer.images.split(",").filter(Boolean).length : (caterer.coverImage ? 1 : 0)}
                hasCoordinates={Boolean(caterer.latitude && caterer.longitude)}
                hasCuisineData={Boolean(caterer.cuisines && caterer.cuisines.trim())}
                minGuests={caterer.minGuests}
                hasMenuPackages={Boolean(caterer.packages && caterer.packages.length > 0)}
                isVerified={caterer.isVerified}
                bookingEnabled={caterer.bookingEnabled}
                isAdminListed={caterer.isAdminListed}
                taggedToOwnerId={caterer.taggedToOwnerId || undefined}
                contactNumber={caterer.contactNumber}
                contactName={caterer.contactName}
                viewCount={caterer.viewCount}
                updatedAt={caterer.updatedAt}
                distanceText={caterer.distanceText || undefined}
                bookingCount={caterer._count?.bookings || 0}
                inWishlist={wishlistCatererIds.has(caterer.id)}
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
            <div className="flex justify-center pt-3 pb-1"><div className="h-1 w-10 rounded-full bg-slate-200" /></div>
            <div className="px-5 pb-6">
              <div className="flex items-center justify-between border-b border-slate-200 py-3">
                <h3 className="text-lg font-bold text-slate-900">Sort By</h3>
                <button onClick={() => setShowSortSheet(false)} className="text-sm font-semibold text-[#0b5fab]">Done</button>
              </div>
              <div className="mt-4 space-y-2">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortBy(opt.value); setShowSortSheet(false); }}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors ${
                      sortBy === opt.value ? "border-[#0b5fab] bg-[#0b5fab]/5" : "border-slate-200 bg-white"
                    }`}
                  >
                    <span className="font-semibold text-slate-900">{opt.label}</span>
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
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowFilters(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto sheet-enter">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            <div className="px-5 pb-8">
              <div className="flex items-center justify-between py-3 border-b mb-5">
                <h3 className="font-bold text-gray-900 text-lg">Filters</h3>
                <button onClick={clearFilters} className="text-sm text-[#0b5fab] font-semibold">
                  Clear All
                </button>
              </div>

              {/* Veg toggle */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Dietary Preference</h4>
                <button
                  onClick={() => setPureVegOnly(!pureVegOnly)}
                  className={`flex items-center gap-3 w-full p-3 rounded-xl border-2 transition-colors ${
                    pureVegOnly ? "border-[#0b5fab] bg-[#0b5fab]/5" : "border-gray-200 bg-white"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${pureVegOnly ? "bg-[#0b5fab] border-[#0b5fab]" : "border-gray-300"}`}>
                    {pureVegOnly && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                      <Leaf className="w-3.5 h-3.5 text-[#0b5fab]" /> Pure Vegetarian Only
                    </p>
                    <p className="text-xs text-gray-500">Show only 100% veg caterers</p>
                  </div>
                </button>
              </div>

              {/* Sort options */}
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

              {/* Area filter */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Area</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedArea("")}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      !selectedArea ? "bg-[#0b5fab] text-white border-[#0b5fab]" : "bg-white text-gray-600 border-gray-200"
                    }`}
                  >
                    All
                  </button>
                  {POPULAR_AREAS.map((area) => (
                    <button
                      key={area}
                      onClick={() => setSelectedArea(selectedArea === area ? "" : area)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                        selectedArea === area ? "bg-[#0b5fab] text-white border-[#0b5fab]" : "bg-white text-gray-600 border-gray-200"
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowFilters(false)}
                className="w-full py-4 bg-[#0b5fab] text-white rounded-2xl font-bold text-base hover:bg-[#084a86] transition-colors"
              >
                Show {totalResults} Caterer{totalResults !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
