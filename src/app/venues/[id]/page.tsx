"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api-client";
import { 
  MapPin, Users, Star, CheckCircle2, Calendar, 
  Clock, Heart, Share2, ArrowLeft, Loader2, AlertCircle,
  Wifi, Car, Music, Utensils, X, Phone, Eye, IndianRupee
} from "lucide-react";

type Venue = {
  id: string;
  slug: string;
  name: string;
  city: string;
  area?: string;
  location: string;
  address?: string;
  capacity: number;
  minGuests?: number;
  maxGuests?: number;
  price: number;
  exactPrice?: number;
  estimatedMinPrice?: number;
  estimatedMaxPrice?: number;
  primeDayPrice?: number;
  nonPrimeDayPrice?: number;
  primeDays?: string;
  isVerified: boolean;
  bookingEnabled?: boolean;
  isAdminListed?: boolean;
  contactNumber?: string;
  contactName?: string;
  description: string;
  images: string[];
  amenities: string[];
  viewCount?: number;
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

export default function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: venueSlug } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [guests, setGuests] = useState("");
  const [message, setMessage] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchVenue();
  }, [venueSlug]);

  // Track view when venue is loaded
  const trackView = async (venueId: string) => {
    try {
      await fetch(`/api/venues/${venueId}/views`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to track view:', error);
    }
  };

  const fetchVenue = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await api.getVenue(venueSlug);
      if (err) {
        setError(err);
      } else {
        const rawVenue = (data as any)?.venue;
        if (rawVenue) {
          // Transform API data to match component expectations
          const transformedVenue = {
            ...rawVenue,
            location: rawVenue.area || rawVenue.city || '',
            capacity: rawVenue.maxGuests || 0,
            price: rawVenue.exactPrice || rawVenue.estimatedMinPrice || 0,
            images: typeof rawVenue.images === 'string' 
              ? (rawVenue.images ? rawVenue.images.split(',').filter(Boolean) : []) 
              : (rawVenue.images || []),
            amenities: typeof rawVenue.amenities === 'string' 
              ? (rawVenue.amenities ? rawVenue.amenities.split(',').map((a: string) => a.trim()).filter(Boolean) : []) 
              : (rawVenue.amenities || []),
          };
          setVenue(transformedVenue);
          // Track view after successful fetch
          trackView(rawVenue.id);
        } else {
          setVenue(null);
        }
        setSelectedImage(0);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load venue");
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!session?.user) {
      router.push("/auth/signin");
      return;
    }

    if (!bookingDate || !guests) {
      alert("Please fill in all fields");
      return;
    }

    // Check if date is already booked
    const selectedDate = new Date(bookingDate);
    const isBooked = venue?.bookings?.some(
      b => b.status !== "CANCELLED" && new Date(b.eventDate).toDateString() === selectedDate.toDateString()
    );

    if (isBooked) {
      alert("This date is already booked. Please choose another date.");
      return;
    }

    setBookingLoading(true);
    try {
      const bookingData = {
        type: "VENUE",
        venueId: venue?.id,
        eventDate: bookingDate,
        guestCount: parseInt(guests),
        customerName: session.user.name || "Guest",
        customerEmail: session.user.email || "",
        customerPhone: "N/A",
        specialRequests: message,
        totalAmount: venue?.price || 0,
      };

      const { data, error: err } = await api.createBooking(bookingData);
      
      if (err) {
        alert(`Booking failed: ${err}`);
      } else {
        alert("Booking created successfully! Check your bookings page.");
        setShowBookingModal(false);
        router.push("/bookings");
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setBookingLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
          <p className="text-gray-600">Loading venue details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !venue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="glass-card rounded-3xl p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{error || "Venue not found"}</h2>
          <button
            onClick={() => router.push("/venues")}
            className="mt-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2 font-semibold text-white"
          >
            Back to Venues
          </button>
        </div>
      </div>
    );
  }

  const isDateBooked = (date: string) => {
    const selectedDate = new Date(date);
    return venue.bookings?.some(
      b => b.status !== "CANCELLED" && new Date(b.eventDate).toDateString() === selectedDate.toDateString()
    ) || false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-24 pt-8">
      <div className="mx-auto max-w-7xl px-4">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Venues
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
                  src={venue.images[selectedImage] || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800"}
                  alt={venue.name}
                  className="h-full w-full object-cover"
                />
                {venue.isVerified && (
                  <div className="absolute top-4 right-4 rounded-full bg-white px-4 py-2 shadow-lg">
                    <CheckCircle2 className="inline h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm font-semibold text-green-600">Verified</span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {venue.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {venue.images.map((img, idx) => (
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

            {/* Venue Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-3xl p-8"
            >
              <div className="mb-6">
                <h1 className="text-4xl font-bold text-gradient mb-2">{venue.name}</h1>
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-purple-600" />
                    <span>{venue.city}</span>
                  </div>
                  {venue._count && venue._count.reviews > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">({venue._count.reviews} reviews)</span>
                    </div>
                  )}
                  {venue._count && venue._count.bookings > 0 && (
                    <span className="text-sm text-gray-500">({venue._count.bookings} bookings)</span>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">About</h3>
                <p className="text-gray-700 leading-relaxed">{venue.description}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 mb-6">
                <div className="rounded-2xl bg-white/60 p-4">
                  <Users className="h-6 w-6 text-purple-600 mb-2" />
                  <p className="text-sm text-gray-600">Capacity</p>
                  <p className="text-xl font-bold text-gray-900">Up to {venue.capacity} guests</p>
                </div>
                <div className="rounded-2xl bg-white/60 p-4">
                  <Calendar className="h-6 w-6 text-purple-600 mb-2" />
                  <p className="text-sm text-gray-600">Availability</p>
                  <p className="text-xl font-bold text-gray-900">Check calendar</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Amenities</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {venue.amenities.map((amenity, idx) => {
                    const Icon = AMENITY_ICONS[amenity] || CheckCircle2;
                    return (
                      <div key={idx} className="flex items-center gap-3 rounded-xl bg-white/60 p-3">
                        <Icon className="h-5 w-5 text-purple-600" />
                        <span className="font-medium">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">Hosted by</p>
                <p className="text-lg font-semibold text-gray-900">{venue.owner?.name || "Venue Owner"}</p>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-3xl p-6 sticky top-8"
            >
              {/* View Counter */}
              {venue.viewCount !== undefined && venue.viewCount > 0 && (
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                  <Eye className="h-4 w-4" />
                  <span>{venue.viewCount.toLocaleString()} views</span>
                </div>
              )}

              {/* Fishbowl Mode - Call to Book */}
              {venue.isAdminListed && !venue.bookingEnabled ? (
                <>
                  {/* Price Display for Fishbowl */}
                  <div className="mb-6">
                    {venue.primeDayPrice || venue.nonPrimeDayPrice ? (
                      <div className="space-y-3">
                        {venue.primeDayPrice && (
                          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                            <div className="flex items-center gap-2 mb-1">
                              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                              <span className="text-sm font-medium text-amber-700">Prime Days</span>
                            </div>
                            <p className="text-2xl font-bold text-amber-800">
                              ₹{venue.primeDayPrice.toLocaleString('en-IN')}
                            </p>
                            {venue.primeDays && (
                              <p className="text-xs text-amber-600 mt-1">{venue.primeDays}</p>
                            )}
                          </div>
                        )}
                        {venue.nonPrimeDayPrice && (
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                            <div className="flex items-center gap-2 mb-1">
                              <IndianRupee className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-700">Regular Days</span>
                            </div>
                            <p className="text-2xl font-bold text-green-800">
                              ₹{venue.nonPrimeDayPrice.toLocaleString('en-IN')}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : venue.estimatedMinPrice || venue.estimatedMaxPrice ? (
                      <div>
                        <span className="text-sm text-gray-600">Estimated Price</span>
                        <p className="text-3xl font-bold text-gradient">
                          ₹{(venue.estimatedMinPrice || 0).toLocaleString('en-IN')}
                          {venue.estimatedMaxPrice && venue.estimatedMaxPrice !== venue.estimatedMinPrice && (
                            <span> - ₹{venue.estimatedMaxPrice.toLocaleString('en-IN')}</span>
                          )}
                        </p>
                        <span className="text-sm text-gray-500">*Approximate pricing</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-sm text-gray-600">Starting from</span>
                        <p className="text-4xl font-bold text-gradient">₹{(venue.price || 0).toLocaleString('en-IN')}</p>
                        <span className="text-sm text-gray-600">per event</span>
                      </div>
                    )}
                  </div>

                  {/* Contact Info Card */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 mb-6 border border-purple-100">
                    <p className="text-sm text-gray-600 mb-3">For bookings & inquiries, contact:</p>
                    {venue.contactName && (
                      <p className="font-semibold text-gray-900 mb-2">{venue.contactName}</p>
                    )}
                    {venue.contactNumber && (
                      <a 
                        href={`tel:${venue.contactNumber}`}
                        className="flex items-center gap-3 text-lg font-bold text-purple-700 hover:text-purple-800"
                      >
                        <Phone className="h-5 w-5" />
                        {venue.contactNumber}
                      </a>
                    )}
                  </div>

                  {/* Call to Book Button */}
                  {venue.contactNumber && (
                    <a
                      href={`tel:${venue.contactNumber}`}
                      className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 py-4 font-bold text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
                    >
                      <Phone className="h-5 w-5" />
                      <span>Call to Book</span>
                    </a>
                  )}

                  {/* WhatsApp Button */}
                  {venue.contactNumber && (
                    <a
                      href={`https://wa.me/91${venue.contactNumber.replace(/\D/g, '')}?text=Hi, I'm interested in booking ${venue.name} for my event.`}
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
                </>
              ) : (
                /* Online Booking Mode - Verified Venue */
                <>
                  <div className="mb-6">
                    <span className="text-sm text-gray-600">Starting from</span>
                    <p className="text-4xl font-bold text-gradient">₹{(venue.exactPrice || venue.price || 0).toLocaleString('en-IN')}</p>
                    <span className="text-sm text-gray-600">per event</span>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">Select Date</label>
                      <input
                        type="date"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-purple-600 outline-none"
                      />
                      {bookingDate && isDateBooked(bookingDate) && (
                        <p className="mt-2 text-sm text-red-600">⚠️ This date is already booked</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">Number of Guests</label>
                      <input
                        type="number"
                        value={guests}
                        onChange={(e) => setGuests(e.target.value)}
                        placeholder="Enter guest count"
                        max={venue.capacity}
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-purple-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">Special Requests</label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Any special requirements..."
                        rows={3}
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-purple-600 outline-none resize-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleBooking}
                    disabled={!bookingDate || !guests || isDateBooked(bookingDate) || bookingLoading}
                    className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-4 font-bold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {bookingLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Creating booking...</span>
                      </>
                    ) : (
                      <span>Book Now</span>
                    )}
                  </button>

                  <div className="mt-6 pt-6 border-t border-gray-200 space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>₹{(venue.exactPrice || venue.price || 0).toLocaleString('en-IN')} × 1 event</span>
                      <span>₹{(venue.exactPrice || venue.price || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t">
                      <span>Total</span>
                      <span>₹{(venue.exactPrice || venue.price || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </>
              )}

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
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
