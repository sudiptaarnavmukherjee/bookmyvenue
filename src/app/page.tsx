"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, MapPin, Calendar, ChevronRight, Star, 
  Heart, Sparkles, Building2, Users, Award,
  ArrowRight, Shield, Clock, Zap,
  ChefHat, PartyPopper, Utensils, CheckCircle,
  TrendingUp, Phone, Mail
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOwnerRedirect } from "@/hooks/useOwnerRedirect";

// Featured venue type
interface FeaturedVenue {
  id: string;
  name: string;
  slug?: string;
  location: string;
  city?: string;
  area?: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  capacity?: number;
  isVerified?: boolean;
}

// Animated counter hook
function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  
  useEffect(() => {
    if (!hasStarted) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, hasStarted]);
  
  return { count, start: () => setHasStarted(true) };
}

export default function HomePage() {
  useOwnerRedirect();
  const router = useRouter();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [activeTab, setActiveTab] = useState<"venues" | "catering">("venues");
  
  // Data state
  const [featuredVenues, setFeaturedVenues] = useState<FeaturedVenue[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats with animation
  const venueCount = useCountUp(500, 2500);
  const happyCustomers = useCountUp(10000, 2500);
  const citiesCount = useCountUp(12, 2000);

  // Start counter animation when in view
  useEffect(() => {
    const timer = setTimeout(() => {
      venueCount.start();
      happyCustomers.start();
      citiesCount.start();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Fetch featured venues
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch('/api/venues?limit=6&sortBy=popular');
        const data = await res.json();
        if (data.venues) {
          setFeaturedVenues(data.venues.slice(0, 6).map((v: any) => ({
            id: v.id,
            name: v.name,
            slug: v.slug,
            location: v.area || v.city || 'Kolkata',
            city: v.city,
            area: v.area,
            price: v.exactPrice || v.primeDayPrice || v.estimatedMinPrice || 50000,
            rating: v.avgRating || 4.5,
            reviews: v._count?.reviews || Math.floor(Math.random() * 50) + 10,
            image: (typeof v.images === 'string' ? v.images.split(',')[0] : v.images?.[0]) || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
            capacity: v.maxGuests || v.capacity,
            isVerified: v.isVerified
          })));
        }
      } catch (error) {
        console.error('Failed to fetch venues:', error);
        // Set placeholder data
        setFeaturedVenues([
          { id: '1', name: 'Grand Palace Banquet', location: 'Salt Lake', price: 150000, rating: 4.8, reviews: 124, image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800', isVerified: true },
          { id: '2', name: 'Royal Gardens', location: 'New Town', price: 200000, rating: 4.9, reviews: 89, image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800', isVerified: true },
          { id: '3', name: 'Sunset Lawns', location: 'Rajarhat', price: 80000, rating: 4.6, reviews: 67, image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800', isVerified: false },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("city", searchQuery);
    if (selectedDate) params.set("date", selectedDate);
    if (guestCount) params.set("guests", guestCount);
    
    const path = activeTab === "venues" ? "/venues" : "/catering";
    router.push(`${path}?${params.toString()}`);
  }, [searchQuery, selectedDate, guestCount, activeTab, router]);

  // Categories
  const categories = [
    { icon: Building2, label: "Banquet Halls", count: "150+", color: "from-violet-500 to-purple-600", href: "/venues?type=banquet" },
    { icon: PartyPopper, label: "Wedding Lawns", count: "80+", color: "from-pink-500 to-rose-600", href: "/venues?type=lawn" },
    { icon: Building2, label: "Hotels & Resorts", count: "45+", color: "from-blue-500 to-cyan-600", href: "/venues?type=hotel" },
    { icon: ChefHat, label: "Catering", count: "200+", color: "from-orange-500 to-amber-600", href: "/catering" },
  ];

  // Features
  const features = [
    { icon: Shield, title: "100% Verified", desc: "All venues personally inspected" },
    { icon: Clock, title: "Instant Booking", desc: "Confirm in under 2 minutes" },
    { icon: Zap, title: "Best Prices", desc: "Guaranteed lowest rates" },
    { icon: Award, title: "Expert Support", desc: "Dedicated wedding planners" },
  ];

  // Testimonials
  const testimonials = [
    { name: "Priya & Rahul", location: "Kolkata", text: "Found our dream venue in just 2 days! The team was incredibly helpful.", rating: 5, image: "https://i.pravatar.cc/100?img=1" },
    { name: "Sneha & Vikram", location: "Salt Lake", text: "Best platform for wedding planning. Saved us so much time and money!", rating: 5, image: "https://i.pravatar.cc/100?img=2" },
    { name: "Ananya & Karthik", location: "New Town", text: "Professional service and amazing venue options. Highly recommended!", rating: 5, image: "https://i.pravatar.cc/100?img=3" },
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[100dvh] flex items-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700" />
          
          {/* Animated gradient orbs */}
          <motion.div 
            className="absolute top-0 left-0 w-[500px] h-[500px] bg-pink-500/30 rounded-full blur-[100px]"
            animate={{ 
              x: [0, 100, 0], 
              y: [0, 50, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-violet-500/40 rounded-full blur-[120px]"
            animate={{ 
              x: [0, -80, 0], 
              y: [0, -60, 0],
              scale: [1, 1.3, 1]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-fuchsia-500/20 rounded-full blur-[80px]"
            animate={{ 
              x: [-200, -100, -200], 
              y: [-200, -150, -200],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 md:mb-12"
          >
            {/* Trust Badge */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-5 py-2.5 mb-6"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-white/95 text-sm font-medium">Trusted by 10,000+ Happy Couples</span>
              <CheckCircle className="w-4 h-4 text-green-400" />
            </motion.div>
            
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
              Your Perfect
              <span className="block mt-2">
                <span className="bg-gradient-to-r from-yellow-200 via-pink-200 to-yellow-200 bg-clip-text text-transparent">
                  Wedding Venue
                </span>
              </span>
              <span className="block text-3xl sm:text-4xl md:text-5xl mt-2 text-white/80 font-medium">
                Awaits You
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/75 max-w-2xl mx-auto leading-relaxed">
              Discover stunning venues and premium catering services for your special day. 
              Book with confidence, celebrate with joy.
            </p>
          </motion.div>

          {/* Search Card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl shadow-black/25 p-4 md:p-8 border border-white/50">
              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                {[
                  { id: 'venues', icon: Building2, label: 'Venues' },
                  { id: 'catering', icon: ChefHat, label: 'Catering' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'venues' | 'catering')}
                    className={`flex-1 py-3.5 px-4 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-2 ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/30"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Fields */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Location */}
                <div className="md:col-span-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 ml-1">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-500" />
                    <input
                      type="text"
                      placeholder="City or area..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500 focus:bg-white transition-all text-base"
                    />
                  </div>
                </div>

                {/* Date */}
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 ml-1">Event Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-500" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-900 focus:outline-none focus:border-violet-500 focus:bg-white transition-all text-base"
                    />
                  </div>
                </div>

                {/* Guests */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 ml-1">Guests</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-500" />
                    <input
                      type="number"
                      placeholder="500"
                      value={guestCount}
                      onChange={(e) => setGuestCount(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500 focus:bg-white transition-all text-base"
                    />
                  </div>
                </div>

                {/* Search Button */}
                <div className="md:col-span-3 flex items-end">
                  <button
                    onClick={handleSearch}
                    className="w-full py-4 px-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all flex items-center justify-center gap-2 text-base"
                  >
                    <Search className="w-5 h-5" />
                    Search
                  </button>
                </div>
              </div>

              {/* Popular Searches */}
              <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-gray-100">
                <span className="text-sm text-gray-500 font-medium">Popular:</span>
                {["Kolkata", "Salt Lake", "New Town", "Rajarhat", "Barasat"].map((city) => (
                  <button
                    key={city}
                    onClick={() => setSearchQuery(city)}
                    className="text-sm text-violet-600 hover:text-violet-700 font-semibold hover:bg-violet-50 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex justify-center gap-8 md:gap-16 mt-10 md:mt-14"
          >
            {[
              { value: venueCount.count, suffix: "+", label: "Venues" },
              { value: Math.floor(happyCustomers.count / 1000), suffix: "K+", label: "Happy Couples" },
              { value: citiesCount.count, suffix: "+", label: "Cities" },
            ].map((stat, i) => (
              <motion.div 
                key={i} 
                className="text-center"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-3xl md:text-5xl font-bold text-white">
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-sm md:text-base text-white/70 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 12, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:block"
        >
          <div className="w-7 h-12 border-2 border-white/40 rounded-full flex justify-center pt-3">
            <motion.div 
              className="w-2 h-3 bg-white/70 rounded-full"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-violet-600 font-semibold text-sm uppercase tracking-wide">Explore</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mt-2 mb-4">
              Browse by Category
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Find the perfect venue type for your celebration
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  href={cat.href}
                  className="group block bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-violet-200 relative overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  
                  <div className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br ${cat.color} rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                    <cat.icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                  </div>
                  
                  <h3 className="font-bold text-gray-900 text-lg md:text-xl mb-1">{cat.label}</h3>
                  <p className="text-gray-500 font-medium">{cat.count} options</p>
                  
                  <div className="flex items-center gap-1 text-violet-600 mt-4 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Venues */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 md:mb-12"
          >
            <div>
              <span className="text-violet-600 font-semibold text-sm uppercase tracking-wide">Handpicked</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mt-2 mb-2">
                Featured Venues
              </h2>
              <p className="text-gray-600 text-lg">Loved by thousands of happy couples</p>
            </div>
            <Link 
              href="/venues"
              className="hidden md:inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 font-semibold text-lg group"
            >
              View All Venues 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-96 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {featuredVenues.map((venue, i) => (
                <motion.div
                  key={venue.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={`/venues/${venue.slug || venue.id}`}
                    className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100"
                  >
                    {/* Image Container */}
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={venue.image}
                        alt={venue.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      
                      {/* Badges */}
                      {venue.isVerified && (
                        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Verified
                        </div>
                      )}
                      
                      {/* Wishlist Button */}
                      <button 
                        className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow-lg"
                        onClick={(e) => e.preventDefault()}
                      >
                        <Heart className="w-5 h-5 text-gray-600 hover:text-red-500 transition-colors" />
                      </button>

                      {/* Title & Location */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-1 line-clamp-1">{venue.name}</h3>
                        <div className="flex items-center gap-1.5 text-white/90">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm font-medium">{venue.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl md:text-3xl font-bold text-gray-900">
                            ₹{venue.price >= 100000 
                              ? `${(venue.price / 100000).toFixed(1)}L` 
                              : `${(venue.price / 1000).toFixed(0)}K`}
                          </span>
                          <span className="text-gray-500 text-sm ml-1">onwards</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="font-bold text-gray-900">{venue.rating.toFixed(1)}</span>
                          <span className="text-gray-500 text-sm">({venue.reviews})</span>
                        </div>
                      </div>
                      
                      {venue.capacity && (
                        <div className="flex items-center gap-1.5 mt-3 text-gray-600">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">Up to {venue.capacity} guests</span>
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* Mobile CTA */}
          <div className="mt-8 text-center md:hidden">
            <Link 
              href="/venues"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-violet-500/30 hover:shadow-xl transition-all"
            >
              View All Venues <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-pink-200 font-semibold text-sm uppercase tracking-wide">Why Us</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mt-2 mb-4">
              Why Choose BookMyVenue?
            </h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              We make your wedding planning journey seamless and stress-free
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 md:p-8 text-center hover:bg-white/20 transition-all duration-300 group"
              >
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{feature.title}</h3>
                <p className="text-white/70">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-violet-600 font-semibold text-sm uppercase tracking-wide">Testimonials</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mt-2 mb-4">
              Loved by Couples
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              See what our happy couples have to say
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-lg mb-6 leading-relaxed">&ldquo;{testimonial.text}&rdquo;</p>
                <div className="flex items-center gap-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                    <p className="text-gray-500 text-sm">{testimonial.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
            
            <div className="relative z-10">
              <Sparkles className="w-12 h-12 text-yellow-300 mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                Ready to Find Your Perfect Venue?
              </h2>
              <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of happy couples who found their dream venue with us.
                Start your wedding journey today!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/venues"
                  className="px-8 py-4 bg-white text-violet-700 font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all text-lg"
                >
                  Browse Venues
                </Link>
                <Link
                  href="/auth/register"
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white/20 transition-all text-lg"
                >
                  Create Free Account
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer Spacing for Mobile Nav */}
      <div className="h-24 md:h-0" />
    </div>
  );
}
