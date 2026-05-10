"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api-client";
import { 
  MapPin, Star, Leaf, ArrowLeft, Heart, Share2,
  Check, Users, Loader2, Phone, Eye,
  ChevronDown, ChevronUp, Drumstick, Sparkles, X, UtensilsCrossed,
  Grid3x3, BadgeCheck, ChevronLeft, ChevronRight
} from "lucide-react";
import MapEmbed from "@/components/venue/MapEmbed";

export type MenuPackageData = {
  id: string;
  name?: string | null;
  tier: "SILVER" | "GOLD" | "DIAMOND" | "PLATINUM";
  variant?: "NON_VEG" | "VEG" | "JAIN" | null;
  pricePerPlate: number;
  itemCount?: number | null;
  items: Record<string, string[]> | string[];
  description?: string | null;
};

export type CatererData = {
  id: string;
  slug: string;
  name: string;
  city: string;
  area?: string | null;
  isPureVeg: boolean;
  description: string;
  images: string[];
  pricePerPlate: number;
  minGuests: number;
  cuisines?: string[];
  silverPrice?: number | null;
  goldPrice?: number | null;
  platinumPrice?: number | null;
  isAdminListed?: boolean;
  bookingEnabled?: boolean;
  contactNumber?: string | null;
  contactName?: string | null;
  viewCount?: number;
  menuPackages: MenuPackageData[];
  ownerName?: string | null;
  reviewCount?: number;
  bookingCount?: number;
  bookedDates?: string[];
  latitude?: number | null;
  longitude?: number | null;
  googleMapsUrl?: string | null;
  address?: string | null;
};

const TIER_COLORS = {
  SILVER: "from-gray-400 to-gray-600",
  GOLD: "from-yellow-400 to-yellow-600",
  DIAMOND: "from-blue-400 to-blue-600",
  PLATINUM: "from-purple-500 to-pink-600"
};

const VARIANT_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  NON_VEG: { label: "Non-Veg", color: "bg-red-100 text-red-700", icon: <Drumstick className="h-3 w-3" /> },
  VEG:     { label: "Veg",     color: "bg-green-100 text-green-700", icon: <Leaf className="h-3 w-3" /> },
  JAIN:    { label: "Jain",    color: "bg-amber-100 text-amber-700", icon: <Sparkles className="h-3 w-3" /> },
};

function MenuItemList({ items }: { items: Record<string, string[]> | string[] }) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  if (Array.isArray(items)) {
    return (
      <ul className="space-y-1.5 mt-3">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
            <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  // Category-grouped accordion
  const entries = Object.entries(items);
  const totalItems = entries.reduce((acc, [, dishes]) => acc + dishes.length, 0);

  return (
    <div className="mt-3 space-y-1">
      <p className="text-xs text-gray-400 mb-2">{totalItems} items across {entries.length} categories</p>
      {entries.map(([section, dishes]) => (
        <div key={section} className="border rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
            onClick={() => setOpenSection(openSection === section ? null : section)}
          >
            <span className="font-medium text-gray-700">{section}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{dishes.length}</span>
              {openSection === section ? (
                <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              )}
            </div>
          </button>
          {openSection === section && (
            <div className="px-4 py-3 bg-white flex flex-wrap gap-1.5">
              {dishes.map((dish) => (
                <span
                  key={dish}
                  className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full border border-purple-100"
                >
                  {dish}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function CateringDetailContent({ caterer }: { caterer: CatererData }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<MenuPackageData | null>(
    caterer.menuPackages[0] || null
  );
  const [selectedImage, setSelectedImage] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [guests, setGuests] = useState("");
  const [message, setMessage] = useState("");
  const [menuModal, setMenuModal] = useState<{ tier: "SILVER" | "GOLD" | "PLATINUM"; label: string; gradient: string } | null>(null);
  const [stickyNav, setStickyNav] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLDivElement>(null);
  const packagesRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const bookingCardRef = useRef<HTMLDivElement>(null);

  const menuModalPkg = menuModal
    ? caterer.menuPackages.find((p) => p.tier === menuModal.tier) ?? null
    : null;

  useEffect(() => {
    fetch(`/api/catering/${caterer.id}/views`, { method: "POST" }).catch(() => {});
  }, [caterer.id]);

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
      await navigator.share({ title: caterer.name, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const prevImage = () =>
    setSelectedImage((i) => (i - 1 + caterer.images.length) % caterer.images.length);
  const nextImage = () =>
    setSelectedImage((i) => (i + 1) % caterer.images.length);

  const handleBooking = async () => {
    if (!session?.user) {
      router.push("/auth/signin");
      return;
    }

    if (!bookingDate || !guests || !selectedPackage) {
      alert("Please fill in all fields and select a package");
      return;
    }

    const guestCount = parseInt(guests);
    if (guestCount < caterer.minGuests) {
      alert(`Minimum ${caterer.minGuests} guests required`);
      return;
    }

    const selectedDate = new Date(bookingDate).toDateString();
    const isDateBooked = caterer.bookedDates?.some(
      d => new Date(d).toDateString() === selectedDate
    );

    if (isDateBooked) {
      alert("This date is already booked. Please select another date.");
      return;
    }

    try {
      setBookingLoading(true);
      const bookingData = {
        catererId: caterer.id,
        eventDate: bookingDate,
        guests: guestCount,
        message,
        menuPackage: selectedPackage.tier,
        pricePerPlate: selectedPackage.pricePerPlate,
        type: "CATERING" as const
      };

      const { error: bookingError } = await api.createBooking(bookingData);

      if (bookingError) {
        alert(`Booking failed: ${bookingError}`);
      } else {
        const totalAmount = selectedPackage.pricePerPlate * guestCount;
        alert(`Booking request sent! Total: ₹${totalAmount.toLocaleString('en-IN')}`);
        router.push("/bookings");
      }
    } catch {
      alert("Failed to create booking. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  const totalPrice = selectedPackage && guests ? selectedPackage.pricePerPlate * parseInt(guests || "0") : 0;
  const isFishbowl = caterer.isAdminListed && !caterer.bookingEnabled;

  return (
    <>
      {/* ── Lightbox ─────────────────────────────────────────────── */}
      {showLightbox && caterer.images.length > 0 && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center">
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          {caterer.images.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button onClick={nextImage} className="absolute right-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors">
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <img src={caterer.images[selectedImage]} alt={caterer.name} className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg" />
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-sm text-white">
            {selectedImage + 1} / {caterer.images.length}
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50">
        {/* ── Breadcrumb ───────────────────────────────────────────── */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-4 pb-2">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-purple-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Catering
          </button>
        </div>

        {/* ── Hero Gallery ─────────────────────────────────────────── */}
        <div ref={heroRef} className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Main image */}
          <div
            className="relative w-full rounded-2xl overflow-hidden cursor-pointer bg-gray-100"
            style={{ aspectRatio: '16/7' }}
            onClick={() => setShowLightbox(true)}
          >
            {caterer.images.length > 0 ? (
              <img
                src={caterer.images[selectedImage]}
                alt={caterer.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Grid3x3 className="h-16 w-16 text-green-300" />
              </div>
            )}
            {caterer.images.length > 1 && (
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
                  {selectedImage + 1} / {caterer.images.length}
                </div>
              </>
            )}
          </div>
          {/* Thumbnails */}
          {caterer.images.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {caterer.images.map((img, idx) => (
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

          <div className="flex items-center justify-between mt-3 mb-1">
            <div className="flex gap-2 flex-wrap">
              {caterer.isPureVeg && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 border border-green-200">
                  <Leaf className="h-3.5 w-3.5" /> Pure Vegetarian
                </span>
              )}
              {caterer.viewCount !== undefined && caterer.viewCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
                  <Eye className="h-3.5 w-3.5" /> {caterer.viewCount.toLocaleString()} views
                </span>
              )}
            </div>
            {caterer.images.length > 1 && (
              <button
                onClick={() => setShowLightbox(true)}
                className="text-xs font-medium text-purple-700 hover:text-purple-900 underline underline-offset-2"
              >
                View all {caterer.images.length} photos
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
            <h2 className="text-base font-bold text-gray-900 truncate max-w-xs">{caterer.name}</h2>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 text-sm">
                {[
                  { label: "Overview", ref: overviewRef },
                  { label: "Packages", ref: packagesRef },
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
          {/* ── LEFT ────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-10">

            {/* Overview */}
            <div ref={overviewRef} className="scroll-mt-20">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">{caterer.name}</h1>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-gray-500 text-sm">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-purple-500" />
                      {caterer.area ? `${caterer.area}, ${caterer.city}` : caterer.city}
                    </span>
                    {caterer.reviewCount !== undefined && caterer.reviewCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium text-gray-700">{caterer.reviewCount}</span> review{caterer.reviewCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {caterer.bookingCount !== undefined && caterer.bookingCount > 0 && (
                      <span>{caterer.bookingCount} bookings</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={handleShare} className="rounded-xl border border-gray-200 p-2.5 hover:bg-gray-50 transition-colors" title="Share">
                    <Share2 className="h-5 w-5 text-gray-600" />
                  </button>
                  <button className="rounded-xl border border-gray-200 p-2.5 hover:bg-gray-50 transition-colors" title="Save">
                    <Heart className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                <div className="flex items-center gap-3 rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Min. Guests</p>
                    <p className="font-bold text-gray-900">{caterer.minGuests}+</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                    <BadgeCheck className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Packages</p>
                    <p className="font-bold text-gray-900">{caterer.menuPackages.length}</p>
                  </div>
                </div>
                {caterer.cuisines && caterer.cuisines.length > 0 && (
                  <div className="flex items-center gap-3 rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                      <UtensilsCrossed className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Cuisines</p>
                      <p className="font-bold text-gray-900 text-sm">{caterer.cuisines.slice(0, 2).join(", ")}</p>
                    </div>
                  </div>
                )}
              </div>

              <hr className="border-gray-100 mb-6" />

              {/* Catered by */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white font-bold text-lg">
                  {(caterer.ownerName || caterer.contactName || "C")[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Catered by</p>
                  <p className="font-semibold text-gray-900">{caterer.ownerName || caterer.contactName || "Caterer"}</p>
                </div>
              </div>

              {/* About */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">About</h2>
                <p className="text-gray-600 leading-relaxed">{caterer.description}</p>
              </div>
            </div>

            {/* Menu Packages */}
            {caterer.menuPackages.length > 0 && (
              <div ref={packagesRef} className="scroll-mt-20">
                <h2 className="text-xl font-bold text-gray-900 mb-5">Menu Packages</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {caterer.menuPackages.map((pkg) => {
                    const variantInfo = pkg.variant ? VARIANT_LABELS[pkg.variant] : null;
                    return (
                      <button
                        key={pkg.id}
                        onClick={() => setSelectedPackage(pkg)}
                        className={`text-left rounded-2xl border-2 p-5 transition-all hover:shadow-md ${
                          selectedPackage?.id === pkg.id
                            ? "border-purple-500 bg-purple-50 shadow-lg"
                            : "border-gray-100 bg-white shadow-sm hover:border-purple-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <div className={`inline-block rounded-full bg-gradient-to-r ${TIER_COLORS[pkg.tier]} px-3 py-1`}>
                            <span className="text-xs font-bold text-white">{pkg.name || pkg.tier}</span>
                          </div>
                          {variantInfo && (
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${variantInfo.color}`}>
                              {variantInfo.icon} {variantInfo.label}
                            </span>
                          )}
                          {selectedPackage?.id === pkg.id && (
                            <span className="ml-auto text-xs font-semibold text-purple-600">Selected ✓</span>
                          )}
                        </div>
                        <p className="text-2xl font-extrabold text-gray-900 mb-1">
                          ₹{pkg.pricePerPlate}<span className="text-sm font-medium text-gray-500">/plate</span>
                        </p>
                        {pkg.description && (
                          <p className="text-xs text-gray-500 mb-3">{pkg.description}</p>
                        )}
                        <MenuItemList items={pkg.items} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Location */}
            {(caterer.latitude || caterer.googleMapsUrl) && (
              <div ref={locationRef} className="scroll-mt-20">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Location</h2>
                {caterer.address && (
                  <p className="flex items-start gap-1.5 text-sm text-gray-500 mb-4">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-purple-500" />
                    {caterer.address}
                  </p>
                )}
                <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                  <MapEmbed
                    latitude={caterer.latitude}
                    longitude={caterer.longitude}
                    googleMapsUrl={caterer.googleMapsUrl}
                    address={caterer.address}
                    name={caterer.name}
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
                  <p className="text-purple-100 text-xs font-medium uppercase tracking-wider mb-1">Starting from</p>
                  <p className="text-3xl font-extrabold text-white">
                    ₹{caterer.pricePerPlate.toLocaleString("en-IN")}
                  </p>
                  <p className="text-purple-200 text-xs mt-1">per plate · {caterer.minGuests}+ guests min</p>
                </div>

                <div className="p-6">
                  {isFishbowl ? (
                    /* ── Fishbowl ─────────────────────────────────── */
                    <div className="space-y-4">
                      {/* Tier pricing */}
                      <div className="space-y-2">
                        {caterer.silverPrice && (
                          <button
                            onClick={() => setMenuModal({ tier: "SILVER", label: "Silver", gradient: "from-gray-400 to-gray-600" })}
                            className="w-full flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 hover:border-slate-400 hover:shadow-sm transition-all text-left group"
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">S</span>
                              </div>
                              <span className="font-medium text-gray-700 text-sm">Silver</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900">₹{caterer.silverPrice}/plate</span>
                              <span className="text-xs text-gray-400 group-hover:text-gray-600">View →</span>
                            </div>
                          </button>
                        )}
                        {caterer.goldPrice && (
                          <button
                            onClick={() => setMenuModal({ tier: "GOLD", label: "Gold", gradient: "from-yellow-400 to-yellow-600" })}
                            className="w-full flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 hover:border-amber-400 hover:shadow-sm transition-all text-left group"
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">G</span>
                              </div>
                              <span className="font-medium text-amber-700 text-sm">Gold</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-amber-900">₹{caterer.goldPrice}/plate</span>
                              <span className="text-xs text-amber-400 group-hover:text-amber-600">View →</span>
                            </div>
                          </button>
                        )}
                        {caterer.platinumPrice && (
                          <button
                            onClick={() => setMenuModal({ tier: "PLATINUM", label: "Platinum", gradient: "from-purple-500 to-pink-600" })}
                            className="w-full flex items-center justify-between rounded-xl bg-purple-50 border border-purple-200 px-4 py-3 hover:border-purple-400 hover:shadow-sm transition-all text-left group"
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">P</span>
                              </div>
                              <span className="font-medium text-purple-700 text-sm">Platinum</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-purple-900">₹{caterer.platinumPrice}/plate</span>
                              <span className="text-xs text-purple-400 group-hover:text-purple-600">View →</span>
                            </div>
                          </button>
                        )}
                      </div>

                      {/* Customize CTA */}
                      {caterer.menuPackages.length > 0 && (
                        <a
                          href={`/catering/${caterer.id}/customize`}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 py-3.5 font-bold text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-sm"
                        >
                          <UtensilsCrossed className="h-4 w-4" />
                          Customize Menu & Get Quote
                        </a>
                      )}

                      {/* Contact card */}
                      <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Contact for booking</p>
                        {caterer.contactName && (
                          <p className="font-semibold text-gray-900 mb-1">{caterer.contactName}</p>
                        )}
                        {caterer.contactNumber && (
                          <a href={`tel:${caterer.contactNumber}`} className="flex items-center gap-2 text-base font-bold text-purple-700 hover:text-purple-900">
                            <Phone className="h-4 w-4" />
                            {caterer.contactNumber}
                          </a>
                        )}
                      </div>

                      {caterer.contactNumber && (
                        <a
                          href={`tel:${caterer.contactNumber}`}
                          className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 py-3.5 font-bold text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                        >
                          <Phone className="h-5 w-5" />
                          Call for Menu & Booking
                        </a>
                      )}

                      {caterer.contactNumber && (
                        <a
                          href={`https://wa.me/91${caterer.contactNumber.replace(/\D/g, "")}?text=Hi, I'm interested in catering services from ${caterer.name} for my event.`}
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
                    /* ── Online booking ───────────────────────────── */
                    selectedPackage ? (
                      <div className="space-y-4">
                        <div className={`rounded-xl bg-gradient-to-r ${TIER_COLORS[selectedPackage.tier]} p-3 flex items-center justify-between`}>
                          <span className="text-sm font-bold text-white">{selectedPackage.name || selectedPackage.tier} Package</span>
                          <span className="text-white font-extrabold">₹{selectedPackage.pricePerPlate}/plate</span>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Event Date</label>
                          <input
                            type="date"
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-purple-500 outline-none transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Guests (min. {caterer.minGuests})
                          </label>
                          <input
                            type="number"
                            value={guests}
                            onChange={(e) => setGuests(e.target.value)}
                            placeholder={`Min ${caterer.minGuests}`}
                            min={caterer.minGuests}
                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-purple-500 outline-none transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Special Requests</label>
                          <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Dietary restrictions, special items..."
                            rows={3}
                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-purple-500 outline-none resize-none transition-colors"
                          />
                        </div>

                        {guests && parseInt(guests) >= caterer.minGuests && (
                          <div className="rounded-xl bg-gray-50 p-4 space-y-1.5 text-sm">
                            <div className="flex justify-between text-gray-600">
                              <span>₹{selectedPackage.pricePerPlate} × {guests} guests</span>
                              <span>₹{totalPrice.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between font-bold text-gray-900 pt-1.5 border-t border-gray-200">
                              <span>Total</span>
                              <span>₹{totalPrice.toLocaleString("en-IN")}</span>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={handleBooking}
                          disabled={!bookingDate || !guests || parseInt(guests || "0") < caterer.minGuests || bookingLoading}
                          className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 py-4 font-bold text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                          {bookingLoading ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              Creating booking…
                            </>
                          ) : (
                            "Request Booking"
                          )}
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">Select a package above to book</p>
                    )
                  )}

                  {/* Save & Share */}
                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border-2 border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                      <Heart className="h-4 w-4" /> Save
                    </button>
                    <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border-2 border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
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
          <p className="text-lg font-extrabold text-gray-900 leading-none">₹{caterer.pricePerPlate.toLocaleString("en-IN")}/plate</p>
        </div>
        <button
          onClick={() => scrollTo(bookingCardRef)}
          className="rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-bold text-white shadow-lg"
        >
          {isFishbowl ? "Contact" : "Book Now"}
        </button>
      </div>

      {/* ── Menu Package Modal ─────────────────────────────────────── */}
      {menuModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4"
          onClick={() => setMenuModal(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`bg-gradient-to-r ${menuModal.gradient} p-6 rounded-t-3xl`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">{menuModal.label} Package</h3>
                  {menuModalPkg && <p className="text-white/80 text-sm mt-1">{menuModalPkg.name}</p>}
                </div>
                <button onClick={() => setMenuModal(null)} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
              {menuModalPkg && (
                <p className="text-3xl font-bold text-white mt-3">₹{menuModalPkg.pricePerPlate}/plate</p>
              )}
            </div>
            <div className="p-6">
              {menuModalPkg ? (
                <>
                  {menuModalPkg.description && (
                    <p className="text-gray-600 text-sm mb-4">{menuModalPkg.description}</p>
                  )}
                  {menuModalPkg.itemCount && (
                    <p className="text-xs text-gray-400 mb-3">{menuModalPkg.itemCount} items included</p>
                  )}
                  <MenuItemList items={menuModalPkg.items} />
                </>
              ) : (
                <div className="text-center py-8">
                  <UtensilsCrossed className="h-14 w-14 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-800 font-semibold text-lg mb-1">{menuModal.label} Package Menu</p>
                  <p className="text-sm text-gray-500 mb-6">
                    Detailed menu is being updated.<br />Contact us directly to know exactly what&apos;s included.
                  </p>
                  {caterer.contactNumber && (
                    <div className="space-y-3">
                      <a
                        href={`tel:${caterer.contactNumber}`}
                        className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 py-3 font-semibold text-white shadow hover:shadow-md transition-all"
                      >
                        <Phone className="h-4 w-4" />
                        Call for Menu Details
                      </a>
                      <a
                        href={`https://wa.me/91${caterer.contactNumber.replace(/\D/g, "")}?text=Hi, I'd like to know the full menu for the ${menuModal.label} package at ${caterer.name}.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#25D366] py-3 font-semibold text-white shadow hover:shadow-md transition-all"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        WhatsApp for Menu
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
