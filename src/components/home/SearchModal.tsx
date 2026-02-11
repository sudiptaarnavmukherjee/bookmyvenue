"use client";

import { useState, useEffect, memo } from "react";
import { 
  Search, MapPin, Calendar, Users, X, Navigation, 
  Clock, Minus, Plus, ChevronRight, Building2, ChefHat
} from "lucide-react";
import { useLocation } from "@/hooks/useLocation";

// ============================================
// Types
// ============================================
interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (params: SearchParams) => void;
  activeTab: "venues" | "catering";
}

interface SearchParams {
  search: string;
  date?: string;
  guests?: number;
  isNearby?: boolean;
  lat?: number;
  lng?: number;
}

interface RecentSearch {
  query: string;
  date?: string;
  guests?: number;
  timestamp: number;
}

// ============================================
// Constants
// ============================================
const POPULAR_LOCATIONS = [
  { name: "Salt Lake", icon: "🏙️" },
  { name: "New Town", icon: "🌆" },
  { name: "Rajarhat", icon: "🏘️" },
  { name: "Park Street", icon: "🎭" },
  { name: "Ballygunge", icon: "🏛️" },
  { name: "Howrah", icon: "🌉" },
];

// ============================================
// Guest Counter Component
// ============================================
const GuestCounter = memo(({ 
  label, 
  sublabel, 
  value, 
  onChange,
  min = 0,
  max = 100
}: { 
  label: string; 
  sublabel: string; 
  value: number; 
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) => (
  <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
    <div>
      <p className="font-semibold text-gray-900">{label}</p>
      <p className="text-sm text-gray-500">{sublabel}</p>
    </div>
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-400 transition-colors"
      >
        <Minus className="w-4 h-4 text-gray-600" />
      </button>
      <span className="w-8 text-center font-medium text-gray-900">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-400 transition-colors"
      >
        <Plus className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  </div>
));
GuestCounter.displayName = 'GuestCounter';

// ============================================
// Search Section Card
// ============================================
const SearchCard = memo(({ 
  title, 
  value, 
  placeholder,
  isActive,
  onClick,
  icon: Icon
}: { 
  title: string; 
  value: string; 
  placeholder: string;
  isActive: boolean;
  onClick: () => void;
  icon: any;
}) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-4 rounded-2xl transition-all ${
      isActive 
        ? "bg-white shadow-lg ring-1 ring-gray-100" 
        : "bg-gray-50 hover:bg-gray-100"
    }`}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          isActive ? "bg-purple-100" : "bg-gray-200"
        }`}>
          <Icon className={`w-5 h-5 ${isActive ? "text-purple-600" : "text-gray-500"}`} />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">{title}</p>
          <p className={`font-semibold ${value ? "text-gray-900" : "text-gray-400"}`}>
            {value || placeholder}
          </p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </div>
  </button>
));
SearchCard.displayName = 'SearchCard';

// ============================================
// Main Search Modal Component
// ============================================
export default function SearchModal({ isOpen, onClose, onSearch, activeTab }: SearchModalProps) {
  // Section state
  const [activeSection, setActiveSection] = useState<"where" | "when" | "who" | null>("where");
  
  // Search values
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [guestCount, setGuestCount] = useState(0);
  const [isNearby, setIsNearby] = useState(false);
  
  // Recent searches
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  
  // Location
  const { location, loading: locationLoading } = useLocation();
  
  // Load recent searches
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('recentSearches');
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored).slice(0, 5));
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, []);
  
  // Save recent search
  const saveRecentSearch = (search: RecentSearch) => {
    const updated = [search, ...recentSearches.filter(r => r.query !== search.query)].slice(0, 5);
    setRecentSearches(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    }
  };
  
  // Handle search
  const handleSearch = () => {
    const params: SearchParams = {
      search: searchQuery,
      date: selectedDate || undefined,
      guests: guestCount > 0 ? guestCount : undefined,
      isNearby,
      lat: isNearby ? location?.lat : undefined,
      lng: isNearby ? location?.lng : undefined,
    };
    
    // Save to recent
    if (searchQuery) {
      saveRecentSearch({
        query: searchQuery,
        date: selectedDate || undefined,
        guests: guestCount > 0 ? guestCount : undefined,
        timestamp: Date.now(),
      });
    }
    
    onSearch(params);
    onClose();
  };
  
  // Clear all
  const handleClearAll = () => {
    setSearchQuery("");
    setSelectedDate("");
    setGuestCount(0);
    setIsNearby(false);
  };
  
  // Select recent search
  const selectRecent = (recent: RecentSearch) => {
    setSearchQuery(recent.query);
    if (recent.date) setSelectedDate(recent.date);
    if (recent.guests) setGuestCount(recent.guests);
    setActiveSection(null);
  };
  
  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Get min date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  const accentColor = activeTab === "venues" ? "purple" : "orange";
  const accentBg = activeTab === "venues" ? "bg-purple-600" : "bg-orange-500";
  const accentText = activeTab === "venues" ? "text-purple-600" : "text-orange-600";
  const accentBgLight = activeTab === "venues" ? "bg-purple-100" : "bg-orange-100";
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="absolute inset-x-0 top-0 bottom-0 bg-gray-100 overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-b">
          <div className="flex items-center gap-2">
            {activeTab === "venues" ? (
              <Building2 className="w-5 h-5 text-purple-600" />
            ) : (
              <ChefHat className="w-5 h-5 text-orange-500" />
            )}
            <span className="font-semibold text-gray-900">
              {activeTab === "venues" ? "Find Venues" : "Find Caterers"}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {/* Where Card */}
          <div className={`rounded-2xl overflow-hidden ${
            activeSection === "where" ? "bg-white shadow-lg" : ""
          }`}>
            <SearchCard
              title="Where"
              value={isNearby ? "Nearby" : searchQuery}
              placeholder="Search by name, area..."
              isActive={activeSection === "where"}
              onClick={() => setActiveSection(activeSection === "where" ? null : "where")}
              icon={MapPin}
            />
            
            {activeSection === "where" && (
              <div className="p-4 pt-0 space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setIsNearby(false); }}
                    placeholder={activeTab === "venues" 
                      ? "Search venue name, area, city..." 
                      : "Search caterer name, cuisine, area..."
                    }
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-100"
                    autoFocus
                  />
                </div>
                
                {/* Nearby Button */}
                <button
                  onClick={() => { setIsNearby(true); setSearchQuery(""); setActiveSection(null); }}
                  disabled={locationLoading}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    isNearby 
                      ? `${accentBgLight} ${accentText}` 
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isNearby ? accentBg : "bg-blue-100"
                  }`}>
                    <Navigation className={`w-5 h-5 ${isNearby ? "text-white" : "text-blue-600"}`} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Nearby</p>
                    <p className="text-xs text-gray-500">Find what&apos;s around you</p>
                  </div>
                </button>
                
                {/* Recent Searches */}
                {recentSearches.length > 0 && !searchQuery && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-2">RECENT SEARCHES</p>
                    <div className="space-y-1">
                      {recentSearches.map((recent, i) => (
                        <button
                          key={i}
                          onClick={() => selectRecent(recent)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                        >
                          <Clock className="w-4 h-4 text-gray-400" />
                          <div className="text-left flex-1">
                            <p className="text-sm font-medium text-gray-900">{recent.query}</p>
                            <p className="text-xs text-gray-500">
                              {recent.date && formatDate(recent.date)}
                              {recent.guests && ` · ${recent.guests} guests`}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Suggested Destinations */}
                {!searchQuery && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-2">POPULAR AREAS</p>
                    <div className="grid grid-cols-2 gap-2">
                      {POPULAR_LOCATIONS.map((loc) => (
                        <button
                          key={loc.name}
                          onClick={() => { setSearchQuery(loc.name); setIsNearby(false); setActiveSection(null); }}
                          className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-100"
                        >
                          <span className="text-lg">{loc.icon}</span>
                          <span className="text-sm font-medium text-gray-900">{loc.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* When Card - Only for Venues */}
          {activeTab === "venues" && (
            <div className={`rounded-2xl overflow-hidden ${
              activeSection === "when" ? "bg-white shadow-lg" : ""
            }`}>
              <SearchCard
                title="When"
                value={selectedDate ? formatDate(selectedDate) : ""}
                placeholder="Add dates"
                isActive={activeSection === "when"}
                onClick={() => setActiveSection(activeSection === "when" ? null : "when")}
                icon={Calendar}
              />
              
              {activeSection === "when" && (
                <div className="p-4 pt-0">
                  <p className="text-sm text-gray-500 mb-3">
                    Select your event date to check venue availability
                  </p>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={getMinDate()}
                    className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-100"
                  />
                  
                  {/* Quick Date Options */}
                  <div className="flex gap-2 mt-3">
                    {["Today", "Tomorrow", "This Weekend"].map((label) => {
                      let date = new Date();
                      if (label === "Tomorrow") date.setDate(date.getDate() + 1);
                      if (label === "This Weekend") {
                        const day = date.getDay();
                        const daysUntilSat = (6 - day + 7) % 7 || 7;
                        date.setDate(date.getDate() + daysUntilSat);
                      }
                      const dateStr = date.toISOString().split('T')[0];
                      
                      return (
                        <button
                          key={label}
                          onClick={() => setSelectedDate(dateStr)}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                            selectedDate === dateStr
                              ? `${accentBg} text-white`
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Who Card */}
          <div className={`rounded-2xl overflow-hidden ${
            activeSection === "who" ? "bg-white shadow-lg" : ""
          }`}>
            <SearchCard
              title="Who"
              value={guestCount > 0 ? `${guestCount} guests` : ""}
              placeholder={activeTab === "venues" ? "Add guests" : "Add plates"}
              isActive={activeSection === "who"}
              onClick={() => setActiveSection(activeSection === "who" ? null : "who")}
              icon={Users}
            />
            
            {activeSection === "who" && (
              <div className="p-4 pt-0">
                {activeTab === "venues" ? (
                  <>
                    <p className="text-sm text-gray-500 mb-3">
                      How many guests are expected?
                    </p>
                    <GuestCounter
                      label="Guests"
                      sublabel="Total expected attendees"
                      value={guestCount}
                      onChange={setGuestCount}
                      min={0}
                      max={2000}
                    />
                    
                    {/* Quick Guest Options */}
                    <div className="flex gap-2 mt-4">
                      {[50, 100, 200, 500].map((count) => (
                        <button
                          key={count}
                          onClick={() => setGuestCount(count)}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                            guestCount === count
                              ? `${accentBg} text-white`
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {count}+
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 mb-3">
                      Approximate number of plates needed?
                    </p>
                    <GuestCounter
                      label="Plates"
                      sublabel="Number of servings"
                      value={guestCount}
                      onChange={setGuestCount}
                      min={0}
                      max={5000}
                    />
                    
                    {/* Quick Plate Options */}
                    <div className="flex gap-2 mt-4">
                      {[50, 100, 250, 500].map((count) => (
                        <button
                          key={count}
                          onClick={() => setGuestCount(count)}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                            guestCount === count
                              ? `${accentBg} text-white`
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {count}+
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-white border-t px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleClearAll}
            className="text-sm font-semibold text-gray-900 underline underline-offset-2"
          >
            Clear all
          </button>
          
          <button
            onClick={handleSearch}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white ${accentBg}`}
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
      </div>
      
      {/* Animation Styles */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
