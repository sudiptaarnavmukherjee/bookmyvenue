"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Search, MapPin, Calendar, Star, 
  Building2, Users, ChefHat, Phone,
  CheckCircle, ArrowRight, Leaf, ChevronRight, Navigation, Locate
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
}

interface Stats {
  totalVenues: number;
  totalCaterers: number;
  completedBookings: number;
}

// Skeleton loader component
function CardSkeleton() {
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

// Venue Card Component - Optimized
function VenueCard({ venue }: { venue: Venue }) {
  const fallbackImage = "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=75";
  
  return (
    <Link 
      href={`/venues/${venue.slug || venue.id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100"
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
          {venue.isAdminListed && !venue.bookingEnabled && (
            <span className="bg-amber-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
              Call to Book
            </span>
          )}
        </div>

        {/* View Count */}
        {venue.viewCount && venue.viewCount > 10 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            {venue.viewCount} views
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-lg truncate group-hover:text-purple-600 transition-colors">
          {venue.name}
        </h3>
        
        <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
          <MapPin className="w-4 h-4" />
          <span>{venue.location}</span>
          {venue.capacity && (
            <>
              <span className="mx-1">•</span>
              <Users className="w-4 h-4" />
              <span>{venue.capacity} guests</span>
            </>
          )}
        </div>

        {/* Price */}
        <div className="mt-3 flex items-center justify-between">
          <div>
            {venue.priceRange ? (
              <p className="text-purple-600 font-bold">{venue.priceRange}</p>
            ) : (
              <p className="text-purple-600 font-bold">
                ₹{(venue.price / 1000).toFixed(0)}K
                <span className="text-gray-400 font-normal text-sm"> /event</span>
              </p>
            )}
          </div>
          
          {venue.bookingEnabled ? (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
              Book Online
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

// Caterer Card Component - Zomato Style
function CatererCard({ caterer }: { caterer: Caterer }) {
  const fallbackImage = "https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=75";
  
  return (
    <Link 
      href={`/catering/${caterer.slug || caterer.id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={caterer.image || fallbackImage}
          alt={caterer.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {caterer.isPureVeg && (
            <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
              <Leaf className="w-3 h-3" />
              Pure Veg
            </span>
          )}
          {caterer.isVerified && (
            <span className="bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Verified
            </span>
          )}
        </div>

        {/* Rating */}
        {caterer.rating && caterer.rating > 0 && (
          <div className="absolute bottom-3 right-3 bg-green-600 text-white text-sm px-2 py-1 rounded-lg flex items-center gap-1 font-bold">
            {caterer.rating.toFixed(1)}
            <Star className="w-3 h-3 fill-current" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-lg truncate group-hover:text-orange-600 transition-colors">
          {caterer.name}
        </h3>
        
        <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
          <MapPin className="w-4 h-4" />
          <span>{caterer.location}</span>
        </div>

        {caterer.cuisines && (
          <p className="text-gray-400 text-sm mt-1 truncate">
            {caterer.cuisines}
          </p>
        )}

        {/* Price */}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-orange-600 font-bold">
            ₹{caterer.price}
            <span className="text-gray-400 font-normal text-sm"> /plate</span>
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

// Main Homepage Component
export default function HomePage() {
  useOwnerRedirect();
  const router = useRouter();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"venues" | "catering">("venues");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [caterers, setCaterers] = useState<Caterer[]>([]);
  const [stats, setStats] = useState<Stats>({ totalVenues: 500, totalCaterers: 200, completedBookings: 10000 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Nearby venues using Ola Maps
  const { data: nearbyVenues, loading: nearbyLoading, userLocation } = useNearby("venues", 4);

  // Fetch data on mount - SINGLE API CALL
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/featured?venueLimit=6&catererLimit=4');
        
        if (!res.ok) throw new Error('Failed to fetch');
        
        const data = await res.json();
        setVenues(data.venues || []);
        setCaterers(data.caterers || []);
        if (data.stats) setStats(data.stats);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Search handler
  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    const path = activeTab === "venues" ? "/venues" : "/catering";
    router.push(`${path}?${params.toString()}`);
  }, [searchQuery, activeTab, router]);

  // Handle enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Popular areas for quick search
  const popularAreas = ["Kolkata", "Salt Lake", "New Town", "Rajarhat", "Barasat", "Howrah"];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Clean & Fast */}
      <section className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 pt-8 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3">
              Find Your Perfect Wedding Venue
            </h1>
            <p className="text-purple-100 text-lg max-w-xl mx-auto">
              Compare prices, book venues & caterers with transparent pricing
            </p>
          </div>

          {/* Search Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-6 max-w-4xl mx-auto">
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab("venues")}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === "venues"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Building2 className="w-5 h-5" />
                Venues
              </button>
              <button
                onClick={() => setActiveTab("catering")}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === "catering"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <ChefHat className="w-5 h-5" />
                Catering
              </button>
            </div>

            {/* Search Bar */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by area, city or venue name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
                />
              </div>
              <button
                onClick={handleSearch}
                className={`px-8 py-4 font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 ${
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
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">Popular:</span>
              {popularAreas.map((area) => (
                <button
                  key={area}
                  onClick={() => {
                    setSearchQuery(area);
                    handleSearch();
                  }}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium hover:bg-purple-50 px-3 py-1 rounded-full transition-colors"
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 md:gap-16 mt-10">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white">{stats.totalVenues}+</div>
              <div className="text-purple-200 text-sm">Venues</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white">{stats.totalCaterers}+</div>
              <div className="text-purple-200 text-sm">Caterers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white">{Math.round(stats.completedBookings/1000)}K+</div>
              <div className="text-purple-200 text-sm">Happy Couples</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Venues Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Featured Venues</h2>
              <p className="text-gray-500 mt-1">Handpicked venues with transparent pricing</p>
            </div>
            <Link 
              href="/venues"
              className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
            >
              View All <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : venues.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No venues available yet</p>
              <p className="text-gray-400 text-sm">Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Caterers Section */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Top Caterers</h2>
              <p className="text-gray-500 mt-1">Premium catering with per-plate pricing</p>
            </div>
            <Link 
              href="/catering"
              className="text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
            >
              View All <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : caterers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {caterers.map((caterer) => (
                <CatererCard key={caterer.id} caterer={caterer} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-2xl">
              <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No caterers available yet</p>
              <p className="text-gray-400 text-sm">Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Nearby Venues Section - Powered by Ola Maps */}
      {nearbyVenues.length > 0 && (
        <section className="py-12 px-4 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <Locate className="w-7 h-7 text-blue-600" />
                  Venues Near You
                </h2>
                <p className="text-gray-500 mt-1">
                  {userLocation ? "Based on your location" : "Popular venues in Kolkata"}
                </p>
              </div>
              <Link 
                href="/venues?sort=nearby"
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                View All Nearby <ChevronRight className="w-5 h-5" />
              </Link>
            </div>

            {nearbyLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {nearbyVenues.slice(0, 4).map((venue: any) => (
                  <Link 
                    key={venue.id}
                    href={`/venues/${venue.slug || venue.id}`}
                    className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100"
                  >
                    <div className="relative h-40 overflow-hidden bg-gray-100">
                      <img
                        src={venue.coverImage || venue.images?.split(",")[0] || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=75"}
                        alt={venue.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      {venue.distance && (
                        <div className="absolute bottom-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Navigation className="w-3 h-3" />
                          {venue.distance < 1 
                            ? `${(venue.distance * 1000).toFixed(0)}m` 
                            : `${venue.distance.toFixed(1)}km`}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {venue.name}
                      </h3>
                      <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                        <MapPin className="w-4 h-4" />
                        <span>{venue.area || venue.city}</span>
                      </div>
                      <div className="mt-2 text-purple-600 font-bold">
                        {venue.primeDayPrice ? `₹${(venue.primeDayPrice/1000).toFixed(0)}K` : 
                         venue.estimatedMinPrice ? `₹${(venue.estimatedMinPrice/1000).toFixed(0)}K - ${(venue.estimatedMaxPrice/1000).toFixed(0)}K` : 
                         "Call for price"}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* How It Works Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">
            How BookMyVenue Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                step: "1", 
                title: "Browse & Compare", 
                desc: "Search venues and caterers with transparent pricing. Compare options side by side.",
                icon: Search
              },
              { 
                step: "2", 
                title: "Contact or Book", 
                desc: "Call directly for unverified listings, or book online instantly for verified ones.",
                icon: Phone
              },
              { 
                step: "3", 
                title: "Celebrate!", 
                desc: "Enjoy your event with confidence. Best prices guaranteed.",
                icon: "🎉"
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {typeof item.icon === 'string' ? (
                    <span className="text-3xl">{item.icon}</span>
                  ) : (
                    <item.icon className="w-8 h-8 text-purple-600" />
                  )}
                </div>
                <div className="text-purple-600 font-bold text-sm mb-2">Step {item.step}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-purple-600 to-indigo-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Find Your Perfect Venue?
          </h2>
          <p className="text-purple-100 mb-8 max-w-xl mx-auto">
            Join thousands of happy couples who found their dream wedding venue through BookMyVenue
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/venues"
              className="bg-white text-purple-600 font-bold px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <Building2 className="w-5 h-5" />
              Browse Venues
            </Link>
            <Link
              href="/catering"
              className="bg-purple-500 text-white font-bold px-8 py-4 rounded-xl hover:bg-purple-400 transition-colors flex items-center justify-center gap-2 border border-purple-400"
            >
              <ChefHat className="w-5 h-5" />
              Browse Catering
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-white font-bold text-xl mb-4">BookMyVenue</h3>
              <p className="text-sm">India's leading platform for wedding venues and catering services with transparent pricing.</p>
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
              <h4 className="text-white font-semibold mb-4">Popular Cities</h4>
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
                <li><a href="mailto:support@bookmyvenue.in" className="hover:text-white transition-colors">support@bookmyvenue.in</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>© 2024 BookMyVenue. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Bottom padding for mobile nav */}
      <div className="h-20 md:hidden" />
    </div>
  );
}
