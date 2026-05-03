"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Filter, MapPin, X, Loader2, AlertCircle, Navigation } from "lucide-react";
import { VenueCard } from "@/components/venue/VenueCard";
import { useLocation } from "@/hooks/useLocation";

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
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    if (locationLoading) return; // Wait for location to resolve before first fetch
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

  // Fetch areas for filter
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await fetch("/api/areas", {
          next: { revalidate: 300 }, // Cache areas for 5 minutes
        });
        const data = await response.json();
        if (data.success) setAreas(data.areas || []);
      } catch (error) {
        console.error("Failed to fetch areas:", error);
      }
    };
    fetchAreas();
  }, []);

  const popularAreas = areas.filter(a => a.isPopular);

  // Client-side filtering
  const filteredVenues = useMemo(() => {
    return venues.filter(venue => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!venue.name.toLowerCase().includes(query) && 
            !venue.city.toLowerCase().includes(query) &&
            !(venue.area || "").toLowerCase().includes(query)) {
          return false;
        }
      }
      if (verifiedOnly && !venue.isVerified) return false;
      return true;
    });
  }, [venues, searchQuery, verifiedOnly]);

  const clearFilters = () => {
    setSearchQuery("");
    setSortBy("area");
    setSelectedArea("");
    setVerifiedOnly(false);
  };

  const getVenueImage = (venue: Venue) => {
    if (venue.coverImage) return venue.coverImage;
    if (venue.images) {
      const imgs = venue.images.split(",");
      return imgs[0] || "https://images.unsplash.com/photo-1519167758481-83f29da8c456?w=800";
    }
    return "https://images.unsplash.com/photo-1519167758481-83f29da8c456?w=800";
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Wedding Venues</h1>
              <p className="text-sm text-gray-600">Find the perfect venue for your special day</p>
            </div>
            <span className="text-sm text-gray-500 hidden sm:block">
              {filteredVenues.length} venues
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
              <option value="area">📍 By Area</option>
              <option value="nearby">🧭 Nearest First</option>
              <option value="popular">🔥 Popular</option>
              <option value="price-low">💰 Low to High</option>
              <option value="price-high">💰 High to Low</option>
              <option value="newest">🆕 Newest</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                showFilters || verifiedOnly ? "bg-rose-100 text-rose-700" : "bg-gray-100 text-gray-700"
              }`}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Location Status Banner */}
        {isPermissionDenied && (
          <div className="mb-4 flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            <Navigation className="h-4 w-4 flex-shrink-0" />
            <span>Location access denied — distances shown from Kolkata centre. <button onClick={() => window.location.reload()} className="underline font-medium">Allow location</button> for accurate results.</span>
          </div>
        )}

        {/* Quick Area Filter Pills */}
        {popularAreas.length > 0 && (
          <div className="mb-6 overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => setSelectedArea("")}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  !selectedArea
                    ? "bg-rose-500 text-white"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-rose-300"
                }`}
              >
                All Areas
              </button>
              {popularAreas.map((area) => (
                <button
                  key={area.id}
                  onClick={() => setSelectedArea(selectedArea === area.name ? "" : area.name)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedArea === area.name
                      ? "bg-rose-500 text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-rose-300"
                  }`}
                >
                  {area.name}
                  {area.venueCount > 0 && (
                    <span className={`ml-1 ${selectedArea === area.name ? "text-rose-200" : "text-gray-400"}`}>
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
          <div className="bg-white rounded-2xl p-4 mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              <button onClick={clearFilters} className="text-sm text-rose-600 font-medium">
                Clear All
              </button>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="rounded text-rose-500 focus:ring-rose-500"
                />
                <span className="text-sm text-gray-700">Verified venues only</span>
              </label>
              
              {/* Mobile sort */}
              <div className="sm:hidden w-full">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm font-medium outline-none"
                >
                  <option value="area">📍 Sort by Area</option>
                  <option value="nearby">🧭 Nearest First</option>
                  <option value="popular">🔥 Most Popular</option>
                  <option value="price-low">💰 Price: Low to High</option>
                  <option value="price-high">💰 Price: High to Low</option>
                  <option value="newest">🆕 Newest First</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-rose-500 mb-4" />
            <p className="text-gray-500">Loading venues...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">Failed to Load Venues</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredVenues.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">No Venues Found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedArea ? "Try adjusting your filters" : "No venues available yet"}
            </p>
            {(searchQuery || selectedArea || verifiedOnly) && (
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Venues Grid */}
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
