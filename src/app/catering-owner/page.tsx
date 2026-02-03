"use client";

import { useState, useEffect } from "react";
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
  Loader2,
  AlertCircle,
  UtensilsCrossed,
  CalendarCheck,
  CalendarDays,
  Phone
} from "lucide-react";

type Caterer = {
  id: string;
  name: string;
  city: string;
  area: string;
};

type Booking = {
  id: string;
  eventDate: string;
  guests: number;
  message: string;
  status: string;
  totalAmount: number;
  bookingNumber: string;
  menuPackage: string;
  pricePerPlate: number;
  user: {
    name: string;
    email: string;
    phone?: string;
  };
  caterer?: Caterer;
};

export default function CateringOwnerDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [caterers, setCaterers] = useState<Caterer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"bookings" | "calendar">("bookings");
  const [selectedCatererId, setSelectedCatererId] = useState<string | null>(null);
  
  // Block date modal state
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedBlockedDate, setSelectedBlockedDate] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status === "authenticated") {
      if (session?.user?.role !== "CATERING_OWNER") {
        router.push("/");
        return;
      }
      fetchData();
    }
  }, [status, session, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await api.getBookings();
      
      if (err) {
        setError(err);
      } else {
        const allBookings = (data as any)?.bookings || [];
        const cateringBookings = allBookings.filter((b: any) => b.type === "CATERING");
        setBookings(cateringBookings);
        
        // Extract unique caterers from bookings
        const uniqueCaterers: Caterer[] = [];
        cateringBookings.forEach((b: Booking) => {
          if (b.caterer && !uniqueCaterers.find(c => c.id === b.caterer?.id)) {
            uniqueCaterers.push(b.caterer);
          }
        });
        setCaterers(uniqueCaterers);
        
        if (uniqueCaterers.length > 0 && !selectedCatererId) {
          setSelectedCatererId(uniqueCaterers[0].id);
        }
      }
    } catch (err) {
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };
  
  const handleDateClick = (date: Date, blockedDate?: any) => {
    setSelectedDate(date);
    setSelectedBlockedDate(blockedDate || null);
    setBlockModalOpen(true);
  };
  
  const handleBlockSuccess = () => {
    fetchData();
  };

  const handleConfirm = async (id: string) => {
    try {
      setActionLoading(id);
      const { error: err } = await api.confirmBooking(id);
      
      if (err) {
        alert(`Failed to confirm: ${err}`);
      } else {
        alert("Booking confirmed!");
        fetchData();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this booking?")) return;
    
    try {
      setActionLoading(id);
      const { error: err } = await api.cancelBooking(id);
      
      if (err) {
        alert(`Failed: ${err}`);
      } else {
        alert("Booking cancelled!");
        fetchData();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const pendingBookings = bookings.filter(b => b.status === "PENDING");
  const confirmedBookings = bookings.filter(b => b.status === "CONFIRMED");
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalGuests = confirmedBookings.reduce((sum, b) => sum + (b.guests || 0), 0);

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900">{error}</h2>
          </div>
          <button
            onClick={fetchData}
            className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white hover:opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Catering Owner Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome, {session?.user?.name}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{pendingBookings.length}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">Confirmed</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{confirmedBookings.length}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-sm text-gray-600">Total Guests</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalGuests.toLocaleString('en-IN')}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <IndianRupee className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">Revenue</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">₹{(totalRevenue / 100000).toFixed(1)}L</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "bookings"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <CalendarCheck className="inline h-5 w-5 mr-2" />
            Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "calendar"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <CalendarDays className="inline h-5 w-5 mr-2" />
            Calendar
          </button>
        </div>

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">All Bookings</h2>

            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <UtensilsCrossed className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No bookings yet</h3>
                <p className="text-gray-500">Bookings will appear here when customers book your catering</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="border rounded-xl p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                          <h3 className="font-bold text-gray-900">{booking.bookingNumber}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
                            booking.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          }`}>{booking.status}</span>
                        </div>
                        
                        {booking.caterer && (
                          <p className="text-sm text-purple-600 mb-2">
                            Service: {booking.caterer.name} - {booking.caterer.area}, {booking.caterer.city}
                          </p>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <p className="text-gray-500">Customer</p>
                            <p className="font-medium">{booking.user.name}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Event Date</p>
                            <p className="font-medium">{new Date(booking.eventDate).toLocaleDateString("en-IN")}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Guests</p>
                            <p className="font-medium">{booking.guests}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Amount</p>
                            <p className="font-medium text-purple-600">₹{booking.totalAmount?.toLocaleString("en-IN") || 0}</p>
                          </div>
                        </div>
                        
                        {booking.menuPackage && (
                          <p className="mt-2 text-sm">
                            <span className="font-semibold text-gray-700">{booking.menuPackage} Package</span>
                            {" "}@ ₹{booking.pricePerPlate}/plate
                          </p>
                        )}
                        
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                          {booking.user.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {booking.user.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {booking.user.email}
                          </span>
                        </div>

                        {booking.message && (
                          <p className="mt-2 text-sm text-gray-500 bg-yellow-50 p-2 rounded">
                            <strong>Special Requests:</strong> {booking.message}
                          </p>
                        )}
                      </div>

                      {booking.status === "PENDING" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConfirm(booking.id)}
                            disabled={actionLoading === booking.id}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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
                            className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === "calendar" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Availability Calendar</h2>
            
            {caterers.length === 0 ? (
              <div className="text-center py-12">
                <CalendarDays className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No catering services yet</h3>
                <p className="text-gray-500">Calendar will show availability once you have bookings</p>
              </div>
            ) : (
              <>
                {/* Caterer Selector */}
                {caterers.length > 1 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Catering Service</label>
                    <select
                      value={selectedCatererId || ""}
                      onChange={(e) => setSelectedCatererId(e.target.value)}
                      className="w-full max-w-xs px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      {caterers.map((caterer) => (
                        <option key={caterer.id} value={caterer.id}>
                          {caterer.name} - {caterer.area}, {caterer.city}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Calendar */}
                {selectedCatererId && (
                  <AvailabilityCalendar
                    catererId={selectedCatererId}
                    bookings={bookings
                      .filter((b) => b.caterer?.id === selectedCatererId)
                      .map((b) => ({
                        id: b.id,
                        bookingNumber: b.bookingNumber,
                        customerName: b.user.name,
                        customerPhone: b.user.phone || '',
                        eventDate: b.eventDate,
                        guestCount: b.guests,
                        status: b.status,
                        totalAmount: b.totalAmount,
                      }))}
                    onDateClick={handleDateClick}
                  />
                )}
              </>
            )}
          </div>
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
          catererId={selectedCatererId || undefined}
          isBlocked={!!selectedBlockedDate}
          blockedDateId={selectedBlockedDate?.id}
          isOnlineBooking={selectedBlockedDate?.isOnlineBooking}
          onSuccess={handleBlockSuccess}
        />
      </div>
    </div>
  );
}
