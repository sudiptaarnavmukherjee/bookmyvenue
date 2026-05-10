"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api-client";
import { 
  MapPin, Star, Leaf, ArrowLeft, Heart, Share2,
  Check, Users, Loader2, Phone, Eye,
  ChevronDown, ChevronUp, Drumstick, Sparkles, X, UtensilsCrossed
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
  const [bookingDate, setBookingDate] = useState("");
  const [guests, setGuests] = useState("");
  const [message, setMessage] = useState("");
  // Menu modal for tier pricing cards
  const [menuModal, setMenuModal] = useState<{ tier: "SILVER" | "GOLD" | "PLATINUM"; label: string; gradient: string } | null>(null);

  const menuModalPkg = menuModal
    ? caterer.menuPackages.find((p) => p.tier === menuModal.tier) ?? null
    : null;

  // Track view on mount
  useState(() => {
    fetch(`/api/catering/${caterer.id}/views`, { method: 'POST' }).catch(() => {});
  });

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-24 pt-8">
      <div className="mx-auto max-w-7xl px-4">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Catering
        </button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <div className="glass-card rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="relative h-96">
                <img
                  src={caterer.images[selectedImage] || "https://images.unsplash.com/photo-1555244162-803834f70033?w=800"}
                  alt={caterer.name}
                  className="h-full w-full object-cover"
                />
                {caterer.isPureVeg && (
                  <div className="absolute top-4 right-4 rounded-full bg-green-600 px-4 py-2 shadow-lg">
                    <Leaf className="inline h-5 w-5 text-white mr-2" />
                    <span className="text-sm font-semibold text-white">Pure Veg</span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {caterer.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {caterer.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 h-20 w-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === idx ? "border-purple-600" : "border-transparent"
                      }`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Caterer Info */}
            <div className="glass-card rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-300 delay-100">
              <div className="mb-6">
                <h1 className="text-4xl font-bold text-gradient mb-2">{caterer.name}</h1>
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-purple-600" />
                    <span>{caterer.city}</span>
                  </div>
                  {caterer.reviewCount !== undefined && caterer.reviewCount > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">({caterer.reviewCount} reviews)</span>
                    </div>
                  )}
                  {caterer.bookingCount !== undefined && caterer.bookingCount > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span className="text-sm">{caterer.bookingCount} bookings</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">About</h3>
                <p className="text-gray-700 leading-relaxed">{caterer.description}</p>
              </div>

              <div className="mb-6 rounded-2xl bg-white/60 p-4">
                <Users className="h-6 w-6 text-purple-600 mb-2" />
                <p className="text-sm text-gray-600">Minimum Guests</p>
                <p className="text-xl font-bold text-gray-900">{caterer.minGuests} guests</p>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">Catered by</p>
                <p className="text-lg font-semibold text-gray-900">{caterer.ownerName || "Caterer Owner"}</p>
              </div>

              {/* Map */}
              {(caterer.latitude || caterer.googleMapsUrl) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Location</h3>
                  <MapEmbed
                    latitude={caterer.latitude}
                    longitude={caterer.longitude}
                    googleMapsUrl={caterer.googleMapsUrl}
                    address={caterer.address}
                    name={caterer.name}
                  />
                </div>
              )}
            </div>

            {/* Menu Packages */}
            <div className="glass-card rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-300 delay-200">
              <h2 className="text-2xl font-bold text-gradient mb-6">Menu Packages</h2>
              {caterer.menuPackages.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {caterer.menuPackages.map((pkg) => {
                    const variantInfo = pkg.variant ? VARIANT_LABELS[pkg.variant] : null;
                    return (
                      <button
                        key={pkg.id}
                        onClick={() => setSelectedPackage(pkg)}
                        className={`text-left rounded-2xl p-6 transition-all ${
                          selectedPackage?.id === pkg.id
                            ? "ring-2 ring-purple-600 bg-white shadow-xl"
                            : "bg-white/60 hover:bg-white/80"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <div className={`inline-block rounded-full bg-gradient-to-r ${TIER_COLORS[pkg.tier]} px-4 py-1.5`}>
                            <span className="text-sm font-bold text-white">{pkg.name || pkg.tier}</span>
                          </div>
                          {variantInfo && (
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${variantInfo.color}`}>
                              {variantInfo.icon} {variantInfo.label}
                            </span>
                          )}
                        </div>
                        <p className="text-3xl font-bold text-gradient mb-2">
                          ₹{pkg.pricePerPlate}/plate
                        </p>
                        {pkg.description && (
                          <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
                        )}
                        <MenuItemList items={pkg.items} />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500">No menu packages available</p>
              )}
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-3xl p-6 sticky top-8 animate-in fade-in slide-in-from-bottom-4 duration-300 delay-300">
              {/* View Counter */}
              {caterer.viewCount !== undefined && caterer.viewCount > 0 && (
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                  <Eye className="h-4 w-4" />
                  <span>{caterer.viewCount.toLocaleString()} views</span>
                </div>
              )}

              {/* Fishbowl Mode - Call to Book */}
              {caterer.isAdminListed && !caterer.bookingEnabled ? (
                <>
                  {/* Tier Pricing Display */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Package Pricing</h3>
                    <div className="space-y-3">
                      {caterer.silverPrice && (
                        <button
                          onClick={() => setMenuModal({ tier: "SILVER", label: "Silver", gradient: "from-gray-400 to-gray-600" })}
                          className="w-full flex items-center justify-between bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all text-left group"
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">S</span>
                            </div>
                            <span className="font-medium text-gray-700">Silver</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-gray-800">₹{caterer.silverPrice}/plate</span>
                            <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">View menu →</span>
                          </div>
                        </button>
                      )}
                      {caterer.goldPrice && (
                        <button
                          onClick={() => setMenuModal({ tier: "GOLD", label: "Gold", gradient: "from-yellow-400 to-yellow-600" })}
                          className="w-full flex items-center justify-between bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200 hover:border-amber-400 hover:shadow-md transition-all text-left group"
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">G</span>
                            </div>
                            <span className="font-medium text-amber-700">Gold</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-amber-800">₹{caterer.goldPrice}/plate</span>
                            <span className="text-xs text-amber-400 group-hover:text-amber-600 transition-colors">View menu →</span>
                          </div>
                        </button>
                      )}
                      {caterer.platinumPrice && (
                        <button
                          onClick={() => setMenuModal({ tier: "PLATINUM", label: "Platinum", gradient: "from-purple-500 to-pink-600" })}
                          className="w-full flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all text-left group"
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">P</span>
                            </div>
                            <span className="font-medium text-purple-700">Platinum</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-purple-800">₹{caterer.platinumPrice}/plate</span>
                            <span className="text-xs text-purple-400 group-hover:text-purple-600 transition-colors">View menu →</span>
                          </div>
                        </button>
                      )}
                      {!caterer.silverPrice && !caterer.goldPrice && !caterer.platinumPrice && (
                        <div className="text-center py-4">
                          <p className="text-3xl font-bold text-gradient">₹{caterer.pricePerPlate}/plate</p>
                          <span className="text-sm text-gray-500">Starting price</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Guest Info */}
                  <div className="mb-6 rounded-2xl bg-white/60 p-4">
                    <Users className="h-6 w-6 text-purple-600 mb-2" />
                    <p className="text-sm text-gray-600">Minimum Order</p>
                    <p className="text-xl font-bold text-gray-900">{caterer.minGuests} guests</p>
                  </div>

                  {/* Contact Info Card */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 mb-6 border border-purple-100">
                    <p className="text-sm text-gray-600 mb-3">For bookings & menu details, contact:</p>
                    {caterer.contactName && (
                      <p className="font-semibold text-gray-900 mb-2">{caterer.contactName}</p>
                    )}
                    {caterer.contactNumber && (
                      <a 
                        href={`tel:${caterer.contactNumber}`}
                        className="flex items-center gap-3 text-lg font-bold text-purple-700 hover:text-purple-800"
                      >
                        <Phone className="h-5 w-5" />
                        {caterer.contactNumber}
                      </a>
                    )}
                  </div>

                  {/* Call to Book Button */}
                  {caterer.contactNumber && (
                    <a
                      href={`tel:${caterer.contactNumber}`}
                      className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 py-4 font-bold text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
                    >
                      <Phone className="h-5 w-5" />
                      <span>Call for Menu & Booking</span>
                    </a>
                  )}

                  {/* WhatsApp Button */}
                  {caterer.contactNumber && (
                    <a
                      href={`https://wa.me/91${caterer.contactNumber.replace(/\D/g, '')}?text=Hi, I'm interested in catering services from ${caterer.name} for my event.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 w-full rounded-xl bg-gradient-to-r from-green-600 to-green-700 py-4 font-bold text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      <span>WhatsApp Inquiry</span>
                    </a>
                  )}

                  <p className="text-center text-sm text-gray-500 mt-4">
                    💡 Online booking coming soon!
                  </p>

                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 rounded-xl border-2 border-gray-200 py-3 flex items-center justify-center gap-2 hover:bg-white/60 transition-colors">
                      <Heart className="h-5 w-5" />
                      Save
                    </button>
                    <button className="flex-1 rounded-xl border-2 border-gray-200 py-3 flex items-center justify-center gap-2 hover:bg-white/60 transition-colors">
                      <Share2 className="h-5 w-5" />
                      Share
                    </button>
                  </div>
                </>
              ) : (
                /* Online Booking Mode */
                <>
                  {selectedPackage && (
                    <>
                      <div className="mb-6">
                        <div className={`inline-block rounded-full bg-gradient-to-r ${TIER_COLORS[selectedPackage.tier]} px-4 py-1.5 mb-3`}>
                          <span className="text-sm font-bold text-white">{selectedPackage.tier} Package</span>
                        </div>
                        <p className="text-4xl font-bold text-gradient">₹{selectedPackage.pricePerPlate}</p>
                        <span className="text-sm text-gray-600">per plate</span>
                      </div>

                      <div className="space-y-4 mb-6">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-gray-700">Event Date</label>
                          <input
                            type="date"
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-purple-600 outline-none"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-gray-700">
                            Number of Guests (min. {caterer.minGuests})
                          </label>
                          <input
                            type="number"
                            value={guests}
                            onChange={(e) => setGuests(e.target.value)}
                            placeholder="Enter guest count"
                            min={caterer.minGuests}
                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-purple-600 outline-none"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-gray-700">Special Requests</label>
                          <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Dietary restrictions, special items..."
                            rows={3}
                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-purple-600 outline-none resize-none"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleBooking}
                        disabled={!bookingDate || !guests || (parseInt(guests || "0") < caterer.minGuests) || bookingLoading}
                        className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-4 font-bold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {bookingLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Creating booking...
                          </>
                        ) : (
                          "Request Booking"
                        )}
                      </button>

                      <div className="mt-4 flex gap-2">
                        <button className="flex-1 rounded-xl border-2 border-gray-200 py-3 flex items-center justify-center gap-2 hover:bg-white/60 transition-colors">
                          <Heart className="h-5 w-5" />
                          Save
                        </button>
                        <button className="flex-1 rounded-xl border-2 border-gray-200 py-3 flex items-center justify-center gap-2 hover:bg-white/60 transition-colors">
                          <Share2 className="h-5 w-5" />
                          Share
                        </button>
                      </div>

                      {guests && parseInt(guests) >= caterer.minGuests && (
                        <div className="mt-6 pt-6 border-t border-gray-200 space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>₹{selectedPackage.pricePerPlate} × {guests} guests</span>
                            <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between font-semibold text-gray-900 text-lg pt-2 border-t">
                            <span>Total</span>
                            <span className="text-gradient">₹{totalPrice.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
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
          {/* Header */}
          <div className={`bg-gradient-to-r ${menuModal.gradient} p-6 rounded-t-3xl`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">{menuModal.label} Package</h3>
                {menuModalPkg && (
                  <p className="text-white/80 text-sm mt-1">{menuModalPkg.name}</p>
                )}
              </div>
              <button
                onClick={() => setMenuModal(null)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            {menuModalPkg && (
              <p className="text-3xl font-bold text-white mt-3">
                ₹{menuModalPkg.pricePerPlate}/plate
              </p>
            )}
          </div>

          {/* Body */}
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
                <p className="text-gray-800 font-semibold text-lg mb-1">
                  {menuModal.label} Package Menu
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Detailed menu for this package is being updated.<br />
                  Contact us directly to know exactly what&apos;s included.
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
  </div>
  );
}
