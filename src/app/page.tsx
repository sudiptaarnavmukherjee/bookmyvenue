"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Calendar, Filter, X, Users, IndianRupee, SlidersHorizontal, ChevronDown, Star, Loader2 } from "lucide-react";
import { ModeToggle } from "@/components/home/ModeToggle";
import { VenueCard } from "@/components/venue/VenueCard";
import { CatererCard } from "@/components/catering/CatererCard";
import { useRouter } from "next/navigation";
import { useOwnerRedirect } from "@/hooks/useOwnerRedirect";
import { api } from "@/lib/api-client";

type Mode = "venues" | "catering";

export default function HomePage() {
  useOwnerRedirect();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("venues");
  const [searchCity, setSearchCity] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [priceRange, setPriceRange] = useState<[number, number]>([10000, 500000]);
  const [guestCount, setGuestCount] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [sortBy, setSortBy] = useState("recommended");
  const [pureVegOnly, setPureVegOnly] = useState(false);

  // Data states
  const [venues, setVenues] = useState<any[]>([]);
  const [caterers, setCaterers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (mode === "venues") {
          const { data, error: err } = await api.getVenues();
          if (err) {
            setError(err);
          } else {
            setVenues((data as any)?.venues || []);
          }
        } else {
          const { data, error: err } = await api.getCaterers();
          if (err) {
            setError(err);
          } else {
            setCaterers((data as any)?.caterers || []);
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mode]);

  // Apply filters
  const filteredVenues = venues.filter(venue => {
    if (selectedCity !== "all" && venue.city !== selectedCity) return false;
    if (guestCount && venue.capacity < parseInt(guestCount)) return false;
    
    const price = venue.price;
    if (price && (price < priceRange[0] || price > priceRange[1])) return false;
    
    return true;
  });

  const filteredCaterers = caterers.filter(caterer => {
    if (selectedCity !== "all" && caterer.city !== selectedCity) return false;
    if (pureVegOnly && !caterer.isPureVeg) return false;
    if (caterer.pricePerPlate < priceRange[0] || caterer.pricePerPlate > priceRange[1]) return false;
    return true;
  });

  // Get unique cities from data
  const cities = Array.from(new Set([
    ...venues.map(v => v.city),
    ...caterers.map(c => c.city)
  ])).filter(Boolean).sort();
  const sortOptions = [
    { value: "recommended", label: "Recommended" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "rating", label: "Highest Rated" },
    { value: "popular", label: "Most Popular" }
  ];

  const handleQuickSearch = () => {
    const params = new URLSearchParams();
    if (searchCity) params.set("city", searchCity);
    if (searchDate) params.set("date", searchDate);
    if (guestCount) params.set("guests", guestCount);
    params.set("minPrice", priceRange[0].toString());
    params.set("maxPrice", priceRange[1].toString());
    if (pureVegOnly) params.set("pureVeg", "true");
    
    const targetPage = mode === "venues" ? "/venues" : "/catering";
    router.push(`${targetPage}?${params.toString()}`);
  };

  const activeFiltersCount = [
    selectedCity !== "all",
    guestCount !== "",
    pureVegOnly,
    priceRange[0] !== 10000 || priceRange[1] !== 500000
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0">
      {/* Compact Search Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          {/* Top Row: Mode Toggle + Quick Search */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-shrink-0">
              <ModeToggle mode={mode} onChange={setMode} />
            </div>
            
            <div className="flex-1 flex items-center gap-2">
              {/* City Search */}
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="City..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                />
              </div>

              {mode === "venues" && (
                <div className="flex-1 relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                  />
                </div>
              )}

              <div className="flex-1 relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  placeholder="Guests..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                />
              </div>

              <button
                onClick={handleQuickSearch}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                <Search className="h-5 w-5" />
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="relative px-4 py-2.5 border-2 border-purple-600 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-all"
              >
                <Filter className="h-5 w-5" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filter Pills Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-1.5 bg-gray-100 border border-gray-300 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-4 py-1.5 bg-gray-100 border border-gray-300 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>

            {mode === "catering" && (
              <button
                onClick={() => setPureVegOnly(!pureVegOnly)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  pureVegOnly 
                    ? "bg-green-600 text-white" 
                    : "bg-gray-100 border border-gray-300 text-gray-700"
                }`}
              >
                🥬 Pure Veg
              </button>
            )}

            <div className="px-4 py-1.5 bg-purple-100 border border-purple-300 rounded-full text-sm font-medium text-purple-700">
              ₹{(priceRange[0]/1000).toFixed(0)}K - ₹{(priceRange[1]/1000).toFixed(0)}K
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters Drawer */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowFilters(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 20 }}
              className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Filters</h2>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                      Price Range
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="10000"
                        max="500000"
                        step="10000"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                        className="w-full"
                      />
                      <input
                        type="range"
                        min="10000"
                        max="500000"
                        step="10000"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="text-purple-600">₹{(priceRange[0]/1000).toFixed(0)}K</span>
                        <span className="text-purple-600">₹{(priceRange[1]/1000).toFixed(0)}K</span>
                      </div>
                    </div>
                  </div>

                  {/* Guest Count */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                      Number of Guests
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 500"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={guestCount}
                      onChange={(e) => setGuestCount(e.target.value)}
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                      City
                    </label>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">All Cities</option>
                      {cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  {mode === "catering" && (
                    <div>
                      <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-xl cursor-pointer hover:border-purple-500 transition-colors">
                        <input
                          type="checkbox"
                          checked={pureVegOnly}
                          onChange={(e) => setPureVegOnly(e.target.checked)}
                          className="w-5 h-5 text-purple-600 rounded"
                        />
                        <span className="font-semibold text-gray-900">🥬 Pure Vegetarian Only</span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => {
                      setPriceRange([10000, 500000]);
                      setGuestCount("");
                      setSelectedCity("all");
                      setPureVegOnly(false);
                    }}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content - Grid Layout */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === "venues" ? "Available Venues" : "Top Caterers"}
            <span className="text-gray-500 font-normal ml-2">
              ({mode === "venues" ? filteredVenues.length : filteredCaterers.length} results)
            </span>
          </h2>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Loading {mode}...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 font-semibold mb-2">Failed to load {mode}</p>
            <p className="text-red-500 text-sm mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && (mode === "venues" ? filteredVenues.length === 0 : filteredCaterers.length === 0) && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
            <p className="text-gray-600 font-semibold text-lg mb-2">No {mode} found</p>
            <p className="text-gray-500 mb-4">Try adjusting your filters or search criteria</p>
            <button
              onClick={() => {
                setPriceRange([10000, 500000]);
                setGuestCount("");
                setSelectedCity("all");
                setPureVegOnly(false);
              }}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Grid Layout */}
        {!loading && !error && (
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {mode === "venues" ? (
              filteredVenues.map((venue, index) => (
                <motion.div
                  key={venue.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <VenueCard {...venue} />
                </motion.div>
              ))
            ) : (
              filteredCaterers.map((caterer, index) => (
                <motion.div
                  key={caterer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <CatererCard {...caterer} />
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
