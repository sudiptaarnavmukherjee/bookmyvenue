"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api-client";
import AvailabilityCalendar from "@/components/calendar/AvailabilityCalendar";
import BlockDateModal from "@/components/calendar/BlockDateModal";
import { 
  Calendar, 
  CheckCircle2,
  Clock,
  Users,
  IndianRupee,
  Mail,
  Phone,
  Loader2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  CalendarCheck
} from "lucide-react";

type Booking = {
  id: string;
  eventDate: string;
  guests: number;
  message: string;
  status: string;
  totalAmount: number;
  bookingNumber: string;
  user: {
    name: string;
    email: string;
    phone?: string;
  };
  venue?: {
    name: string;
    city: string;
  };
};

export default function VenueOwnerDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [ownerVenueId, setOwnerVenueId] = useState<string | null>(null);
  
  // Block date modal state
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedBlockedDate, setSelectedBlockedDate] = useState<any>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await api.getBookings();
      
      if (err) {
        setError(err);
        return;
      }
      
      const venueBookings = (data || []).filter(b => b.type === "VENUE");
      setBookings(venueBookings);
      
      // Get owner's venue ID from first booking
      if (venueBookings.length > 0 && venueBookings[0].venue?.id) {
        setOwnerVenueId(venueBookings[0].venue.id);
      }
    } catch (err) {
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status === "authenticated") {
      if (session?.user?.role !== "VENUE_OWNER") {
        router.push("/");
        return;
      }
      fetchBookings();
    }
  }, [status, session, router]);
  
  const handleDateClick = (date: Date, blockedDate?: any) => {
    setSelectedDate(date);
    setSelectedBlockedDate(blockedDate || null);
    setBlockModalOpen(true);
  };
  
  const handleBlockSuccess = () => {
    // Refresh to update calendar
    fetchBookings();
  };

  const handleConfirm = async (id: string) => {
    try {
      setActionLoading(id);
      const { error: err } = await api.confirmBooking(id);
      
      if (err) {
        alert(`Failed to confirm: ${err}`);
      } else {
        alert("Booking confirmed successfully!");
        fetchBookings();
      }
    } catch (err) {
      alert("Failed to confirm booking");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    
    try {
      setActionLoading(id);
      const { error: err } = await api.cancelBooking(id);
      
      if (err) {
        alert(`Failed to cancel: ${err}`);
      } else {
        alert("Booking cancelled successfully!");
        fetchBookings();
      }
    } catch (err) {
      alert("Failed to cancel booking");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="glass-card rounded-3xl p-8 flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="glass-card rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <h2 className="text-2xl font-bold text-gradient">{error}</h2>
          </div>
          <button
            onClick={fetchBookings}
            className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2 font-semibold text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate analytics
  const pendingBookings = bookings.filter(b => b.status === "PENDING");
  const confirmedBookings = bookings.filter(b => b.status === "CONFIRMED");
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const upcomingBookings = bookings.filter(b => 
    new Date(b.eventDate) > new Date() && b.status !== "CANCELLED"
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-24 pt-8">
      <div className="mx-auto max-w-7xl px-4">
        <h1 className="text-4xl font-bold text-gradient mb-8">Venue Owner Dashboard</h1>

        {/* Analytics Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-6 w-6 text-orange-600" />
              <p className="text-sm text-gray-600">Pending</p>
            </div>
            <p className="text-3xl font-bold text-gradient">{pendingBookings.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <p className="text-sm text-gray-600">Confirmed</p>
            </div>
            <p className="text-3xl font-bold text-gradient">{confirmedBookings.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="h-6 w-6 text-purple-600" />
              <p className="text-sm text-gray-600">Upcoming</p>
            </div>
            <p className="text-3xl font-bold text-gradient">{upcomingBookings.length}</p>
          </motion.div>

          <mCalendar Section */}
        {ownerVenueId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <AvailabilityCalendar
              venueId={ownerVenueId}
              bookings={bookings.map(b => ({
                id: b.id,
                bookingNumber: b.bookingNumber,
                customerName: b.user.name,
                customerPhone: b.user.phone || '',
                eventDate: b.eventDate,
                guestCount: b.guests,
                status: b.status,
                totalAmount: b.totalAmount
              }))}
              onDateClick={handleDateClick}
            />
          </motion.div>
        )}

        {/* Block Date Modal */}
        <BlockDateModal
          isOpen={blockModalOpen}
          onClose={() => {
            setBlockModalOpen(false);
            setSelectedDate(null);
            setSelectedBlockedDate(null);
          }}
          date={selectedDate}
          venueId={ownerVenueId || undefined}
          isBlocked={!!selectedBlockedDate}
          blockedDateId={selectedBlockedDate?.id}
          isOnlineBooking={selectedBlockedDate?.isOnlineBooking}
          onSuccess={handleBlockSuccess}
        />

        {/* Bookings List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-3xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <CalendarCheck className="h-6 w-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gradient">Recent Bookings</h2>
          </div
              <p className="text-sm text-gray-600">Revenue</p>
            </div>
            <p className="text-3xl font-bold text-gradient">
              ₹{(totalRevenue / 100000).toFixed(2)}L
            </p>
          </motion.div>
        </div>

        {/* Bookings List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-3xl p-8"
        >
          <h2 className="text-2xl font-bold text-gradient mb-6">Recent Bookings</h2>

          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No bookings yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-2xl bg-white/60 p-6 hover:bg-white/80 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {booking.venue?.name || "Venue Booking"}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.status === "CONFIRMED"
                              ? "bg-green-100 text-green-700"
                              : booking.status === "PENDING"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {booking.status}
                        </span>
                        <span className="text-sm text-gray-500">#{booking.bookingNumber}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{booking.user.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{booking.user.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(booking.eventDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{booking.guests} guests</span>
                        </div>
                      </div>

                      {booking.message && (
                        <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                          <p className="text-sm text-gray-700">{booking.message}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <p className="text-2xl font-bold text-gradient">
                        ₹{booking.totalAmount?.toLocaleString('en-IN') || 0}
                      </p>
                      
                      {booking.status === "PENDING" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConfirm(booking.id)}
                            disabled={actionLoading === booking.id}
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            {actionLoading === booking.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                            Confirm
                          </button>
                          <button
                            onClick={() => handleCancel(booking.id)}
                            disabled={actionLoading === booking.id}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
