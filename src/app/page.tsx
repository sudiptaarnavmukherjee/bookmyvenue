"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { 
  Search, MapPin, Star, Building2, Users, ChefHat, Phone,
  CheckCircle, ArrowRight, Leaf, ChevronRight, Navigation, 
  Locate, Filter, SlidersHorizontal, Heart, Clock, TrendingUp
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useOwnerRedirect } from "@/hooks/useOwnerRedirect";
import { useNearby } from "@/hooks/useLocation";
import Image from "next/image";

// Types
interface Venue {
  id: string;
  name: string;
  slug?: string;
  location: string;
  city?: string;
  area?: string;
  price: number;
  priceRange?: string;
  image: string | null;
  capacity?: number;
  isVerified?: boolean;
  isAdminListed?: boolean;
  bookingEnabled?: boolean;
  viewCount?: number;
  reviewCount?: number;
  distanceText?: string;
  distanceMeters?: number;
}

interface Caterer {
  id: string;
  name: string;
  slug?: string;
  location: string;
  city?: string;
  price: number;
  image: string | null;
  isPureVeg?: boolean;
  cuisines?: string;
  rating?: number;
  isVerified?: boolean;
  isAdminListed?: boolean;
  bookingEnabled?: boolean;
  reviewCount?: number;
  distanceText?: string;
  distanceMeters?: number;
}

interface Stats {
  totalVenues: number;
  totalCaterers: number;
  completedBookings: number;
}

// Skeleton Loaders
function VenueCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-6 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );
}

function CatererCardSkeleton() {
  return (
    <div className="flex gap-4 p-4 bg-white rounded-xl border animate-pulse">
      <div className="w-28 h-28 bg-gray-200 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );
}

// Logo Component - Happily Eated
function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`font-bold ${className}`}>
      <span>Happily </span>
      <span className="relative">
        <span className="line-through text-gray-400 decoration-red-500 decoration-2">Married</span>
      </span>
      <span className="text-purple-600"> Eated</span>
    </div>
  );
}

// MakeMyTrip Style Venue Card (Vertical - for grid)
function MMTVenueCard({ venue }: { venue: Venue }) {
  const fallbackImage = "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=75";
  
  return (
    <Link 
      href={`/venues/${venue.slug || venue.id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={venue.image || fallbackImage}
          alt={venue.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {venue.isVerified && (
            <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Verified
            </span>
          )}
        </div>

        {/* Distance Badge */}
        {venue.distanceText && (
          <div className="absolute bottom-3 right-3 bg-blue-600/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
            <Navigation className="w-3 h-3" />
            {venue.distanceText}
          </div>
        )}

        {/* Booking Type Badge */}
        <div className="absolute top-3 right-3">
          {venue.bookingEnabled ? (
            <span className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
              Book Online
            </span>
          ) : (
            <span className="bg-amber-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
              Call to Book
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-lg truncate group-hover:text-purple-600 transition-colors">
          {venue.name}
        </h3>
        
        <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
          <MapPin className="w-4 h-4" />
          <span>{venue.location}</span>
        </div>

        {/* Capacity */}
        {venue.capacity && (
          <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
            <Users className="w-4 h-4" />
            <span>Up to {venue.capacity} guests</span>
          </div>
        )}

        {/* Price & Actions */}
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-purple-600 font-bold text-lg">
              {venue.priceRange || `₹${(venue.price/1000).toFixed(0)}K`}
            </p>
            <p className="text-gray-400 text-xs">per function</p>
          </div>
          
          <button className="p-2 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors">
            <Heart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </Link>
  );
}

// Horizontal Venue Card (for nearby/best sections)
function HorizontalVenueCard({ venue }: { venue: Venue }) {
  const fallbackImage = "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=75";
  
  return (
    <Link 
      href={`/venues/${venue.slug || venue.id}`}
      className="flex-shrink-0 w-72 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all group border border-gray-100"
    >
      <div className="relative h-36 overflow-hidden">
        <img
          src={venue.image || fallbackImage}
          alt={venue.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          loading="lazy"
        />
        {venue.distanceText && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Navigation className="w-3 h-3" />
            {venue.distanceText}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 truncate">{venue.name}</h3>
        <p className="text-gray-500 text-sm truncate">{venue.location}</p>
        <p className="text-purple-600 font-bold mt-1">
          {venue.priceRange || `₹${(venue.price/1000).toFixed(0)}K`}
        </p>
      </div>
    </Link>
  );
}

// Zomato Style Caterer Card (List style)
function ZomatoCatererCard({ caterer }: { caterer: Caterer }) {
  const fallbackImage = "https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=75";
  
  return (
    <Link 
      href={`/catering/${caterer.slug || caterer.id}`}
      className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-all group"
    >
      {/* Image */}
      <div className="relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
        <img
          src={caterer.image || fallbackImage}
          alt={caterer.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          loading="lazy"
        />
        {caterer.isPureVeg && (
          <div className="absolute top-1 left-1 bg-green-500 p-1 rounded">
            <Leaf className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
            {caterer.name}
          </h3>
          {caterer.rating && caterer.rating > 0 && (
            <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded text-sm flex-shrink-0">
              <Star className="w-3 h-3 fill-current" />
              <span>{caterer.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <p className="text-gray-500 text-sm truncate mt-1">
          {caterer.cuisines || "Multi-cuisine"}
        </p>

        <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{caterer.location}</span>
          {caterer.distanceText && (
            <>
              <span>•</span>
              <span>{caterer.distanceText}</span>
            </>
          )}
        </div>

        {/* Price & Status */}
        <div className="flex items-center justify-between mt-2">
          <p className="text-orange-600 font-bold">
            ₹{caterer.price}
            <span className="text-gray-400 font-normal text-sm">/plate</span>
          </p>
          {caterer.bookingEnabled ? (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
              Order Online
            </span>
          ) : (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium flex items-center gap-1">
              <Phone className="w-3 h-3" />
              Call
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// Horizontal Caterer Card (for featured section)
function HorizontalCatererCard({ caterer }: { caterer: Caterer }) {
  const fallbackImage = "https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=75";
  
  return (
    <Link 
      href={`/catering/${caterer.slug || caterer.id}`}
      className="flex-shrink-0 w-52 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all group border border-gray-100"
    >
      <div className="relative h-32 overflow-hidden">
        <img
          src={caterer.image || fallbackImage}
          alt={caterer.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          loading="lazy"
        />
        {caterer.isPureVeg && (
          <div className="absolute top-2 left-2 bg-green-500 p-1 rounded">
            <Leaf className="w-3 h-3 text-white" />
          </div>
        )}
        {caterer.rating && caterer.rating > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-green-600 text-white px-1.5 py-0.5 rounded text-xs">
            <Star className="w-3 h-3 fill-current" />
            {caterer.rating.toFixed(1)}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 truncate text-sm">{caterer.name}</h3>
        <p className="text-gray-400 text-xs truncate">{caterer.cuisines || "Multi-cuisine"}</p>
        <p className="text-orange-600 font-bold text-sm mt-1">₹{caterer.price}/plate</p>
      </div>
    </Link>
  );
}

// Main Home Content Component
function HomeContent() {
  useOwnerRedirect();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const initialTab = searchParams.get("mode") === "catering" ? "catering" : "venues";
  const [activeTab, setActiveTab] = useState<"venues" | "catering">(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [caterers, setCaterers] = useState<Caterer[]>([]);
  const [stats, setStats] = useState<Stats>({ totalVenues: 500, totalCaterers: 200, completedBookings: 10000 });
  const [loading, setLoading] = useState(true);
  const [distanceFilter, setDistanceFilter] = useState<number>(10); // km
  
  // Nearby data using Ola Maps
  const { data: nearbyVenues, loading: nearbyVenuesLoading, userLocation } = useNearby("venues", 8);
  const { data: nearbyCaterers, loading: nearbyCaterersLoading } = useNearby("caterers", 8);

  // Fetch featured data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/featured?venueLimit=8&catererLimit=8');
        
        if (!res.ok) throw new Error('Failed to fetch');
        
        const data = await res.json();
        setVenues(data.venues || []);
        setCaterers(data.caterers || []);
        if (data.stats) setStats(data.stats);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Handle tab change - update URL
  const handleTabChange = (tab: "venues" | "catering") => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("mode", tab);
    window.history.replaceState({}, "", url.toString());
  };

  // Search handler
  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    const path = activeTab === "venues" ? "/venues" : "/catering";
    router.push(`${path}?${params.toString()}`);
  }, [searchQuery, activeTab, router]);

  // Filter nearby by distance
  const filteredNearbyVenues = nearbyVenues.filter((v: any) => 
    v.distanceMeters <= distanceFilter * 1000
  );
  const filteredNearbyCaterers = nearbyCaterers.filter((c: any) => 
    c.distanceMeters <= distanceFilter * 1000
  );

  // Popular areas
  const popularAreas = ["Salt Lake", "New Town", "Rajarhat", "Barasat", "Howrah", "Ballygunge"];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Logo className="text-xl" />
            
            <div className="flex items-center gap-2">
              <Link href="/wishlist" className="p-2 hover:bg-gray-100 rounded-full">
                <Heart className="w-5 h-5 text-gray-600" />
              </Link>
              <Link 
                href="/auth/signin" 
                className="text-sm font-medium text-purple-600 hover:text-purple-700 px-4 py-2 hover:bg-purple-50 rounded-lg"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={`pt-6 pb-8 px-4 ${
        activeTab === "venues" 
          ? "bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800" 
          : "bg-gradient-to-br from-orange-500 via-red-500 to-red-600"
      }`}>
        <div className="max-w-4xl mx-auto">
          {/* Tab Toggle - Prominent */}
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 backdrop-blur-sm p-1 rounded-full flex">
              <button
                onClick={() => handleTabChange("venues")}
                className={`px-6 py-2.5 rounded-full font-semibold transition-all flex items-center gap-2 ${
                  activeTab === "venues"
                    ? "bg-white text-purple-600 shadow-lg"
                    : "text-white/90 hover:text-white"
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span>Venues</span>
              </button>
              <button
                onClick={() => handleTabChange("catering")}
                className={`px-6 py-2.5 rounded-full font-semibold transition-all flex items-center gap-2 ${
                  activeTab === "catering"
                    ? "bg-white text-orange-600 shadow-lg"
                    : "text-white/90 hover:text-white"
                }`}
              >
                <ChefHat className="w-5 h-5" />
                <span>Catering</span>
              </button>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-2xl md:text-4xl font-bold text-white text-center mb-2">
            {activeTab === "venues" 
              ? "Find Your Perfect Wedding Venue" 
              : "Order Catering for Your Event"}
          </h1>
          <p className="text-white/80 text-center mb-6">
            {activeTab === "venues"
              ? "Compare prices, book venues with transparent pricing"
              : "Premium catering services at best prices"}
          </p>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-2xl p-3 md:p-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={activeTab === "venues" 
                    ? "Search venues by area, city or name..." 
                    : "Search caterers by cuisine, area..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearch}
                className={`px-6 py-3.5 font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 ${
                  activeTab === "venues"
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-orange-500 hover:bg-orange-600 text-white"
                }`}
              >
                <Search className="w-5 h-5" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">Popular:</span>
              {popularAreas.map((area) => (
                <button
                  key={area}
                  onClick={() => {
                    setSearchQuery(area);
                    handleSearch();
                  }}
                  className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${
                    activeTab === "venues"
                      ? "text-purple-600 hover:bg-purple-50"
                      : "text-orange-600 hover:bg-orange-50"
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 md:gap-16 mt-8">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white">
                {activeTab === "venues" ? `${stats.totalVenues}+` : `${stats.totalCaterers}+`}
              </div>
              <div className="text-white/70 text-sm">
                {activeTab === "venues" ? "Venues" : "Caterers"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white">{Math.round(stats.completedBookings/1000)}K+</div>
              <div className="text-white/70 text-sm">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white">100%</div>
              <div className="text-white/70 text-sm">Transparent Pricing</div>
            </div>
          </div>
        </div>
      </section>

      {/* Distance Filter */}
      <div className="bg-white border-b sticky top-14 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4 overflow-x-auto">
            <span className="text-sm text-gray-500 flex-shrink-0 flex items-center gap-1">
              <SlidersHorizontal className="w-4 h-4" />
              Distance:
            </span>
            {[5, 10, 20, 50].map((km) => (
              <button
                key={km}
                onClick={() => setDistanceFilter(km)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
                  distanceFilter === km
                    ? activeTab === "venues"
                      ? "bg-purple-600 text-white"
                      : "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {km} km
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === "venues" ? (
        // VENUE MODE - MakeMyTrip Style
        <>
          {/* Nearby Venues Section - Horizontal Scroll */}
          {filteredNearbyVenues.length > 0 && (
            <section className="py-6 px-4">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Locate className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-bold text-gray-900">Venues Near You</h2>
                    <span className="text-sm text-gray-500">({filteredNearbyVenues.length})</span>
                  </div>
                  <Link href="/venues?sort=nearby" className="text-purple-600 font-medium text-sm flex items-center gap-1">
                    View All <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {nearbyVenuesLoading ? (
                    [...Array(4)].map((_, i) => <VenueCardSkeleton key={i} />)
                  ) : (
                    filteredNearbyVenues.map((venue: any) => (
                      <HorizontalVenueCard key={venue.id} venue={venue} />
                    ))
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Featured Venues - Grid */}
          <section className="py-8 px-4 bg-white">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                    Featured Venues
                  </h2>
                  <p className="text-gray-500 mt-1">Handpicked venues with transparent pricing</p>
                </div>
                <Link href="/venues" className="text-purple-600 font-semibold flex items-center gap-1">
                  View All <ChevronRight className="w-5 h-5" />
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => <VenueCardSkeleton key={i} />)}
                </div>
              ) : venues.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {venues.map((venue) => (
                    <MMTVenueCard key={venue.id} venue={venue} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-2xl">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No venues available yet</p>
                </div>
              )}
            </div>
          </section>

          {/* Best Venues in Town - Horizontal */}
          <section className="py-8 px-4 bg-purple-50">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  Best Venues in Town
                </h2>
                <Link href="/venues?sort=popular" className="text-purple-600 font-medium text-sm flex items-center gap-1">
                  See All <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {venues.slice(0, 6).map((venue) => (
                  <HorizontalVenueCard key={venue.id} venue={venue} />
                ))}
              </div>
            </div>
          </section>
        </>
      ) : (
        // CATERING MODE - Zomato Style
        <>
          {/* Nearby Caterers - Horizontal Cards */}
          {filteredNearbyCaterers.length > 0 && (
            <section className="py-6 px-4">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Locate className="w-6 h-6 text-orange-600" />
                    <h2 className="text-xl font-bold text-gray-900">Caterers Near You</h2>
                    <span className="text-sm text-gray-500">({filteredNearbyCaterers.length})</span>
                  </div>
                  <Link href="/catering?sort=nearby" className="text-orange-600 font-medium text-sm flex items-center gap-1">
                    View All <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {nearbyCaterersLoading ? (
                    [...Array(4)].map((_, i) => <CatererCardSkeleton key={i} />)
                  ) : (
                    filteredNearbyCaterers.map((caterer: any) => (
                      <HorizontalCatererCard key={caterer.id} caterer={caterer} />
                    ))
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Top Rated Caterers - Horizontal Scroll */}
          <section className="py-6 px-4 bg-orange-50">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  Top Rated Caterers
                </h2>
                <Link href="/catering?sort=rating" className="text-orange-600 font-medium text-sm flex items-center gap-1">
                  See All <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {loading ? (
                  [...Array(4)].map((_, i) => <CatererCardSkeleton key={i} />)
                ) : (
                  caterers.slice(0, 6).map((caterer) => (
                    <HorizontalCatererCard key={caterer.id} caterer={caterer} />
                  ))
                )}
              </div>
            </div>
          </section>

          {/* All Caterers - Zomato List Style */}
          <section className="py-8 px-4 bg-white">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">All Caterers</h2>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50">
                    <Filter className="w-4 h-4" />
                    Filter
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {loading ? (
                  [...Array(5)].map((_, i) => <CatererCardSkeleton key={i} />)
                ) : caterers.length > 0 ? (
                  caterers.map((caterer) => (
                    <ZomatoCatererCard key={caterer.id} caterer={caterer} />
                  ))
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl">
                    <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No caterers available yet</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {/* How It Works */}
      <section className="py-12 px-4 bg-gray-100">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                step: "1", 
                title: "Browse & Compare", 
                desc: "Search venues and caterers with transparent pricing",
                color: activeTab === "venues" ? "purple" : "orange"
              },
              { 
                step: "2", 
                title: "Contact or Book", 
                desc: "Call directly or book online instantly",
                color: activeTab === "venues" ? "purple" : "orange"
              },
              { 
                step: "3", 
                title: "Celebrate!", 
                desc: "Enjoy your event with confidence",
                color: activeTab === "venues" ? "purple" : "orange"
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className={`w-14 h-14 ${
                  item.color === "purple" ? "bg-purple-100" : "bg-orange-100"
                } rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <span className={`text-2xl font-bold ${
                    item.color === "purple" ? "text-purple-600" : "text-orange-600"
                  }`}>{item.step}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`py-12 px-4 ${
        activeTab === "venues"
          ? "bg-gradient-to-r from-purple-600 to-indigo-700"
          : "bg-gradient-to-r from-orange-500 to-red-600"
      }`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {activeTab === "venues"
              ? "Ready to Find Your Perfect Venue?"
              : "Need Catering for Your Event?"}
          </h2>
          <p className="text-white/80 mb-6">
            {activeTab === "venues"
              ? "Join thousands of happy couples who found their dream wedding venue"
              : "Order premium catering with transparent per-plate pricing"}
          </p>
          <Link
            href={activeTab === "venues" ? "/venues" : "/catering"}
            className="inline-flex items-center gap-2 bg-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
            style={{ color: activeTab === "venues" ? "#7c3aed" : "#ea580c" }}
          >
            {activeTab === "venues" ? (
              <>
                <Building2 className="w-5 h-5" />
                Browse All Venues
              </>
            ) : (
              <>
                <ChefHat className="w-5 h-5" />
                Browse All Caterers
              </>
            )}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <Logo className="text-lg mb-4" />
              <p className="text-sm">Your one-stop platform for wedding venues and catering services with transparent pricing.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/venues" className="hover:text-white transition-colors">Venues</Link></li>
                <li><Link href="/catering" className="hover:text-white transition-colors">Catering</Link></li>
                <li><Link href="/bookings" className="hover:text-white transition-colors">My Bookings</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Popular Areas</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/venues?search=kolkata" className="hover:text-white transition-colors">Kolkata</Link></li>
                <li><Link href="/venues?search=salt-lake" className="hover:text-white transition-colors">Salt Lake</Link></li>
                <li><Link href="/venues?search=new-town" className="hover:text-white transition-colors">New Town</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="tel:+919876543210" className="hover:text-white transition-colors">+91 98765 43210</a></li>
                <li><a href="mailto:support@happilyeated.com" className="hover:text-white transition-colors">support@happilyeated.com</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>© 2024 Happily Eated. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Mobile bottom spacing */}
      <div className="h-20 md:hidden" />
    </div>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

// Export with Suspense wrapper
export default function HomePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HomeContent />
    </Suspense>
  );
}
