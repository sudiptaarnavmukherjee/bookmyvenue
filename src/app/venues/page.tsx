"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Filter, MapPin, Users, Star, CheckCircle2, X, Loader2, AlertCircle, ChevronDown, SlidersHorizontal, TrendingUp, Eye } from "lucide-react";
import { api } from "@/lib/api-client";

type Venue = {
  id: string;
  name: string;
  slug: string;
  location: string;
  city: string;
  area?: string;
  capacity: number;
  maxGuests?: number;
  price: number;
  exactPrice?: number | null;
  estimatedMinPrice?: number | null;
  estimatedMaxPrice?: number | null;
  primeDayPrice?: number | null;
  nonPrimeDayPrice?: number | null;
  isVerified: boolean;
  isAdminListed?: boolean;
  bookingEnabled?: boolean;
  viewCount?: number;
  images: string[] | string;
  _count?: {
    reviews: number;
    bookings: number;
  };
};

type Area = {
  id: string;
  name: string;
  city: string;
  isPopular: boolean;
  priority: number;
  venueCount: number;
};

const VENUE_TYPES = [
  "Banquet Hall", "Lawn/Garden", "Resort", "Hotel",
  "Farmhouse", "Rooftop", "Community Hall", "Palace/Heritage"
];

const AMENITIES = [
  "AC Hall", "Parking", "Catering Allowed",
  "Decoration Included", "DJ/Music System", "Stage Setup",
  "Green Room", "Wi-Fi", "Generator Backup", "Alcohol Permitted",
  "Outdoor Space", "Swimming Pool", "Lift/Elevator"
];

export default function VenuesPage() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"area" | "price-low" | "price-high" | "popular" | "newest">("area");
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [filters, setFilters] = useState({
    cities: [] as string[],
    areas: [] as string[],
    venueTypes: [] as string[],
    amenities: [] as string[],
    minCapacity: 0,
    maxPrice: 500000,
    verifiedOnly: false
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Build query params
        const params = new URLSearchParams();
        params.set("sortBy", sortBy);
        if (selectedArea) params.set("area", selectedArea);
        
        const response = await fetch(`/api/venues?${params.toString()}`);
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
        } else {
          // Transform API data to match component expectations
          const rawVenues = data.venues || [];
          const transformedVenues = rawVenues.map((v: any) => ({
            ...v,
            location: v.area || v.city || '',
            capacity: v.maxGuests || 0,
            price: v.exactPrice || v.primeDayPrice || v.estimatedMinPrice || 0,
            images: typeof v.images === 'string' ? (v.images ? v.images.split(',') : []) : (v.images || []),
          }));
          setVenues(transformedVenues);
          
          // Set areas from API response
          if (data.areas) {
            setAreas(data.areas);
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load venues");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sortBy, selectedArea]);

  // Fetch areas separately for filter options
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await fetch("/api/areas");
        const data = await response.json();
        if (data.success) {
          setAreas(data.areas || []);
        }
      } catch (error) {
        console.error("Failed to fetch areas:", error);
      }
    };
    fetchAreas();
  }, []);

  const popularAreas = areas.filter(a => a.isPopular);
  const availableCities = Array.from(new Set(venues.map(v => v.city))).filter(Boolean).sort();

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

  const toggleVenueType = (type: string) => {
    setFilters(prev => ({
      ...prev,
      venueTypes: prev.venueTypes.includes(type)
        ? prev.venueTypes.filter(t => t !== type)
        : [...prev.venueTypes, type]
    }));
  };

  const toggleAmenity = (amenity: string) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const filteredVenues = venues.filter(venue => {
    // Search query
    if (searchQuery && !venue.name.toLowerCase().includes(searchQuery.toLowerCase()) 
        && !venue.location.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    // City filter
    if (filters.cities.length > 0 && !filters.cities.includes(venue.city)) return false;
    // Area filter (check if venue location contains the area name)
    if (filters.areas.length > 0 && !filters.areas.some(area => 
      (venue.area || venue.location || '').toLowerCase().includes(area.toLowerCase().split('(')[0].trim())
    )) return false;
    // Capacity filter
    if (venue.capacity < filters.minCapacity) return false;
    // Price filter
    if (venue.price > filters.maxPrice) return false;
    // Verified filter
    if (filters.verifiedOnly && !venue.isVerified) return false;
    return true;
  });

  // Sorting is now handled by the API, but we can apply additional client-side sorting if needed
  const sortedVenues = filteredVenues;

  const clearFilters = () => {
    setFilters({
      cities: [],
      areas: [],
      venueTypes: [],
      amenities: [],
      minCapacity: 0,
      maxPrice: 500000,
      verifiedOnly: false
    });
    setSearchQuery("");
    setSortBy("area");
    setSelectedArea("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-24 pt-8">
      <div className="mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gradient mb-2">Wedding Venues</h1>
          <p className="text-gray-600">Find the perfect venue for your dream wedding</p>
        </motion.div>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="glass-card flex flex-1 items-center gap-3 rounded-2xl px-4 py-3">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search venues by name or location..."
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
                <option value="area">📍 Sort: By Area Priority</option>
                <option value="popular">🔥 Sort: Most Popular</option>
                <option value="price-low">💰 Price: Low to High</option>
                <option value="price-high">💰 Price: High to Low</option>
                <option value="newest">🆕 Newest First</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="glass-card flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-semibold hover:bg-white/80 transition-colors"
          >
            <Filter className="h-5 w-5" />
            Filters {(filters.cities.length + filters.areas.length + filters.venueTypes.length + filters.amenities.length > 0) && (
              <span className="ml-1 rounded-full bg-purple-600 text-white text-xs px-2 py-0.5">
                {filters.cities.length + filters.areas.length + filters.venueTypes.length + filters.amenities.length}
              </span>
            )}
          </button>
        </div>

        {/* Popular Areas Quick Filter */}
        {popularAreas.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-gray-700">Popular Areas</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedArea("")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  !selectedArea
                    ? "bg-purple-600 text-white"
                    : "bg-white/60 text-gray-700 hover:bg-white"
                }`}
              >
                All Areas
              </button>
              {popularAreas.map((area) => (
                <button
                  key={area.id}
                  onClick={() => setSelectedArea(selectedArea === area.name ? "" : area.name)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedArea === area.name
                      ? "bg-purple-600 text-white"
                      : "bg-white/60 text-gray-700 hover:bg-white"
                  }`}
                >
                  {area.name}
                  {area.venueCount > 0 && (
                    <span className={`text-xs ${selectedArea === area.name ? "text-purple-200" : "text-gray-500"}`}>
                      ({area.venueCount})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

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
                <Filter className="h-5 w-5" />
                Advanced Filters
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

              {/* Areas Filter - Dynamic from API */}
              <div>
                <label className="mb-3 block font-semibold text-gray-700">
                  Areas <span className="text-xs text-gray-500">({areas.length} locations)</span>
                </label>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                  {areas.length > 0 ? (
                    areas.map(area => (
                      <label
                        key={area.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-purple-50 p-2 rounded-lg transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={filters.areas.includes(area.name)}
                          onChange={() => toggleArea(area.name)}
                          className="rounded text-purple-600"
                        />
                        <span className="text-sm flex items-center gap-2">
                          {area.name}
                          {area.isPopular && (
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          )}
                          {area.venueCount > 0 && (
                            <span className="text-xs text-gray-400">({area.venueCount})</span>
                          )}
                        </span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No areas configured</p>
                  )}
                </div>
              </div>

              {/* Venue Type Filter */}
              <div>
                <label className="mb-3 block font-semibold text-gray-700">Venue Type</label>
                <div className="space-y-1">
                  {VENUE_TYPES.map(type => (
                    <label
                      key={type}
                      className="flex items-center gap-2 cursor-pointer hover:bg-purple-50 p-2 rounded-lg transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={filters.venueTypes.includes(type)}
                        onChange={() => toggleVenueType(type)}
                        className="rounded text-purple-600"
                      />
                      <span className="text-sm">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Amenities Filter */}
              <div>
                <label className="mb-3 block font-semibold text-gray-700">Amenities</label>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                  {AMENITIES.map(amenity => (
                    <label
                      key={amenity}
                      className="flex items-center gap-2 cursor-pointer hover:bg-purple-50 p-2 rounded-lg transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={filters.amenities.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                        className="rounded text-purple-600"
                      />
                      <span className="text-sm">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 space-y-6">
              {/* Capacity Filter */}
              <div>
                <label className="mb-3 block font-semibold text-gray-700">
                  Minimum Capacity: <span className="text-purple-600">{filters.minCapacity} guests</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="50"
                  value={filters.minCapacity}
                  onChange={(e) => setFilters({...filters, minCapacity: parseInt(e.target.value)})}
                  className="w-full accent-purple-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>500</span>
                  <span>1000</span>
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <label className="mb-3 block font-semibold text-gray-700">
                  Max Price: <span className="text-purple-600">₹{filters.maxPrice.toLocaleString('en-IN')}</span>
                </label>
                <input
                  type="range"
                  min="50000"
                  max="500000"
                  step="10000"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({...filters, maxPrice: parseInt(e.target.value)})}
                  className="w-full accent-purple-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>₹50K</span>
                  <span>₹275K</span>
                  <span>₹500K</span>
                </div>
              </div>

              {/* Verified Only */}
              <label className="flex items-center gap-2 cursor-pointer p-3 hover:bg-purple-50 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={filters.verifiedOnly}
                  onChange={(e) => setFilters({...filters, verifiedOnly: e.target.checked})}
                  className="rounded text-purple-600"
                />
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-gray-700">Show Verified Venues Only</span>
              </label>
            </div>

            {/* Active Filters Summary */}
            {(filters.cities.length + filters.areas.length + filters.venueTypes.length + filters.amenities.length > 0 || filters.verifiedOnly) && (
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
                  {filters.venueTypes.map(type => (
                    <span key={type} className="bg-pink-100 text-pink-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                      {type}
                      <button onClick={() => toggleVenueType(type)} className="hover:text-pink-900">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {filters.amenities.map(amenity => (
                    <span key={amenity} className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                      {amenity}
                      <button onClick={() => toggleAmenity(amenity)} className="hover:text-green-900">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {filters.verifiedOnly && (
                    <span className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                      Verified Only
                      <button onClick={() => setFilters({...filters, verifiedOnly: false})} className="hover:text-emerald-900">
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
          <span>Showing {sortedVenues.length} of {venues.length} venues</span>
          {sortBy !== "default" && (
            <span className="text-xs text-purple-600 font-semibold">
              Sorted by: {sortBy === "price-low" ? "Price (Low to High)" : 
                         sortBy === "price-high" ? "Price (High to Low)" :
                         sortBy === "capacity" ? "Capacity" : "Verified First"}
            </span>
          )}
        </p>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
            <p className="text-gray-600">Loading venues...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="glass-card rounded-3xl p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Failed to Load Venues</h3>
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
        {!loading && !error && sortedVenues.length === 0 && (
          <div className="glass-card rounded-3xl p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Venues Found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filters.cities.length > 0 || filters.areas.length > 0 
                ? "Try adjusting your filters or search query"
                : "No venues available at the moment"}
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

        {/* Venues Grid */}
        {!loading && !error && sortedVenues.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortedVenues.map((venue, index) => (
            <motion.div
              key={venue.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => router.push(`/venues/${venue.slug}`)}
              className="glass-card overflow-hidden rounded-3xl hover-lift cursor-pointer"
            >
              <div className="relative h-48">
                <img
                  src={(Array.isArray(venue.images) ? venue.images[0] : venue.images?.split(',')[0]) || "https://images.unsplash.com/photo-1519167758481-83f29da8c456?w=800"}
                  alt={venue.name}
                  className="h-full w-full object-cover"
                />
                {venue.isVerified && (
                  <div className="absolute top-3 right-3 rounded-full bg-white px-3 py-1.5 shadow-lg">
                    <CheckCircle2 className="inline h-4 w-4 text-green-600 mr-1" />
                    <span className="text-xs font-semibold text-green-600">Verified</span>
                  </div>
                )}
              </div>

              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{venue.name}</h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-purple-600" />
                    <span>{venue.city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span>Up to {venue.capacity} guests</span>
                  </div>
                  {venue._count && venue._count.reviews > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold">{venue._count.reviews} reviews</span>
                    </div>
                  )}
                </div>

                <div className="flex items-end justify-between border-t border-gray-200 pt-4">
                  <div>
                    <span className="text-xs text-gray-600">Starting from</span>
                    <p className="text-xl font-bold text-gradient">₹{(venue.price || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <button className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all">
                    Book Now
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
