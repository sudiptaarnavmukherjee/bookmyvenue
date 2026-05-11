"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search, MapPin, X, AlertCircle, Navigation,
  SlidersHorizontal, ChevronLeft, CheckCircle, Leaf, UtensilsCrossed,
} from "lucide-react";
import { CatererCard } from "@/components/catering/CatererCard";
import { useLocation } from "@/hooks/useLocation";

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
  bookingEnabled?: boolean;
  viewCount?: number;
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
  { value: "default",    label: "ðŸ½ï¸ Featured" },
  { value: "nearby",    label: "ðŸ§­ Nearest" },
  { value: "price-low", label: "ðŸ’° Lowâ€“High" },
  { value: "price-high",label: "ðŸ’° Highâ€“Low" },
  { value: "veg-first", label: "ðŸ¥¬ Veg First" },
] as const;

export default function CateringPage() {
  const [caterers, setCaterers] = useState<Caterer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price-low" | "price-high" | "veg-first" | "nearby">("default");
  const { location, loading: locationLoading, isPermissionDenied } = useLocation();
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [pureVegOnly, setPureVegOnly] = useState(false);

  useEffect(() => {
    if (locationLoading) return;
    const fetchCaterers = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (location) {
          params.set("lat", location.lat.toString());
          params.set("lng", location.lng.toString());
        }
        if (sortBy === "nearby") params.set("sortBy", "nearby");
        const response = await fetch(`/api/catering?${params.toString()}`);
        const data = await response.json();
        if (data.error) {
          setError(data.error);
        } else {
          const raw = data.caterers || [];
          setCaterers(raw.map((c: any) => ({
            ...c,
            minPlatePrice: c.minPlatePrice || c.pricePerPlate || c.silverPrice || 0,
          })));
        }
      } catch (err: any) {
        setError(err.message || "Failed to load caterers");
      } finally {
        setLoading(false);
      }
    };
    fetchCaterers();
  }, [location, locationLoading, sortBy]);

  const filteredCaterers = useMemo(() => {
    let result = caterers.filter((c) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !c.name.toLowerCase().includes(q) &&
          !c.city.toLowerCase().includes(q) &&
          !(c.area || "").toLowerCase().includes(q)
        ) return false;
      }
      if (selectedArea && c.area !== selectedArea) return false;
      if (pureVegOnly && !c.isPureVeg) return false;
      return true;
    });

    switch (sortBy) {
      case "nearby":    result.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)); break;
      case "price-low": result.sort((a, b) => (a.minPlatePrice || 0) - (b.minPlatePrice || 0)); break;
      case "price-high":result.sort((a, b) => (b.minPlatePrice || 0) - (a.minPlatePrice || 0)); break;
      case "veg-first": result.sort((a, b) => (a.isPureVeg === b.isPureVeg ? 0 : a.isPureVeg ? -1 : 1)); break;
    }
    return result;
  }, [caterers, searchQuery, selectedArea, pureVegOnly, sortBy]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSortBy("default");
    setSelectedArea("");
    setPureVegOnly(false);
  }, []);

  const getCatererImage = useCallback((c: Caterer) => {
    if (c.coverImage) return c.coverImage;
    if (c.images) return c.images.split(",")[0] || "https://images.unsplash.com/photo-1555244162-803834f70033?w=800";
    return "https://images.unsplash.com/photo-1555244162-803834f70033?w=800";
  }, []);

  const activeFilterCount = (pureVegOnly ? 1 : 0) + (selectedArea ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* â”€â”€ Sticky top bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border-b sticky top-0 lg:top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 pt-3 pb-0">
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button onClick={() => window.history.back()} className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">Caterers in Kolkata</h1>
                {!loading && (
                  <p className="text-xs text-gray-400">
                    {filteredCaterers.length} caterer{filteredCaterers.length !== 1 ? "s" : ""} found
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
              placeholder="Search caterers, cuisines, areasâ€¦"
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
              Location denied â€” distances from Kolkata centre.{" "}
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
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
            }`}
          >
            All
          </button>
          {/* Veg quick-toggle chip */}
          <button
            onClick={() => setPureVegOnly(!pureVegOnly)}
            className={`flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              pureVegOnly
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-green-400"
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
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
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
              <span className="flex items-center gap-1 text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-full font-medium">
                "{searchQuery}"
                <button onClick={() => setSearchQuery("")}><X className="w-3 h-3" /></button>
              </span>
            )}
            {pureVegOnly && (
              <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium">
                ðŸ¥¬ Pure veg only
                <button onClick={() => setPureVegOnly(false)}><X className="w-3 h-3" /></button>
              </span>
            )}
            <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-gray-600 underline">
              Clear all
            </button>
          </div>
        )}

        {/* Loading skeletons â€” Zomato list style */}
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
              className="px-5 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors"
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
              <button onClick={clearFilters} className="px-5 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors">
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
                isVerified={caterer.isVerified}
                bookingEnabled={caterer.bookingEnabled}
                isAdminListed={caterer.isAdminListed}
                contactNumber={caterer.contactNumber}
                contactName={caterer.contactName}
                viewCount={caterer.viewCount}
                distanceText={caterer.distanceText || undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* â”€â”€ Filter bottom sheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
                <button onClick={clearFilters} className="text-sm text-orange-500 font-semibold">
                  Clear All
                </button>
              </div>

              {/* Veg toggle */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Dietary Preference</h4>
                <button
                  onClick={() => setPureVegOnly(!pureVegOnly)}
                  className={`flex items-center gap-3 w-full p-3 rounded-xl border-2 transition-colors ${
                    pureVegOnly ? "border-green-500 bg-green-50" : "border-gray-200 bg-white"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${pureVegOnly ? "bg-green-600 border-green-600" : "border-gray-300"}`}>
                    {pureVegOnly && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                      <Leaf className="w-3.5 h-3.5 text-green-600" /> Pure Vegetarian Only
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
                          ? "border-orange-400 bg-orange-50 text-orange-700"
                          : "border-gray-200 text-gray-700 hover:border-orange-200"
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
                      !selectedArea ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200"
                    }`}
                  >
                    All
                  </button>
                  {POPULAR_AREAS.map((area) => (
                    <button
                      key={area}
                      onClick={() => setSelectedArea(selectedArea === area ? "" : area)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                        selectedArea === area ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200"
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowFilters(false)}
                className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-base hover:bg-orange-600 transition-colors"
              >
                Show {filteredCaterers.length} Caterer{filteredCaterers.length !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
