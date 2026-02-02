"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api-client";
import { 
  MapPin, Star, Leaf, ArrowLeft, Heart, Share2,
  Check, Users, Calendar, Loader2, AlertCircle, Phone, Eye
} from "lucide-react";

type MenuPackage = {
  id: string;
  tier: "SILVER" | "GOLD" | "DIAMOND" | "PLATINUM";
  pricePerPlate: number;
  items: string[];
  description?: string;
};

type Caterer = {
  id: string;
  slug: string;
  name: string;
  city: string;
  area?: string;
  isPureVeg: boolean;
  description: string;
  images: string[];
  pricePerPlate: number;
  minGuests: number;
  maxGuests?: number;
  cuisines?: string[];
  silverPrice?: number;
  goldPrice?: number;
  platinumPrice?: number;
  isAdminListed?: boolean;
  bookingEnabled?: boolean;
  contactNumber?: string;
  contactName?: string;
  viewCount?: number;
  menuPackages?: MenuPackage[];
  owner?: {
    id: string;
    name: string;
  };
  _count?: {
    reviews: number;
    bookings: number;
  };
  bookings?: Array<{ eventDate: string; status: string; }>;
};

const TIER_COLORS = {
  SILVER: "from-gray-400 to-gray-600",
  GOLD: "from-yellow-400 to-yellow-600",
  DIAMOND: "from-blue-400 to-blue-600",
  PLATINUM: "from-purple-500 to-pink-600"
};

export default function CatererDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: catererSlug } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [caterer, setCaterer] = useState<Caterer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<MenuPackage | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [bookingDate, setBookingDate] = useState("");
  const [guests, setGuests] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCaterer();
  }, [catererSlug]);

  // Track view when caterer is loaded
  const trackView = async (catererId: string) => {
    try {
      await fetch(`/api/catering/${catererId}/views`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to track view:', error);
    }
  };

  const fetchCaterer = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await api.getCaterer(catererSlug);
      
      if (err) {
        setError(err);
      } else {
        const rawCaterer = (data as any)?.caterer || null;
        if (rawCaterer) {
          // Transform API data
          const transformedCaterer = {
            ...rawCaterer,
            pricePerPlate: rawCaterer.minPlatePrice || rawCaterer.pricePerPlate || 0,
            images: typeof rawCaterer.images === 'string'
              ? (rawCaterer.images ? rawCaterer.images.split(',').filter(Boolean) : [])
              : (rawCaterer.images || []),
            menuPackages: rawCaterer.packages || rawCaterer.menuPackages || [],
          };
          setCaterer(transformedCaterer);
          // Track view after successful fetch
          trackView(rawCaterer.id);
          if (transformedCaterer.menuPackages && transformedCaterer.menuPackages.length > 0) {
            setSelectedPackage(transformedCaterer.menuPackages[0]);
          }
        } else {
          setCaterer(null);
        }
      }
    } catch (err) {
      setError("Failed to load caterer");
    } finally {
      setLoading(false);
    }
  };

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
    if (caterer && guestCount < caterer.minGuests) {
      alert(`Minimum ${caterer.minGuests} guests required`);
      return;
    }

    // Check if date is already booked
    const selectedDate = new Date(bookingDate).toISOString();
    const isDateBooked = caterer?.bookings?.some(
      (booking) => 
        new Date(booking.eventDate).toISOString().split('T')[0] === selectedDate.split('T')[0] && 
        booking.status !== "CANCELLED"
    );

    if (isDateBooked) {
      alert("This date is already booked. Please select another date.");
      return;
    }

    try {
      setBookingLoading(true);
      const bookingData = {
        catererId: caterer?.id || "",
        eventDate: bookingDate,
        guests: guestCount,
        message,
        menuPackage: selectedPackage.tier,
        pricePerPlate: selectedPackage.pricePerPlate,
        type: "CATERING" as const
      };

      const { data, error: bookingError } = await api.createBooking(bookingData);

      if (bookingError) {
        alert(`Booking failed: ${bookingError}`);
      } else {
        const totalAmount = selectedPackage.pricePerPlate * guestCount;
        alert(`Booking request sent! Total: ₹${totalAmount.toLocaleString('en-IN')}`);
        router.push("/bookings");
      }
    } catch (err) {
      alert("Failed to create booking. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="glass-card rounded-3xl p-8 flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-gray-600">Loading caterer details...</p>
        </div>
      </div>
    );
  }

  if (error || !caterer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="glass-card rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <h2 className="text-2xl font-bold text-gradient">
              {error || "Caterer not found"}
            </h2>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/catering")}
              className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2 font-semibold text-white"
            >
              Back to Catering
            </button>
            {error && (
              <button
                onClick={fetchCaterer}
                className="rounded-full border-2 border-purple-600 px-6 py-2 font-semibold text-purple-600 hover:bg-purple-50"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-3xl overflow-hidden"
            >
              <div className="relative h-96">
                <img
                  src={caterer.images[selectedImage]}
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
            </motion.div>

            {/* Caterer Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-3xl p-8"
            >
              <div className="mb-6">
                <h1 className="text-4xl font-bold text-gradient mb-2">{caterer.name}</h1>
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-purple-600" />
                    <span>{caterer.city}</span>
                  </div>
                  {caterer._count && caterer._count.reviews > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">({caterer._count.reviews} reviews)</span>
                    </div>
                  )}
                  {caterer._count && caterer._count.bookings > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span className="text-sm">{caterer._count.bookings} bookings</span>
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
                <p className="text-lg font-semibold text-gray-900">{caterer.owner?.name || "Caterer Owner"}</p>
              </div>
            </motion.div>

            {/* Menu Packages */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-3xl p-8"
            >
              <h2 className="text-2xl font-bold text-gradient mb-6">Menu Packages</h2>
              {caterer.menuPackages && caterer.menuPackages.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {caterer.menuPackages.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`text-left rounded-2xl p-6 transition-all ${
                        selectedPackage?.id === pkg.id
                          ? "ring-2 ring-purple-600 bg-white shadow-xl"
                          : "bg-white/60 hover:bg-white/80"
                      }`}
                    >
                      <div className={`inline-block rounded-full bg-gradient-to-r ${TIER_COLORS[pkg.tier]} px-4 py-1.5 mb-3`}>
                        <span className="text-sm font-bold text-white">{pkg.tier}</span>
                      </div>
                      <p className="text-3xl font-bold text-gradient mb-4">
                        ₹{pkg.pricePerPlate}/plate
                      </p>
                      {pkg.description && (
                        <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
                      )}
                      <ul className="space-y-2">
                        {pkg.items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No menu packages available</p>
              )}
            </motion.div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-3xl p-6 sticky top-8"
            >
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
                  {/* Tier Pricing Display for Fishbowl */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Package Pricing</h3>
                    <div className="space-y-3">
                      {caterer.silverPrice && (
                        <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">S</span>
                            </div>
                            <span className="font-medium text-gray-700">Silver</span>
                          </div>
                          <span className="text-xl font-bold text-gray-800">₹{caterer.silverPrice}/plate</span>
                        </div>
                      )}
                      {caterer.goldPrice && (
                        <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">G</span>
                            </div>
                            <span className="font-medium text-amber-700">Gold</span>
                          </div>
                          <span className="text-xl font-bold text-amber-800">₹{caterer.goldPrice}/plate</span>
                        </div>
                      )}
                      {caterer.platinumPrice && (
                        <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">P</span>
                            </div>
                            <span className="font-medium text-purple-700">Platinum</span>
                          </div>
                          <span className="text-xl font-bold text-purple-800">₹{caterer.platinumPrice}/plate</span>
                        </div>
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
                    {caterer.maxGuests && (
                      <p className="text-sm text-gray-500">Max: {caterer.maxGuests} guests</p>
                    )}
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
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
