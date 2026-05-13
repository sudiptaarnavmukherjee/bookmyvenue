"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api-client";
import { 
  MapPin, Users, Star, CheckCircle2,
  Heart, Share2, ArrowLeft, Loader2,
  Wifi, Car, Music, Utensils, Phone, Eye, IndianRupee,
  ChevronLeft, ChevronRight, X, Grid3x3, BadgeCheck, Clock
} from "lucide-react";
import MapEmbed from "@/components/venue/MapEmbed";

export type VenueData = {
  id: string;
  slug: string;
  name: string;
  city: string;
  area?: string | null;
  location: string;
  address?: string | null;
  capacity: number;
  minGuests?: number | null;
  maxGuests?: number | null;
  price: number;
  exactPrice?: number | null;
  estimatedMinPrice?: number | null;
  estimatedMaxPrice?: number | null;
  primeDayPrice?: number | null;
  nonPrimeDayPrice?: number | null;
  primeDays?: string | null;
  marriagePrice?: number | null;
  birthdayPrice?: number | null;
  otherEventPrice?: number | null;
  isVerified: boolean;
  bookingEnabled?: boolean;
  isAdminListed?: boolean;
  contactNumber?: string | null;
  contactName?: string | null;
  description: string;
  images: string[];
  amenities: string[];
  viewCount?: number;
  ownerName?: string | null;
  reviewCount?: number;
  bookingCount?: number;
  bookedDates?: string[];
  latitude?: number | null;
  longitude?: number | null;
  googleMapsUrl?: string | null;
};

const AMENITY_ICONS: Record<string, any> = {
  "WiFi": Wifi,
  "Wi-Fi": Wifi,
  "Parking": Car,
  "Valet Parking": Car,
  "DJ Setup": Music,
  "DJ/Music System": Music,
  "Catering Kitchen": Utensils,
  "In-house Catering": Utensils,
  "Catering Allowed": Utensils,
  "Premium Catering": Utensils,
  "Basic Catering": Utensils
};

export default function VenueDetailContent({ venue }: { venue: VenueData }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedImage, setSelectedImage] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [guests, setGuests] = useState("");
  const [message, setMessage] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [stickyNav, setStickyNav] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLDivElement>(null);
  const amenitiesRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const bookingCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/venues/${venue.id}/views`, { method: "POST" }).catch(() => {});
  }, [venue.id]);

  // Load wishlist state on mount
  useEffect(() => {
    if (!session) return;
    fetch("/api/wishlist", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const wishlisted = (d.wishlist || []).some((item: any) => item.venueId === venue.id);
        setIsInWishlist(wishlisted);
      })
      .catch(() => {});
  }, [session, venue.id]);

  const handleWishlistToggle = async () => {
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    if (wishlistLoading) return;
    const prev = isInWishlist;
    setIsInWishlist(!prev);
    setWishlistLoading(true);
    try {
      const { error } = prev
        ? await api.removeFromWishlist(venue.id)
        : await api.addToWishlist({ venueId: venue.id });
      if (error) {
        setIsInWishlist(prev);
        console.error("Wishlist error:", error);
      }
    } catch (err) {
      setIsInWishlist(prev);
      console.error("Wishlist error:", err);
    } finally {
      setWishlistLoading(false);
    }
  };

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStickyNav(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: venue.name, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const prevImage = () =>
    setSelectedImage((i) => (i - 1 + venue.images.length) % venue.images.length);
  const nextImage = () =>
    setSelectedImage((i) => (i + 1) % venue.images.length);

  const handleBooking = async () => {
    if (!session?.user) {
      router.push("/auth/signin");
      return;
    }

    if (!bookingDate || !guests) {
      alert("Please fill in all fields");
      return;
    }

    if (isDateBooked(bookingDate)) {
      alert("This date is already booked. Please choose another date.");
      return;
    }

    setBookingLoading(true);
    try {
      const bookingData = {
        type: "VENUE",
        venueId: venue.id,
        eventDate: bookingDate,
        guestCount: parseInt(guests),
        customerName: session.user.name || "Guest",
        customerEmail: session.user.email || "",
        customerPhone: "N/A",
        specialRequests: message,
        totalAmount: venue.price || 0,
      };

      const { error: err } = await api.createBooking(bookingData);
      
      if (err) {
        alert(`Booking failed: ${err}`);
      } else {
        alert("Booking created successfully! Check your bookings page.");
        router.push("/bookings");
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setBookingLoading(false);
    }
  };

  const isDateBooked = (date: string) => {
    const selectedDate = new Date(date).toDateString();
    return venue.bookedDates?.some(d => new Date(d).toDateString() === selectedDate) || false;
  };

  const isFishbowl = venue.isAdminListed && !venue.bookingEnabled;
  const displayPrice = venue.exactPrice || venue.price || 0;

  return (
    <>
      {/* ── Lightbox ─────────────────────────────────────────────── */}
      {showLightbox && venue.images.length > 0 && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center">
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          {venue.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <img
            src={venue.images[selectedImage]}
            alt={venue.name}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
          />
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-sm text-white">
            {selectedImage + 1} / {venue.images.length}
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50">
        {/* ── Top breadcrumb ───────────────────────────────────────── */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-4 pb-2">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-purple-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Venues
          </button>
        </div>

        {/* ── Hero Gallery ─────────────────────────────────────────── */}
        <div ref={heroRef} className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Main image */}
          <div
            className="relative w-full rounded-2xl overflow-hidden cursor-pointer"
            onClick={() => setShowLightbox(true)}
          >
            {venue.images.length > 0 ? (
              <img
                src={venue.images[selectedImage]}
                alt={venue.name}
                className="w-full h-auto block"
                style={{ maxHeight: '520px', objectFit: 'cover', objectPosition: 'center' }}
              />
            ) : (
              <div className="h-64 flex items-center justify-center bg-purple-50 rounded-2xl">
                <Grid3x3 className="h-16 w-16 text-purple-300" />
              </div>
            )}
            {venue.images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
                  {selectedImage + 1} / {venue.images.length}
                </div>
              </>
            )}
          </div>
          {/* Thumbnails */}
          {venue.images.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {venue.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`flex-shrink-0 h-16 w-24 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === idx ? 'border-purple-600' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Gallery action row */}
          <div className="flex items-center justify-between mt-3 mb-1">
            <div className="flex gap-2 flex-wrap">
              {venue.isVerified && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 border border-green-200">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified Venue
                </span>
              )}
              {venue.viewCount !== undefined && venue.viewCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
                  <Eye className="h-3.5 w-3.5" /> {venue.viewCount.toLocaleString()} views
                </span>
              )}
            </div>
            {venue.images.length > 1 && (
              <button
                onClick={() => setShowLightbox(true)}
                className="text-xs font-medium text-purple-700 hover:text-purple-900 underline underline-offset-2"
              >
                View all {venue.images.length} photos
              </button>
            )}
          </div>
        </div>

        {/* ── Sticky Sub-nav ───────────────────────────────────────── */}
        <div
          className={`sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm transition-all duration-300 ${
            stickyNav ? "translate-y-0 opacity-100" : "opacity-0 -translate-y-4 pointer-events-none"
          }`}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-between h-14">
            <h2 className="text-base font-bold text-gray-900 truncate max-w-xs">{venue.name}</h2>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 text-sm">
                {[
                  { label: "Overview", ref: overviewRef },
                  { label: "Amenities", ref: amenitiesRef },
                  { label: "Location", ref: locationRef },
                ].map(({ label, ref }) => (
                  <button
                    key={label}
                    onClick={() => scrollTo(ref)}
                    className="px-3 py-1.5 rounded-lg text-gray-600 hover:bg-purple-50 hover:text-purple-700 font-medium transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => scrollTo(bookingCardRef)}
                className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-1.5 text-sm font-bold text-white shadow hover:shadow-md transition-all"
              >
                {isFishbowl ? "Contact" : "Book Now"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Main Grid ────────────────────────────────────────────── */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 grid gap-8 lg:grid-cols-3 py-8">
          {/* ── LEFT: Content ──────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-10">

            {/* Overview Section */}
            <div ref={overviewRef} className="scroll-mt-20">
              {/* Title row */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
                    {venue.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-gray-500 text-sm">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-purple-500" />
                      {venue.area ? `${venue.area}, ${venue.city}` : venue.city}
                    </span>
                    {venue.reviewCount !== undefined && venue.reviewCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium text-gray-700">{venue.reviewCount}</span> review{venue.reviewCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {venue.bookingCount !== undefined && venue.bookingCount > 0 && (
                      <span>{venue.bookingCount} bookings</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={handleShare}
                    className="rounded-xl border border-gray-200 p-2.5 hover:bg-gray-50 transition-colors"
                    title="Share"
                  >
                    <Share2 className="h-5 w-5 text-gray-600" />
                  </button>
                  <button
                    onClick={handleWishlistToggle}
                    disabled={wishlistLoading}
                    className="rounded-xl border border-gray-200 p-2.5 hover:bg-rose-50 transition-colors disabled:opacity-50"
                    title={isInWishlist ? "Remove from wishlist" : "Save to wishlist"}
                  >
                    <Heart
                      className={`h-5 w-5 transition-colors ${
                        isInWishlist ? "fill-rose-500 text-rose-500" : "text-gray-600"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Quick stats strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                <div className="flex items-center gap-3 rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Max Capacity</p>
                    <p className="font-bold text-gray-900">{venue.capacity} guests</p>
                  </div>
                </div>
                {(venue.minGuests || venue.maxGuests) && (
                  <div className="flex items-center gap-3 rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Guest Range</p>
                      <p className="font-bold text-gray-900">
                        {venue.minGuests || 0}–{venue.maxGuests || venue.capacity}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                    <Clock className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Availability</p>
                    <p className="font-bold text-gray-900">On request</p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <hr className="border-gray-100 mb-6" />

              {/* Hosted by */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-lg">
                  {(venue.ownerName || venue.contactName || "V")[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Hosted by</p>
                  <p className="font-semibold text-gray-900">{venue.ownerName || venue.contactName || "Venue Owner"}</p>
                </div>
              </div>

              {/* About */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">About this venue</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{venue.description}</p>
              </div>
            </div>

            {/* Amenities Section */}
            {venue.amenities.length > 0 && (
              <div ref={amenitiesRef} className="scroll-mt-20">
                <h2 className="text-xl font-bold text-gray-900 mb-5">What this place offers</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {venue.amenities.map((amenity, idx) => {
                    const Icon = AMENITY_ICONS[amenity] || CheckCircle2;
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 rounded-2xl bg-white border border-gray-100 shadow-sm px-4 py-3 hover:border-purple-200 hover:shadow-md transition-all"
                      >
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-purple-50">
                          <Icon className="h-4.5 w-4.5 text-purple-600 h-5 w-5" />
                        </div>
                        <span className="font-medium text-gray-700">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Event Pricing (fishbowl mode only — show on left for visibility) */}
            {isFishbowl && (venue.marriagePrice || venue.birthdayPrice || venue.otherEventPrice || venue.primeDayPrice || venue.nonPrimeDayPrice) && (
              <div className="scroll-mt-20">
                <h2 className="text-xl font-bold text-gray-900 mb-5">Pricing</h2>
                <div className="space-y-3">
                  {venue.marriagePrice && (
                    <div className="flex items-center justify-between rounded-2xl bg-white border border-rose-100 shadow-sm px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">💍</span>
                        <div>
                          <p className="font-semibold text-gray-900">Marriage / Wedding</p>
                          <p className="text-xs text-gray-400">Approx. pricing</p>
                        </div>
                      </div>
                      <p className="text-xl font-extrabold text-rose-700">₹{venue.marriagePrice.toLocaleString("en-IN")}</p>
                    </div>
                  )}
                  {venue.birthdayPrice && (
                    <div className="flex items-center justify-between rounded-2xl bg-white border border-amber-100 shadow-sm px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🎂</span>
                        <div>
                          <p className="font-semibold text-gray-900">Birthday / Anniversary</p>
                          <p className="text-xs text-gray-400">Approx. pricing</p>
                        </div>
                      </div>
                      <p className="text-xl font-extrabold text-amber-700">₹{venue.birthdayPrice.toLocaleString("en-IN")}</p>
                    </div>
                  )}
                  {venue.otherEventPrice && (
                    <div className="flex items-center justify-between rounded-2xl bg-white border border-purple-100 shadow-sm px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🙏</span>
                        <div>
                          <p className="font-semibold text-gray-900">Other Events</p>
                          <p className="text-xs text-gray-400">Shradh, Corporate, etc.</p>
                        </div>
                      </div>
                      <p className="text-xl font-extrabold text-purple-700">₹{venue.otherEventPrice.toLocaleString("en-IN")}</p>
                    </div>
                  )}
                  {venue.primeDayPrice && (
                    <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-sm px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
                          <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Prime Days</p>
                          {venue.primeDays && <p className="text-xs text-amber-600">{venue.primeDays}</p>}
                        </div>
                      </div>
                      <p className="text-xl font-extrabold text-amber-800">₹{venue.primeDayPrice.toLocaleString("en-IN")}</p>
                    </div>
                  )}
                  {venue.nonPrimeDayPrice && (
                    <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 shadow-sm px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100">
                          <IndianRupee className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Regular Days</p>
                          <p className="text-xs text-gray-500">Mon – Thu, off-season</p>
                        </div>
                      </div>
                      <p className="text-xl font-extrabold text-green-800">₹{venue.nonPrimeDayPrice.toLocaleString("en-IN")}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1 pl-1">* Prices are approximate. Confirm with the venue directly.</p>
                </div>
              </div>
            )}

            {/* Location Section */}
            {(venue.latitude || venue.googleMapsUrl) && (
              <div ref={locationRef} className="scroll-mt-20">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Location</h2>
                {venue.address && (
                  <p className="flex items-start gap-1.5 text-sm text-gray-500 mb-4">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-purple-500" />
                    {venue.address}
                  </p>
                )}
                <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                  <MapEmbed
                    latitude={venue.latitude}
                    longitude={venue.longitude}
                    googleMapsUrl={venue.googleMapsUrl}
                    address={venue.address}
                    name={venue.name}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Booking Card ───────────────────────────────── */}
          <div className="lg:col-span-1">
            <div ref={bookingCardRef} className="sticky top-[72px] scroll-mt-20">
              <div className="rounded-3xl bg-white border border-gray-200 shadow-xl overflow-hidden">
                {/* Card header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-5">
                  {isFishbowl ? (
                    <div>
                      <p className="text-purple-100 text-xs font-medium uppercase tracking-wider mb-1">Starting from</p>
                      {venue.estimatedMinPrice ? (
                        <p className="text-3xl font-extrabold text-white">
                          ₹{venue.estimatedMinPrice.toLocaleString("en-IN")}
                          {venue.estimatedMaxPrice && venue.estimatedMaxPrice !== venue.estimatedMinPrice && (
                            <span className="text-lg font-semibold"> – ₹{venue.estimatedMaxPrice.toLocaleString("en-IN")}</span>
                          )}
                        </p>
                      ) : (
                        <p className="text-3xl font-extrabold text-white">₹{(venue.price || 0).toLocaleString("en-IN")}</p>
                      )}
                      <p className="text-purple-200 text-xs mt-1">per event · call to confirm</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-purple-100 text-xs font-medium uppercase tracking-wider mb-1">Price</p>
                      <p className="text-3xl font-extrabold text-white">₹{displayPrice.toLocaleString("en-IN")}</p>
                      <p className="text-purple-200 text-xs mt-1">per event</p>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {isFishbowl ? (
                    /* ── Fishbowl booking ─────────────────────────── */
                    <div className="space-y-4">
                      {/* Contact card */}
                      <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Contact for booking</p>
                        {venue.contactName && (
                          <p className="font-semibold text-gray-900 mb-1">{venue.contactName}</p>
                        )}
                        {venue.contactNumber && (
                          <a
                            href={`tel:${venue.contactNumber}`}
                            className="flex items-center gap-2 text-base font-bold text-purple-700 hover:text-purple-900"
                          >
                            <Phone className="h-4 w-4" />
                            {venue.contactNumber}
                          </a>
                        )}
                      </div>

                      {/* Call CTA */}
                      {venue.contactNumber && (
                        <a
                          href={`tel:${venue.contactNumber}`}
                          className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 py-3.5 font-bold text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                        >
                          <Phone className="h-5 w-5" />
                          Call to Book
                        </a>
                      )}

                      {/* WhatsApp CTA */}
                      {venue.contactNumber && (
                        <a
                          href={`https://wa.me/91${venue.contactNumber.replace(/\D/g, "")}?text=Hi, I'm interested in booking ${venue.name} for my event.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] py-3.5 font-bold text-white shadow hover:shadow-md hover:scale-[1.02] transition-all"
                        >
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          WhatsApp Inquiry
                        </a>
                      )}

                      <p className="text-center text-xs text-gray-400">
                        Online booking coming soon ·{" "}
                        <span className="text-green-600 font-medium">● Available now</span>
                      </p>
                    </div>
                  ) : (
                    /* ── Online booking form ──────────────────────── */
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Date</label>
                        <input
                          type="date"
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-purple-500 outline-none transition-colors"
                        />
                        {bookingDate && isDateBooked(bookingDate) && (
                          <p className="mt-1.5 text-xs text-red-600 font-medium">⚠️ This date is already booked</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Number of Guests
                        </label>
                        <input
                          type="number"
                          value={guests}
                          onChange={(e) => setGuests(e.target.value)}
                          placeholder={`Up to ${venue.capacity}`}
                          max={venue.capacity}
                          className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-purple-500 outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Special Requests</label>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Any special requirements..."
                          rows={3}
                          className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-purple-500 outline-none resize-none transition-colors"
                        />
                      </div>

                      <button
                        onClick={handleBooking}
                        disabled={!bookingDate || !guests || isDateBooked(bookingDate) || bookingLoading}
                        className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 py-4 font-bold text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                      >
                        {bookingLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Creating booking…
                          </>
                        ) : (
                          "Book Now"
                        )}
                      </button>

                      {bookingDate && guests && !isDateBooked(bookingDate) && (
                        <div className="rounded-xl bg-gray-50 p-4 space-y-1.5 text-sm">
                          <div className="flex justify-between text-gray-600">
                            <span>₹{displayPrice.toLocaleString("en-IN")} × 1 event</span>
                            <span>₹{displayPrice.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex justify-between font-bold text-gray-900 pt-1.5 border-t border-gray-200">
                            <span>Total</span>
                            <span>₹{displayPrice.toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Save & Share */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleWishlistToggle}
                      disabled={wishlistLoading}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                        isInWishlist
                          ? "border-rose-400 bg-rose-50 text-rose-600"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isInWishlist ? "fill-rose-500 text-rose-500" : ""}`} />
                      {isInWishlist ? "Saved" : "Save"}
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border-2 border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <Share2 className="h-4 w-4" /> Share
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile sticky bar ────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center gap-3 shadow-2xl">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500">Starting from</p>
          <p className="text-lg font-extrabold text-gray-900 leading-none">
            ₹{(venue.estimatedMinPrice || venue.price || 0).toLocaleString("en-IN")}
          </p>
        </div>
        <button
          onClick={() => scrollTo(bookingCardRef)}
          className="rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-bold text-white shadow-lg"
        >
          {isFishbowl ? "Contact" : "Book Now"}
        </button>
      </div>
    </>
  );
}
