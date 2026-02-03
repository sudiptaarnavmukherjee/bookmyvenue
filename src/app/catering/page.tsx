"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Filter, MapPin, X, Loader2, AlertCircle, Leaf, UtensilsCrossed } from "lucide-react";
import { CatererCard } from "@/components/catering/CatererCard";

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
  _count?: {
    reviews: number;
    bookings: number;
  };
};

// Popular areas in Kolkata
const POPULAR_AREAS = [
  "Salt Lake", "New Town", "Rajarhat", "Park Street", "Ballygunge",
  "Jadavpur", "Behala", "Barasat", "Madhyamgram", "Howrah"
];

export default function CateringPage() {
  const [caterers, setCaterers] = useState<Caterer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price-low" | "price-high" | "veg-first">("default");
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [pureVegOnly, setPureVegOnly] = useState(false);

  useEffect(() => {
    const fetchCaterers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/caterers");
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
        } else {
          // Transform API data
          const rawCaterers = data.caterers || [];
          const transformedCaterers = rawCaterers.map((c: any) => ({
            ...c,
            minPlatePrice: c.minPlatePrice || c.pricePerPlate || c.silverPrice || 0,
          }));
          setCaterers(transformedCaterers);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load caterers");
      } finally {
        setLoading(false);
      }
    };
    fetchCaterers();
  }, []);

  // Get unique areas from caterers
  const availableAreas = useMemo(() => {
    const areas = caterers.map(c => c.area).filter(Boolean) as string[];
    return [...new Set(areas)].sort();
  }, [caterers]);

  // Client-side filtering and sorting
  const filteredCaterers = useMemo(() => {
    let result = caterers.filter(caterer => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!caterer.name.toLowerCase().includes(query) && 
            !caterer.city.toLowerCase().includes(query) &&
            !(caterer.area || "").toLowerCase().includes(query)) {
          return false;
        }
      }
      // Area filter
      if (selectedArea && caterer.area !== selectedArea) return false;
      // Pure veg filter
      if (pureVegOnly && !caterer.isPureVeg) return false;
      return true;
    });

    // Sorting
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => (a.minPlatePrice || 0) - (b.minPlatePrice || 0));
        break;
      case "price-high":
        result.sort((a, b) => (b.minPlatePrice || 0) - (a.minPlatePrice || 0));
        break;
      case "veg-first":
        result.sort((a, b) => {
          if (a.isPureVeg === b.isPureVeg) return 0;
          return a.isPureVeg ? -1 : 1;
        });
        break;
    }

    return result;
  }, [caterers, searchQuery, selectedArea, pureVegOnly, sortBy]);

  const clearFilters = () => {
    setSearchQuery("");
    setSortBy("default");
    setSelectedArea("");
    setPureVegOnly(false);
  };

  const getCatererImage = (caterer: Caterer) => {
    if (caterer.coverImage) return caterer.coverImage;
    if (caterer.images) {
      const imgs = caterer.images.split(",");
      return imgs[0] || "https://images.unsplash.com/photo-1555244162-803834f70033?w=800";
    }
    return "https://images.unsplash.com/photo-1555244162-803834f70033?w=800";
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Wedding Caterers</h1>
              <p className="text-sm text-gray-600">Delicious food for your special celebration</p>
            </div>
            <span className="text-sm text-gray-500 hidden sm:block">
              {filteredCaterers.length} caterers
            </span>
          </div>

          {/* Search & Sort Bar */}
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-2.5">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or location..."
                className="flex-1 bg-transparent outline-none text-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-100 rounded-xl px-4 py-2.5 text-sm font-medium outline-none cursor-pointer hidden sm:block"
            >
              <option value="default">🍽️ Featured</option>
              <option value="price-low">💰 Low to High</option>
              <option value="price-high">💰 High to Low</option>
              <option value="veg-first">🥬 Veg First</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                showFilters || pureVegOnly || selectedArea ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-700"
              }`}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Quick Area Filter Pills */}
        <div className="mb-6 overflow-x-auto pb-2 -mx-4 px-4">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setSelectedArea("")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                !selectedArea
                  ? "bg-orange-500 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-orange-300"
              }`}
            >
              All Areas
            </button>
            {/* Pure Veg Quick Toggle */}
            <button
              onClick={() => setPureVegOnly(!pureVegOnly)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                pureVegOnly
                  ? "bg-green-500 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-green-300"
              }`}
            >
              <Leaf className="h-4 w-4" />
              Pure Veg
            </button>
            {POPULAR_AREAS.map((area) => (
              <button
                key={area}
                onClick={() => setSelectedArea(selectedArea === area ? "" : area)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedArea === area
                    ? "bg-orange-500 text-white"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-orange-300"
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl p-4 mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              <button onClick={clearFilters} className="text-sm text-orange-600 font-medium">
                Clear All
              </button>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pureVegOnly}
                  onChange={(e) => setPureVegOnly(e.target.checked)}
                  className="rounded text-green-500 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700 flex items-center gap-1">
                  <Leaf className="h-4 w-4 text-green-500" />
                  Pure Vegetarian Only
                </span>
              </label>
              
              {/* Mobile sort */}
              <div className="sm:hidden w-full">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm font-medium outline-none"
                >
                  <option value="default">🍽️ Featured</option>
                  <option value="price-low">💰 Price: Low to High</option>
                  <option value="price-high">💰 Price: High to Low</option>
                  <option value="veg-first">🥬 Vegetarian First</option>
                </select>
              </div>

              {/* Area dropdown for more areas */}
              {availableAreas.length > POPULAR_AREAS.length && (
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="bg-gray-100 rounded-xl px-4 py-2.5 text-sm font-medium outline-none"
                >
                  <option value="">All Areas</option>
                  {availableAreas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500 mb-4" />
            <p className="text-gray-500">Loading caterers...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">Failed to Load Caterers</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredCaterers.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
            <UtensilsCrossed className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">No Caterers Found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedArea || pureVegOnly ? "Try adjusting your filters" : "No caterers available yet"}
            </p>
            {(searchQuery || selectedArea || pureVegOnly) && (
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Caterers Grid */}
        {!loading && !error && filteredCaterers.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
