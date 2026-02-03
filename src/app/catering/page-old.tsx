"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Filter, MapPin, Star, Leaf, X, Loader2, AlertCircle, CheckCircle2, SlidersHorizontal, UtensilsCrossed } from "lucide-react";
import { api } from "@/lib/api-client";

type Caterer = {
  id: string;
  name: string;
  slug: string;
  city: string;
  pricePerPlate: number;
  isPureVeg: boolean;
  images: string[];
  _count?: {
    reviews: number;
    bookings: number;
  };
};

// Kolkata specific areas
const KOLKATA_AREAS = [
  "Salt Lake (Sector I-V)", "New Town", "Rajarhat",
  "Park Street", "Alipore", "Ballygunge", "Jadavpur",
  "Gariahat", "Behala", "Barasat", "Madhyamgram",
  "Barrackpore", "Howrah", "Dum Dum", "Tollygunge",
  "Kasba", "Ruby Area", "E.M. Bypass", "Science City Area"
];

const CUISINE_TYPES = [
  "North Indian", "South Indian", "Bengali", "Chinese",
  "Continental", "Italian", "Mexican", "Thai",
  "Mughlai", "Punjabi", "Street Food", "Desserts"
];

const SERVICE_TYPES = [
  "Buffet Service", "Live Counters", "Plated Service",
  "Cocktail Catering", "BBQ/Grill", "Live Chat Station",
  "Dessert Bar", "Welcome Drinks"
];

export default function CateringPage() {
  const router = useRouter();
  const [caterers, setCaterers] = useState<Caterer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price-low" | "price-high" | "veg-first">("default");
  const [filters, setFilters] = useState({
    cities: [] as string[],
    areas: [] as string[],
    cuisineTypes: [] as string[],
    serviceTypes: [] as string[],
    maxPrice: 1500,
    pureVegOnly: false
  });

  useEffect(() => {
    const fetchCaterers = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await api.getCaterers();
        if (err) {
          setError(err);
        } else {
          // Transform API data to handle comma-separated images
          const rawCaterers = (data as any)?.caterers || [];
          const transformedCaterers = rawCaterers.map((c: any) => ({
            ...c,
            pricePerPlate: c.minPlatePrice || c.pricePerPlate || 0,
            images: typeof c.images === 'string'
              ? (c.images ? c.images.split(',').filter(Boolean) : [])
              : (c.images || []),
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

  const availableCities = Array.from(new Set(caterers.map(c => c.city))).filter(Boolean).sort();

  const toggleCity = (city: string) => {
    setFilters(prev => ({
      ...prev,
      cities: prev.cities.includes(city)
        ? prev.cities.filter(c => c !== city)
        : [...prev.cities, city]
    }));
  };

  const toggleArea = (area: string) => {
    setFilters(prev => ({
      ...prev,
      areas: prev.areas.includes(area)
        ? prev.areas.filter(a => a !== area)
        : [...prev.areas, area]
    }));
  };

  const toggleCuisine = (cuisine: string) => {
    setFilters(prev => ({
      ...prev,
      cuisineTypes: prev.cuisineTypes.includes(cuisine)
        ? prev.cuisineTypes.filter(c => c !== cuisine)
        : [...prev.cuisineTypes, cuisine]
    }));
  };

  const toggleService = (service: string) => {
    setFilters(prev => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(service)
        ? prev.serviceTypes.filter(s => s !== service)
        : [...prev.serviceTypes, service]
    }));
  };

  const filteredCaterers = caterers.filter(caterer => {
    // Search query
    if (searchQuery && !caterer.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    // City filter
    if (filters.cities.length > 0 && !filters.cities.includes(caterer.city)) return false;
    // Price filter
    if (caterer.pricePerPlate > filters.maxPrice) return false;
    // Pure veg filter
    if (filters.pureVegOnly && !caterer.isPureVeg) return false;
    // Note: Cuisine and service type filters would require database fields
    return true;
  });

  // Apply sorting
  const sortedCaterers = [...filteredCaterers].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.pricePerPlate - b.pricePerPlate;
      case "price-high":
        return b.pricePerPlate - a.pricePerPlate;
      case "veg-first":
        if (a.isPureVeg === b.isPureVeg) return 0;
        return a.isPureVeg ? -1 : 1;
      default:
        return 0;
    }
  });

  const clearFilters = () => {
    setFilters({
      cities: [],
      areas: [],
      cuisineTypes: [],
      serviceTypes: [],
      maxPrice: 1500,
      pureVegOnly: false
    });
    setSearchQuery("");
    setSortBy("default");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-24 pt-8">
      <div className="mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gradient mb-2">Wedding Catering</h1>
          <p className="text-gray-600">Delicious food for your special day</p>
        </motion.div>

        {/* Search and Filter Bar */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="glass-card flex flex-1 items-center gap-3 rounded-2xl px-4 py-3">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search caterers by name..."
              className="flex-1 bg-transparent outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="glass-card rounded-2xl px-4 py-3 min-w-[200px]">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-gray-600" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 bg-transparent outline-none font-semibold cursor-pointer"
              >
                <option value="default">Sort By: Default</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="veg-first">Veg First</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="glass-card flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-semibold hover:bg-white/80 transition-colors"
          >
            <Filter className="h-5 w-5" />
            Filters {(filters.cities.length + filters.areas.length + filters.cuisineTypes.length + filters.serviceTypes.length > 0) && (
              <span className="ml-1 rounded-full bg-purple-600 text-white text-xs px-2 py-0.5">
                {filters.cities.length + filters.areas.length + filters.cuisineTypes.length + filters.serviceTypes.length}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-3xl p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5" />
                Catering Filters
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={clearFilters}
                  className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
                >
                  Clear All
                </button>
                <button onClick={() => setShowFilters(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* City Filter */}
              <div>
                <label className="mb-3 block font-semibold text-gray-700">City</label>
                <div className="grid grid-cols-2 gap-3">
                  {availableCities.length > 0 ? (
                    availableCities.map(city => (
                      <label
                        key={city}
                        className="flex items-center gap-2 cursor-pointer hover:bg-purple-50 p-2 rounded-lg transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={filters.cities.includes(city)}
                          onChange={() => toggleCity(city)}
                          className="rounded text-purple-600"
                        />
                        <span className="text-sm">{city}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 col-span-2">No cities available</p>
                  )}
                </div>
              </div>

              {/* Kolkata Areas Filter */}
              {filters.cities.includes("Kolkata") && (
                <div>
                  <label className="mb-3 block font-semibold text-gray-700">
                    Kolkata Areas <span className="text-xs text-gray-500">(19 locations)</span>
                  </label>
                  <div className="max-h-48 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                    {KOLKATA_AREAS.map(area => (
                      <label
                        key={area}
                        className="flex items-center gap-2 cursor-pointer hover:bg-purple-50 p-2 rounded-lg transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={filters.areas.includes(area)}
                          onChange={() => toggleArea(area)}
                          className="rounded text-purple-600"
                        />
                        <span className="text-sm">{area}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Cuisine Types Filter */}
              <div>
                <label className="mb-3 block font-semibold text-gray-700">Cuisine Types</label>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                  {CUISINE_TYPES.map(cuisine => (
                    <label
                      key={cuisine}
                      className="flex items-center gap-2 cursor-pointer hover:bg-purple-50 p-2 rounded-lg transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={filters.cuisineTypes.includes(cuisine)}
                        onChange={() => toggleCuisine(cuisine)}
                        className="rounded text-purple-600"
                      />
                      <span className="text-sm">{cuisine}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Service Types Filter */}
              <div>
                <label className="mb-3 block font-semibold text-gray-700">Service Types</label>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                  {SERVICE_TYPES.map(service => (
                    <label
                      key={service}
                      className="flex items-center gap-2 cursor-pointer hover:bg-purple-50 p-2 rounded-lg transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={filters.serviceTypes.includes(service)}
                        onChange={() => toggleService(service)}
                        className="rounded text-purple-600"
                      />
                      <span className="text-sm">{service}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 space-y-6">
              {/* Price Filter */}
              <div>
                <label className="mb-3 block font-semibold text-gray-700">
                  Max Price per Plate: <span className="text-purple-600">₹{filters.maxPrice}</span>
                </label>
                <input
                  type="range"
                  min="300"
                  max="1500"
                  step="50"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({...filters, maxPrice: parseInt(e.target.value)})}
                  className="w-full accent-purple-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>₹300</span>
                  <span>₹900</span>
                  <span>₹1500</span>
                </div>
              </div>

              {/* Pure Veg Only */}
              <label className="flex items-center gap-2 cursor-pointer p-3 hover:bg-green-50 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={filters.pureVegOnly}
                  onChange={(e) => setFilters({...filters, pureVegOnly: e.target.checked})}
                  className="rounded text-green-600"
                />
                <Leaf className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-gray-700">Pure Veg Only</span>
              </label>
            </div>

            {/* Active Filters Summary */}
            {(filters.cities.length + filters.areas.length + filters.cuisineTypes.length + filters.serviceTypes.length > 0 || filters.pureVegOnly) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-3">Active Filters:</p>
                <div className="flex flex-wrap gap-2">
                  {filters.cities.map(city => (
                    <span key={city} className="bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                      {city}
                      <button onClick={() => toggleCity(city)} className="hover:text-purple-900">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {filters.areas.map(area => (
                    <span key={area} className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                      {area}
                      <button onClick={() => toggleArea(area)} className="hover:text-blue-900">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {filters.cuisineTypes.map(cuisine => (
                    <span key={cuisine} className="bg-pink-100 text-pink-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                      {cuisine}
                      <button onClick={() => toggleCuisine(cuisine)} className="hover:text-pink-900">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {filters.serviceTypes.map(service => (
                    <span key={service} className="bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                      {service}
                      <button onClick={() => toggleService(service)} className="hover:text-orange-900">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {filters.pureVegOnly && (
                    <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                      Pure Veg Only
                      <button onClick={() => setFilters({...filters, pureVegOnly: false})} className="hover:text-green-900">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Results Count */}
        <p className="mb-4 text-sm text-gray-600 flex items-center justify-between">
          <span>Showing {sortedCaterers.length} of {caterers.length} caterers</span>
          {sortBy !== "default" && (
            <span className="text-xs text-purple-600 font-semibold">
              Sorted by: {sortBy === "price-low" ? "Price (Low to High)" : 
                         sortBy === "price-high" ? "Price (High to Low)" : "Veg First"}
            </span>
          )}
        </p>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
            <p className="text-gray-600">Loading caterers...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="glass-card rounded-3xl p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Failed to Load Caterers</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white shadow-lg hover:shadow-xl transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && sortedCaterers.length === 0 && (
          <div className="glass-card rounded-3xl p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Caterers Found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filters.cities.length > 0 || filters.areas.length > 0
                ? "Try adjusting your filters or search query"
                : "No caterers available at the moment"}
            </p>
            {(searchQuery || filters.cities.length > 0 || filters.areas.length > 0) && (
              <button
                onClick={clearFilters}
                className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white shadow-lg hover:shadow-xl transition-all"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* Caterers Grid */}
        {!loading && !error && sortedCaterers.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortedCaterers.map((caterer, index) => (
            <motion.div
              key={caterer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => router.push(`/catering/${caterer.slug}`)}
              className="glass-card overflow-hidden rounded-3xl hover-lift cursor-pointer"
            >
              <div className="relative h-48">
                <img
                  src={(Array.isArray(caterer.images) && caterer.images[0]) || "https://images.unsplash.com/photo-1555244162-803834f70033?w=800"}
                  alt={caterer.name}
                  className="h-full w-full object-cover"
                />
                {caterer.isPureVeg && (
                  <div className="absolute top-3 right-3 rounded-full bg-green-600 px-3 py-1.5 shadow-lg">
                    <Leaf className="inline h-4 w-4 text-white mr-1" />
                    <span className="text-xs font-semibold text-white">Pure Veg</span>
                  </div>
                )}
              </div>

              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{caterer.name}</h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-purple-600" />
                    <span>{caterer.city}</span>
                  </div>
                  {caterer._count && caterer._count.reviews > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold">{caterer._count.reviews} reviews</span>
                    </div>
                  )}
                </div>

                <div className="flex items-end justify-between border-t border-gray-200 pt-4">
                  <div>
                    <span className="text-xs text-gray-600">Starting from</span>
                    <p className="text-xl font-bold text-gradient">₹{(caterer.pricePerPlate || 0).toLocaleString('en-IN')}/plate</p>
                  </div>
                  <button className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all">
                    View Menu
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
