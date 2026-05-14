"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Calendar, Users, MapPin, Heart, X, Check, Clock, Loader2, AlertCircle, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api-client";
import { PayNowButton } from "@/components/payment/PaymentComponents";

type Booking = {
  id: string;
  bookingNumber: string;
  type: "VENUE" | "CATERING";
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  eventDate: string;
  guests: number;
  totalAmount: number;
  advanceAmount?: number;
  isPaid?: boolean;
  venue?: {
    id: string;
    name: string;
    slug: string;
    city: string;
    images: string[];
  };
  caterer?: {
    id: string;
    name: string;
    slug: string;
    city: string;
    images: string[];
  };
  user?: {
    name: string;
    email: string;
  };
};

export default function MyBookingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "VENUE" | "CATERING">("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;
  const confirmedCount = bookings.filter((b) => b.status === "CONFIRMED").length;
  const completedCount = bookings.filter((b) => b.status === "COMPLETED").length;

  useEffect(() => {
    if (status === "unauthenticated") {
      setLoading(false);
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      loadBookings();
    }
  }, [status, router]);

  const loadBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await api.getBookings();
      if (err) {
        setError(err);
      } else {
        // Transform bookings data to handle comma-separated images
        const rawBookings = (data as any)?.bookings || [];
        const transformedBookings = rawBookings.map((b: any) => ({
          ...b,
          guests: b.guestCount || b.guests || 0,
          venue: b.venue ? {
            ...b.venue,
            images: typeof b.venue.images === 'string' 
              ? (b.venue.images ? b.venue.images.split(',').filter(Boolean) : [])
              : (b.venue.images || [])
          } : null,
          caterer: b.caterer ? {
            ...b.caterer,
            images: typeof b.caterer.images === 'string'
              ? (b.caterer.images ? b.caterer.images.split(',').filter(Boolean) : [])
              : (b.caterer.images || [])
          } : null,
        }));
        setBookings(transformedBookings);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    
    setActionLoading(bookingId);
    try {
      const { error: err } = await api.cancelBooking(bookingId);
      if (err) {
        alert(`Failed to cancel booking: ${err}`);
      } else {
        alert("Booking cancelled successfully!");
        await loadBookings();
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmBooking = async (bookingId: string) => {
    if (!confirm("Confirm this booking?")) return;
    
    setActionLoading(bookingId);
    try {
      const { error: err } = await api.confirmBooking(bookingId);
      if (err) {
        alert(`Failed to confirm booking: ${err}`);
      } else {
        alert("Booking confirmed successfully!");
        await loadBookings();
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBookings = filter === "ALL" 
    ? bookings 
    : bookings.filter(b => b.type === filter);

  const getStatusColor = (status: Booking["status"]) => {
    switch(status) {
      case "CONFIRMED": return "bg-green-100 text-green-700";
      case "PENDING": return "bg-yellow-100 text-yellow-700";
      case "CANCELLED": return "bg-red-100 text-red-700";
      case "COMPLETED": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: Booking["status"]) => {
    switch(status) {
      case "CONFIRMED": return <Check className="h-4 w-4" />;
      case "PENDING": return <Clock className="h-4 w-4" />;
      case "CANCELLED": return <X className="h-4 w-4" />;
      case "COMPLETED": return <Check className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const user = session?.user;
  const userRole = user?.role;
  
  const getPageTitle = () => {
    if (!userRole) return "My Bookings";
    if (userRole === "VENUE_OWNER") return "My Venue Bookings";
    if (userRole === "CATERING_OWNER") return "My Catering Bookings";
    return "My Bookings";
  };
  
  const getPageSubtitle = () => {
    if (!userRole) return "Manage all your venue and catering bookings";
    if (userRole === "VENUE_OWNER") return "Track all bookings received for your venues";
    if (userRole === "CATERING_OWNER") return "Track all bookings received for your catering services";
    return "Manage all your venue and catering bookings";
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] pb-24 pt-8">
      <div className="mx-auto max-w-4xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-[#0b5fab] mb-2">{getPageTitle()}</h1>
          <p className="text-gray-600">{getPageSubtitle()}</p>

          <div className="mt-4 rounded-2xl border border-[#0b5fab]/15 bg-gradient-to-r from-[#0b5fab]/5 via-white to-emerald-50 p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded-full bg-white border border-gray-200 px-3 py-1 text-gray-700">Total: {bookings.length}</span>
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-yellow-700">Pending: {pendingCount}</span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">Confirmed: {confirmedCount}</span>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">Completed: {completedCount}</span>
            </div>
            <p className="mt-2 text-xs text-gray-600">Track status, pay advances, and manage changes from one place.</p>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {["ALL", "VENUE", "CATERING"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as typeof filter)}
              className={`rounded-full px-6 py-2.5 font-medium transition-all whitespace-nowrap ${
                filter === tab
                  ? "bg-gradient-to-r from-[#0b5fab] to-[#1f86d9] text-white shadow-lg"
                  : "bg-white border border-slate-200 shadow-sm hover:bg-white/80"
              }`}
            >
              {tab === "ALL" ? "All Bookings" : tab === "VENUE" ? "Venues" : "Catering"}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-[#0b5fab] mb-4" />
            <p className="text-gray-600">Loading bookings...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Failed to Load Bookings</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={loadBookings}
              className="rounded-xl bg-gradient-to-r from-[#0b5fab] to-[#1f86d9] px-6 py-3 font-semibold text-white shadow-lg hover:shadow-xl transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {/* Bookings List */}
        {!loading && !error && (
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white border border-slate-200 shadow-sm rounded-3xl p-12 text-center"
            >
              <Heart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No bookings yet</h3>
              <p className="text-gray-600 mb-6">Start planning your dream wedding!</p>
              <button
                onClick={() => router.push("/")}
                className="mx-auto rounded-full bg-gradient-to-r from-[#0b5fab] to-[#1f86d9] px-8 py-3 font-semibold text-white shadow-lg hover:shadow-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5fab] focus-visible:ring-offset-2"
              >
                Explore Venues & Catering
              </button>
            </motion.div>
          ) : (
            filteredBookings.map((booking, index) => {
              const name = booking.venue?.name || booking.caterer?.name || "Unknown";
              const location = booking.venue?.city || booking.caterer?.city || "Unknown";
              const venueImages = booking.venue?.images || [];
              const catererImages = booking.caterer?.images || [];
              const image = (Array.isArray(venueImages) ? venueImages[0] : null) 
                || (Array.isArray(catererImages) ? catererImages[0] : null)
                || "https://images.unsplash.com/photo-1519167758481-83f29da8c456?w=800";
              const slug = booking.venue?.slug || booking.caterer?.slug;
              const isOwner = userRole === "VENUE_OWNER" || userRole === "CATERING_OWNER";
              
              return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-slate-200 shadow-sm overflow-hidden rounded-3xl hover-lift"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative h-48 sm:h-auto sm:w-48 overflow-hidden">
                    <Image
                      src={image}
                      alt={name}
                      fill
                      sizes="(max-width: 640px) 100vw, 192px"
                      className="object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <span className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        {booking.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 p-4 sm:p-6">
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#0b5fab] uppercase tracking-wide">
                          {booking.type}
                        </span>
                        <span className="text-xs text-gray-500">{booking.bookingNumber}</span>
                      </div>
                      <h3 className="mt-1 text-xl font-bold text-gray-900">{name}</h3>
                      {isOwner && booking.user && (
                        <p className="text-sm text-gray-600">Booked by: {booking.user.name}</p>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4 text-[#0b5fab]" />
                        <span className="text-sm">{location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4 text-[#0b5fab]" />
                        <span className="text-sm">{new Date(booking.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="h-4 w-4 text-[#0b5fab]" />
                        <span className="text-sm">{booking.guests || 0} Guests</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                      <div>
                        <span className="text-sm text-gray-600">Total Amount</span>
                        <p className="text-2xl font-bold text-[#0b5fab]">₹{(booking.totalAmount || 0).toLocaleString('en-IN')}</p>
                        {booking.advanceAmount && booking.advanceAmount > 0 && (
                          <p className="text-xs text-green-600">
                            Paid: ₹{booking.advanceAmount.toLocaleString('en-IN')}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap justify-end">
                        {slug && (
                          <button 
                            onClick={() => {
                              const path = booking.type === "VENUE" ? `/venues/${slug}` : `/catering/${slug}`;
                              router.push(path);
                            }}
                            className="rounded-xl border-2 border-[#0b5fab] px-4 py-2 font-semibold text-[#0b5fab] hover:bg-[#0b5fab]/5 transition-colors"
                          >
                            View Details
                          </button>
                        )}
                        {/* Payment Button for customers */}
                        {!isOwner && booking.status !== "CANCELLED" && !booking.isPaid && (
                          <PayNowButton
                            bookingId={booking.id}
                            bookingNumber={booking.bookingNumber}
                            venueName={name}
                            totalAmount={booking.totalAmount || 0}
                            advancePaid={booking.advanceAmount || 0}
                            status={booking.status}
                            onPaymentSuccess={loadBookings}
                          />
                        )}
                        {isOwner && booking.status === "PENDING" && (
                          <button 
                            onClick={() => handleConfirmBooking(booking.id)}
                            disabled={actionLoading === booking.id}
                            className="rounded-xl bg-green-50 px-4 py-2 font-semibold text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === booking.id ? "Processing..." : "Confirm"}
                          </button>
                        )}
                        {booking.status === "PENDING" && (
                          <button 
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={actionLoading === booking.id}
                            className="rounded-xl bg-red-50 px-4 py-2 font-semibold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === booking.id ? "Processing..." : "Cancel"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )})
          )}
        </div>
        )}
      </div>
    </div>
  );
}



