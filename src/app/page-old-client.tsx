"use client";

import { useState, useEffect, useCallback, Suspense, memo } from "react";
import { 
  Search, MapPin, Star, Building2, Users, ChefHat, Phone,
  CheckCircle, ArrowRight, Leaf, ChevronRight, Navigation, 
  ChevronDown, Heart, TrendingUp, Sparkles, Calendar
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useOwnerRedirect } from "@/hooks/useOwnerRedirect";
import { useNearby } from "@/hooks/useLocation";
import Logo from "@/components/layout/Logo";
import SearchModal from "@/components/home/SearchModal";

// ============================================
// Types
// ============================================
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
  bookingEnabled?: boolean;
  distanceText?: string;
  distanceMeters?: number;
  rating?: number;
}

interface Caterer {
  id: string;
  name: string;
  slug?: string;
  location: string;
  price: number;
  image: string | null;
  isPureVeg?: boolean;
  cuisines?: string;
  rating?: number;
  isVerified?: boolean;
  bookingEnabled?: boolean;
  distanceText?: string;
  distanceMeters?: number;
}

interface Stats {
  totalVenues: number;
  totalCaterers: number;
  completedBookings: number;
}

// ============================================
// Skeleton Loaders (Lightweight)
// ============================================
const VenueCardSkeleton = memo(() => (
  <div className="bg-white rounded-xl overflow-hidden border border-gray-100">
    <div className="h-40 bg-gray-100" />
    <div className="p-3 space-y-2">
      <div className="h-4 bg-gray-100 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
      <div className="h-5 bg-gray-100 rounded w-1/3" />
    </div>
  </div>
));
VenueCardSkeleton.displayName = 'VenueCardSkeleton';

const CatererCardSkeleton = memo(() => (
  <div className="flex gap-3 p-3 bg-white rounded-xl border border-gray-100">
    <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0" />
    <div className="flex-1 space-y-2 py-1">
      <div className="h-4 bg-gray-100 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
      <div className="h-3 bg-gray-100 rounded w-2/3" />
      <div className="h-4 bg-gray-100 rounded w-1/4" />
    </div>
  </div>
));
CatererCardSkeleton.displayName = 'CatererCardSkeleton';

// ============================================
// MMT Style Venue Card (Vertical - Clean & Professional)
// ============================================
const VenueCard = memo(({ venue }: { venue: Venue }) => {
  const fallbackImage = "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&q=70";
  
  return (
    <Link 
      href={`/venues/${venue.slug || venue.id}`}
      className="block bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <div className="relative h-40 bg-gray-100">
        <img
          src={venue.image || fallbackImage}
          alt={venue.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Top Left - Verified */}
        {venue.isVerified && (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <CheckCircle className="w-2.5 h-2.5" />
            Verified
          </span>
        )}

        {/* Top Right - Booking Type */}
        <span className={`absolute top-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
          venue.bookingEnabled 
            ? "bg-purple-600 text-white" 
            : "bg-amber-500 text-white"
        }`}>
          {venue.bookingEnabled ? "Book Online" : "Call to Book"}
        </span>

        {/* Bottom Right - Distance */}
        {venue.distanceText && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <Navigation className="w-2.5 h-2.5" />
            {venue.distanceText}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm truncate">
          {venue.name}
        </h3>
        
        <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{venue.location}</span>
        </div>

        {venue.capacity && (
          <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
            <Users className="w-3 h-3" />
            <span>Up to {venue.capacity} guests</span>
          </div>
        )}

        {/* Price */}
        <div className="mt-2 flex items-center justify-between">
          <div>
            <span className="text-purple-600 font-bold text-base">
              {venue.priceRange || `₹${(venue.price/1000).toFixed(0)}K`}
            </span>
            <span className="text-gray-400 text-[10px] ml-1">per function</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </Link>
  );
});
VenueCard.displayName = 'VenueCard';

// ============================================
// Horizontal Venue Card (Best in Town / Featured)
// ============================================
const HorizontalVenueCard = memo(({ venue }: { venue: Venue }) => {
  const fallbackImage = "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=300&q=70";
  
  return (
    <Link 
      href={`/venues/${venue.slug || venue.id}`}
      className="flex-shrink-0 w-64 bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div className="relative h-32 bg-gray-100">
        <img
          src={venue.image || fallbackImage}
          alt={venue.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {venue.distanceText && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <Navigation className="w-2.5 h-2.5" />
            {venue.distanceText}
          </div>
        )}
      </div>
      <div className="p-2.5">
        <h3 className="font-semibold text-gray-900 text-sm truncate">{venue.name}</h3>
        <p className="text-gray-500 text-xs truncate">{venue.location}</p>
        <p className="text-purple-600 font-bold text-sm mt-1">
          {venue.priceRange || `₹${(venue.price/1000).toFixed(0)}K`}
        </p>
      </div>
    </Link>
  );
});
HorizontalVenueCard.displayName = 'HorizontalVenueCard';

// ============================================
// Zomato Style Caterer Card (Clean List Style)
// ============================================
const CatererCard = memo(({ caterer }: { caterer: Caterer }) => {
  const fallbackImage = "https://images.unsplash.com/photo-1555244162-803834f70033?w=200&q=70";
  
  return (
    <Link 
      href={`/catering/${caterer.slug || caterer.id}`}
      className="flex gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
        <img
          src={caterer.image || fallbackImage}
          alt={caterer.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {caterer.isPureVeg && (
          <div className="absolute top-1 left-1 bg-green-500 p-0.5 rounded">
            <Leaf className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 text-sm truncate">{caterer.name}</h3>
          {caterer.rating && caterer.rating > 0 && (
            <div className="flex items-center gap-0.5 bg-green-600 text-white px-1.5 py-0.5 rounded text-xs flex-shrink-0">
              <Star className="w-2.5 h-2.5 fill-current" />
              <span>{caterer.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <p className="text-gray-500 text-xs truncate mt-0.5">
          {caterer.cuisines || "Multi-cuisine"}
        </p>

        <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
          <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
          <span className="truncate">{caterer.location}</span>
          {caterer.distanceText && (
            <>
              <span>•</span>
              <span className="flex-shrink-0">{caterer.distanceText}</span>
            </>
          )}
        </div>

        {/* Price & Status */}
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-orange-600 font-bold text-sm">
            ₹{caterer.price}<span className="text-gray-400 font-normal text-xs">/plate</span>
          </p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
            caterer.bookingEnabled 
              ? "bg-orange-100 text-orange-700" 
              : "bg-gray-100 text-gray-600"
          }`}>
            {caterer.bookingEnabled ? "Order Online" : "Call"}
          </span>
        </div>
      </div>
    </Link>
  );
});
CatererCard.displayName = 'CatererCard';

// ============================================
// Horizontal Caterer Card
// ============================================
const HorizontalCatererCard = memo(({ caterer }: { caterer: Caterer }) => {
  const fallbackImage = "https://images.unsplash.com/photo-1555244162-803834f70033?w=200&q=70";
  
  return (
    <Link 
      href={`/catering/${caterer.slug || caterer.id}`}
      className="flex-shrink-0 w-44 bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div className="relative h-28 bg-gray-100">
        <img
          src={caterer.image || fallbackImage}
          alt={caterer.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {caterer.isPureVeg && (
          <div className="absolute top-2 left-2 bg-green-500 p-0.5 rounded">
            <Leaf className="w-2.5 h-2.5 text-white" />
          </div>
        )}
        {caterer.rating && caterer.rating > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-0.5 bg-green-600 text-white px-1 py-0.5 rounded text-[10px]">
            <Star className="w-2.5 h-2.5 fill-current" />
            {caterer.rating.toFixed(1)}
          </div>
        )}
      </div>
      <div className="p-2">
        <h3 className="font-semibold text-gray-900 text-xs truncate">{caterer.name}</h3>
        <p className="text-gray-400 text-[10px] truncate">{caterer.cuisines || "Multi-cuisine"}</p>
        <p className="text-orange-600 font-bold text-xs mt-0.5">₹{caterer.price}/plate</p>
      </div>
    </Link>
  );
});
HorizontalCatererCard.displayName = 'HorizontalCatererCard';

// ============================================
// Location Selector Modal
// ============================================
function LocationSelector({ 
  currentLocation, 
  onSelect, 
  isOpen, 
  onClose 
}: { 
  currentLocation: string;
  onSelect: (location: string) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const popularLocations = [
    "Kolkata", "Salt Lake", "New Town", "Rajarhat", "Howrah", 
    "Barasat", "Dum Dum", "Ballygunge", "Park Street", "Alipore"
  ];
  
  useEffect(() => {
    if (searchQuery.length > 1) {
      // Filter popular locations
      const filtered = popularLocations.filter(loc => 
        loc.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] bg-black/50" onClick={onClose}>
      <div 
        className="absolute top-0 left-0 right-0 bg-white rounded-b-2xl max-h-[70vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-purple-600" />
            <input
              type="text"
              placeholder="Search for area, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-base outline-none"
              autoFocus
            />
            <button onClick={onClose} className="text-gray-500 text-sm">Cancel</button>
          </div>
        </div>
        
        <div className="p-4 overflow-auto max-h-[50vh]">
          {suggestions.length > 0 ? (
            <div className="space-y-2">
              {suggestions.map(loc => (
                <button
                  key={loc}
                  onClick={() => { onSelect(loc); onClose(); }}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                >
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{loc}</span>
                </button>
              ))}
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-3">POPULAR LOCATIONS</p>
              <div className="flex flex-wrap gap-2">
                {popularLocations.map(loc => (
                  <button
                    key={loc}
                    onClick={() => { onSelect(loc); onClose(); }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700"
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Section Header
// ============================================
const SectionHeader = memo(({ 
  title, 
  subtitle, 
  icon: Icon, 
  viewAllHref,
  accentColor = "purple"
}: { 
  title: string; 
  subtitle?: string;
  icon?: any;
  viewAllHref?: string;
  accentColor?: "purple" | "orange";
}) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      {Icon && (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          accentColor === "purple" ? "bg-purple-100" : "bg-orange-100"
        }`}>
          <Icon className={`w-4 h-4 ${accentColor === "purple" ? "text-purple-600" : "text-orange-600"}`} />
        </div>
      )}
      <div>
        <h2 className="font-bold text-gray-900 text-base">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
    {viewAllHref && (
      <Link href={viewAllHref} className={`text-sm font-medium flex items-center gap-0.5 ${
        accentColor === "purple" ? "text-purple-600" : "text-orange-600"
      }`}>
        View All <ChevronRight className="w-4 h-4" />
      </Link>
    )}
  </div>
));
SectionHeader.displayName = 'SectionHeader';

// ============================================
// Main Home Content
// ============================================
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
  const [selectedLocation, setSelectedLocation] = useState("Kolkata");
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  
  // Nearby data
  const { data: nearbyVenues, loading: nearbyVenuesLoading } = useNearby("venues", 12);
  const { data: nearbyCaterers, loading: nearbyCaterersLoading } = useNearby("caterers", 12);

  // Fetch featured data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/featured?venueLimit=12&catererLimit=12');
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

  // Tab change
  const handleTabChange = (tab: "venues" | "catering") => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("mode", tab);
    window.history.replaceState({}, "", url.toString());
  };

  // Search handler for modal
  const handleSearchFromModal = useCallback((params: {
    search: string;
    date?: string;
    guests?: number;
    isNearby?: boolean;
    lat?: number;
    lng?: number;
  }) => {
    const urlParams = new URLSearchParams();
    if (params.search) urlParams.set("search", params.search);
    if (params.date) urlParams.set("date", params.date);
    if (params.guests) urlParams.set("minGuests", params.guests.toString());
    if (params.isNearby && params.lat && params.lng) {
      urlParams.set("lat", params.lat.toString());
      urlParams.set("lng", params.lng.toString());
      urlParams.set("sort", "nearby");
    }
    const path = activeTab === "venues" ? "/venues" : "/catering";
    router.push(`${path}?${urlParams.toString()}`);
  }, [activeTab, router]);

  // Simple search (for quick area tags)
  const handleQuickSearch = useCallback((area: string) => {
    const params = new URLSearchParams();
    params.set("search", area);
    const path = activeTab === "venues" ? "/venues" : "/catering";
    router.push(`${path}?${params.toString()}`);
  }, [activeTab, router]);

  // Popular areas for quick search
  const quickAreas = ["Salt Lake", "New Town", "Rajarhat", "Howrah"];
  
  // Split venues for mixed layout
  const nearbyVenuesList = nearbyVenues.slice(0, 4);
  const bestVenues = venues.slice(0, 6);
  const featuredVenues = venues.slice(6, 12);
  const moreNearbyVenues = nearbyVenues.slice(4, 8);
  
  // Split caterers
  const topCaterers = caterers.filter(c => c.rating && c.rating >= 4).slice(0, 6);
  const allCaterers = caterers;

  const accentColor = activeTab === "venues" ? "purple" : "orange";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Location */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between">
            {/* Logo & Location */}
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <button 
                onClick={() => setShowLocationPicker(true)}
                className="flex items-center gap-1 text-left"
              >
                <MapPin className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-[10px] text-gray-400 leading-none">Location</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-0.5">
                    {selectedLocation}
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </p>
                </div>
              </button>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-1">
              <Link href="/wishlist" className="p-2 hover:bg-gray-100 rounded-full">
                <Heart className="w-5 h-5 text-gray-600" />
              </Link>
              <Link 
                href="/auth/signin" 
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
                  activeTab === "venues" 
                    ? "text-purple-600 bg-purple-50" 
                    : "text-orange-600 bg-orange-50"
                }`}
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Location Picker Modal */}
      <LocationSelector
        currentLocation={selectedLocation}
        onSelect={setSelectedLocation}
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
      />
      
      {/* Search Modal */}
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSearch={handleSearchFromModal}
        activeTab={activeTab}
      />

      {/* Tab Switcher */}
      <div className="bg-white border-b sticky top-[52px] z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex">
            <button
              onClick={() => handleTabChange("venues")}
              className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === "venues"
                  ? "text-purple-600 border-purple-600"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              <Building2 className="w-4 h-4" />
              Venues
            </button>
            <button
              onClick={() => handleTabChange("catering")}
              className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === "catering"
                  ? "text-orange-600 border-orange-600"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              <ChefHat className="w-4 h-4" />
              Catering
            </button>
          </div>
        </div>
      </div>

      {/* Search Section - Airbnb Style */}
      <div className={`px-4 py-4 ${activeTab === "venues" ? "bg-purple-600" : "bg-orange-500"}`}>
        <div className="max-w-3xl mx-auto">
          {/* Clickable Search Bar */}
          <button
            onClick={() => setShowSearchModal(true)}
            className="w-full bg-white rounded-full p-2 pr-4 flex items-center gap-3 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              activeTab === "venues" ? "bg-purple-600" : "bg-orange-500"
            }`}>
              <Search className="w-5 h-5 text-white" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {activeTab === "venues" ? "Where to celebrate?" : "What's cooking?"}
              </p>
              <p className="text-xs text-gray-500">
                {activeTab === "venues" 
                  ? "Search venues · Add dates · Add guests"
                  : "Search caterers · Cuisine · Location"
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === "venues" && (
                <>
                  <div className="w-px h-6 bg-gray-200" />
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div className="w-px h-6 bg-gray-200" />
                  <Users className="w-4 h-4 text-gray-400" />
                </>
              )}
            </div>
          </button>
          
          {/* Quick Area Tags */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {quickAreas.map(area => (
              <button
                key={area}
                onClick={() => handleQuickSearch(area)}
                className="flex-shrink-0 px-3 py-1.5 bg-white/20 text-white text-xs rounded-full hover:bg-white/30 font-medium"
              >
                {area}
              </button>
            ))}
            <button
              onClick={() => setShowSearchModal(true)}
              className="flex-shrink-0 px-3 py-1.5 bg-white text-gray-700 text-xs rounded-full hover:bg-gray-100 font-medium flex items-center gap-1"
            >
              <Search className="w-3 h-3" />
              More
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 max-w-7xl mx-auto">
        {activeTab === "venues" ? (
          <>
            {/* Venues Near You - Vertical Grid */}
            <section className="mb-6">
              <SectionHeader 
                title="Venues Near You" 
                subtitle={`${nearbyVenuesList.length} venues found`}
                icon={Navigation}
                viewAllHref="/venues?sort=nearby"
                accentColor="purple"
              />
              {nearbyVenuesLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[...Array(4)].map((_, i) => <VenueCardSkeleton key={i} />)}
                </div>
              ) : nearbyVenuesList.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {nearbyVenuesList.map((venue: any) => (
                    <VenueCard key={venue.id} venue={venue} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Enable location to see nearby venues
                </div>
              )}
            </section>

            {/* Best in Town - Horizontal Scroll */}
            <section className="mb-6">
              <SectionHeader 
                title="Best in Town" 
                icon={Star}
                viewAllHref="/venues?sort=popular"
                accentColor="purple"
              />
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-64 h-48 bg-gray-100 rounded-xl" />
                  ))
                ) : (
                  bestVenues.map(venue => (
                    <HorizontalVenueCard key={venue.id} venue={venue} />
                  ))
                )}
              </div>
            </section>

            {/* More Nearby Venues - Vertical */}
            {moreNearbyVenues.length > 0 && (
              <section className="mb-6">
                <SectionHeader 
                  title="More Nearby" 
                  icon={MapPin}
                  viewAllHref="/venues?sort=nearby"
                  accentColor="purple"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {moreNearbyVenues.map((venue: any) => (
                    <VenueCard key={venue.id} venue={venue} />
                  ))}
                </div>
              </section>
            )}

            {/* Featured Venues - Horizontal */}
            {featuredVenues.length > 0 && (
              <section className="mb-6">
                <SectionHeader 
                  title="Featured Venues" 
                  icon={Sparkles}
                  viewAllHref="/venues"
                  accentColor="purple"
                />
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {featuredVenues.map(venue => (
                    <HorizontalVenueCard key={venue.id} venue={venue} />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <>
            {/* Top Rated Caterers - Horizontal */}
            {topCaterers.length > 0 && (
              <section className="mb-6">
                <SectionHeader 
                  title="Top Rated" 
                  icon={Star}
                  viewAllHref="/catering?sort=rating"
                  accentColor="orange"
                />
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {topCaterers.map(caterer => (
                    <HorizontalCatererCard key={caterer.id} caterer={caterer} />
                  ))}
                </div>
              </section>
            )}

            {/* All Caterers - Vertical List */}
            <section>
              <SectionHeader 
                title="All Caterers" 
                subtitle={`${allCaterers.length} caterers`}
                icon={ChefHat}
                viewAllHref="/catering"
                accentColor="orange"
              />
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => <CatererCardSkeleton key={i} />)}
                </div>
              ) : allCaterers.length > 0 ? (
                <div className="space-y-3">
                  {allCaterers.map(caterer => (
                    <CatererCard key={caterer.id} caterer={caterer} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No caterers available
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Simple Footer */}
      <footer className="bg-white border-t py-6 px-4 mt-8">
        <div className="max-w-7xl mx-auto text-center">
          <Logo size="sm" className="mx-auto mb-3" />
          <p className="text-gray-500 text-xs mb-3">
            Find the perfect venue and catering for your events
          </p>
          <div className="flex justify-center gap-4 text-xs text-gray-400">
            <Link href="/venues" className="hover:text-gray-600">Venues</Link>
            <Link href="/catering" className="hover:text-gray-600">Catering</Link>
            <Link href="/bookings" className="hover:text-gray-600">Bookings</Link>
          </div>
          <p className="text-gray-300 text-[10px] mt-4">© 2024 Happily Eated</p>
        </div>
      </footer>
    </div>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  );
}

// Export
export default function HomePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HomeContent />
    </Suspense>
  );
}
