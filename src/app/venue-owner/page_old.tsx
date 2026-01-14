"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  CheckCircle2,
  Clock,
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
  IndianRupee,
  FileText,
  Phone,
  Mail
} from "lucide-react";

type Venue = {
  id: string;
  name: string;
  location: string;
  capacity: number;
  price: number;
  isVerified: boolean;
  status?: "PENDING" | "APPROVED" | "REJECTED";
};

type Booking = {
  id: string;
  venueId?: string;
  venueName: string;
  date: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  guests: number;
  amount: number;
  amountPaid?: number;
  amountDue?: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  message?: string;
  notes?: string;
};

type MonthlyAnalytics = {
  totalSales: number;
  daysBooked: number;
  averageBookingValue: number;
  totalBookings: number;
  pendingAmount: number;
  confirmedBookings: number;
  revenue: number;
  growthRate: number;
};

export default function VenueOwnerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<"analytics" | "calendar" | "listings" | "bookings">("analytics");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [offlineBookings, setOfflineBookings] = useState<Date[]>([]);
  const [showAddVenue, setShowAddVenue] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [monthlyAnalytics, setMonthlyAnalytics] = useState<MonthlyAnalytics>({
    totalSales: 0,
    daysBooked: 0,
    averageBookingValue: 0,
    totalBookings: 0,
    pendingAmount: 0,
    confirmedBookings: 0,
    revenue: 0,
    growthRate: 0
  });
  const [newVenue, setNewVenue] = useState({
    name: "",
    location: "",
    capacity: "",
    price: "",
    description: "",
    amenities: ""
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/auth/signin");
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "VENUE_OWNER") {
      router.push("/");
      return;
    }
    
    setUser(parsedUser);

    // Load venues
    const storedVenues = localStorage.getItem("myVenues");
    if (storedVenues) {
      const allVenues = JSON.parse(storedVenues);
      const myVenues = allVenues.filter((v: any) => 
        v.ownerEmail === parsedUser.email || !v.ownerEmail
      );
      setVenues(myVenues);
    }

    // Load bookings
    const allBookings = JSON.parse(localStorage.getItem("bookings") || "[]");
    const myBookings = allBookings.filter((b: any) => b.type === "VENUE");
    setBookings(myBookings);

    // Calculate monthly analytics
    calculateMonthlyAnalytics(myBookings);

    // Load offline bookings
    const storedOffline = localStorage.getItem("offlineBookings");
    if (storedOffline) {
      setOfflineBookings(JSON.parse(storedOffline).map((d: string) => new Date(d)));
    }
  }, [router]);

  const calculateMonthlyAnalytics = (allBookings: Booking[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = new Date(currentYear, currentMonth - 1, 1);
    
    // Current month bookings
    const currentMonthBookings = allBookings.filter(b => {
      const bookingDate = new Date(b.date);
      return bookingDate.getMonth() === currentMonth && 
             bookingDate.getFullYear() === currentYear &&
             b.status !== "CANCELLED";
    });

    // Last month bookings for growth calculation
    const lastMonthBookings = allBookings.filter(b => {
      const bookingDate = new Date(b.date);
      return bookingDate.getMonth() === lastMonth.getMonth() && 
             bookingDate.getFullYear() === lastMonth.getFullYear() &&
             b.status !== "CANCELLED";
    });

    // Calculate unique booked days
    const bookedDays = new Set(
      currentMonthBookings.map(b => new Date(b.date).toDateString())
    );

    const totalSales = currentMonthBookings.reduce((sum, b) => sum + b.amount, 0);
    const lastMonthSales = lastMonthBookings.reduce((sum, b) => sum + b.amount, 0);
    const confirmedBookings = currentMonthBookings.filter(b => b.status === "CONFIRMED");
    const totalPaid = currentMonthBookings.reduce((sum, b) => sum + (b.amountPaid || 0), 0);
    const pendingAmount = totalSales - totalPaid;
    const growthRate = lastMonthSales > 0 
      ? ((totalSales - lastMonthSales) / lastMonthSales) * 100 
      : totalSales > 0 ? 100 : 0;

    setMonthlyAnalytics({
      totalSales,
      daysBooked: bookedDays.size,
      averageBookingValue: currentMonthBookings.length > 0 ? totalSales / currentMonthBookings.length : 0,
      totalBookings: currentMonthBookings.length,
      pendingAmount,
      confirmedBookings: confirmedBookings.length,
      revenue: totalPaid,
      growthRate
    });
  };

  const handleAddVenue = () => {
    if (!newVenue.name || !newVenue.location || !newVenue.capacity || !newVenue.price) {
      alert("Please fill in all required fields");
      return;
    }

    const venue: Venue = {
      id: Date.now().toString(),
      name: newVenue.name,
      location: newVenue.location,
      capacity: parseInt(newVenue.capacity),
      price: parseInt(newVenue.price),
      isVerified: false,
      status: "PENDING"
    };

    const updatedVenues = [...venues, venue];
    setVenues(updatedVenues);
    localStorage.setItem("myVenues", JSON.stringify(updatedVenues));
    
    setShowAddVenue(false);
    setNewVenue({ name: "", location: "", capacity: "", price: "", description: "", amenities: "" });
    alert("Venue added successfully! It will be live after admin verification.");
  };

  const updateBookingNotes = (bookingId: string, notes: string) => {
    const allBookings = JSON.parse(localStorage.getItem("bookings") || "[]");
    const updated = allBookings.map((b: any) =>
      b.id === bookingId ? { ...b, notes } : b
    );
    localStorage.setItem("bookings", JSON.stringify(updated));
    
    const myBookings = updated.filter((b: any) => b.type === "VENUE");
    setBookings(myBookings);
    calculateMonthlyAnalytics(myBookings);
  };

  const updatePaymentDetails = (bookingId: string, amountPaid: number) => {
    const allBookings = JSON.parse(localStorage.getItem("bookings") || "[]");
    const updated = allBookings.map((b: any) => {
      if (b.id === bookingId) {
        return { 
          ...b, 
          amountPaid: amountPaid,
          amountDue: b.amount - amountPaid
        };
      }
      return b;
    });
    localStorage.setItem("bookings", JSON.stringify(updated));
    
    const myBookings = updated.filter((b: any) => b.type === "VENUE");
    setBookings(myBookings);
    calculateMonthlyAnalytics(myBookings);
  };

  const handleDeleteVenue = (id: string) => {
    if (confirm("Are you sure you want to delete this venue?")) {
      const updated = venues.filter(v => v.id !== id);
      setVenues(updated);
      localStorage.setItem("myVenues", JSON.stringify(updated));
    }
  };

  const toggleOfflineBooking = (date: Date) => {
    const dateString = date.toDateString();
    const exists = offlineBookings.some(d => d.toDateString() === dateString);
    
    let updated: Date[];
    if (exists) {
      updated = offlineBookings.filter(d => d.toDateString() !== dateString);
    } else {
      updated = [...offlineBookings, date];
    }
    
    setOfflineBookings(updated);
    localStorage.setItem("offlineBookings", JSON.stringify(updated.map(d => d.toISOString())));
  };

  const isDateBooked = (date: Date) => {
    const dateString = date.toDateString();
    return offlineBookings.some(d => d.toDateString() === dateString) ||
           bookings.some(b => new Date(b.date).toDateString() === dateString && b.status !== "CANCELLED");
  };

  const getDayBookings = (date: Date) => {
    const dateString = date.toDateString();
    return bookings.filter(b => new Date(b.date).toDateString() === dateString);
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isBooked = isDateBooked(date);
      const dayBookings = getDayBookings(date);
      const isSelected = selectedDate?.toDateString() === date.toDateString();
      const isToday = new Date().toDateString() === date.toDateString();
      const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

      days.push(
        <button
          key={day}
          onClick={() => !isPast && setSelectedDate(date)}
          disabled={isPast}
          className={`relative p-2 min-h-[80px] rounded-lg border-2 transition-all ${
            isSelected
              ? "border-purple-600 bg-purple-50"
              : isBooked
              ? "border-red-300 bg-red-50"
              : isToday
              ? "border-purple-400 bg-purple-50"
              : "border-gray-200 hover:border-purple-300 hover:bg-purple-50"
          } ${isPast ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <div className="text-sm font-semibold text-gray-900">{day}</div>
          {isBooked && (
            <div className="mt-1">
              <div className="h-2 w-2 rounded-full bg-red-600 mx-auto"></div>
              {dayBookings.length > 0 && (
                <div className="text-xs text-gray-600 mt-1">{dayBookings.length} booking(s)</div>
              )}
            </div>
          )}
        </button>
      );
    }

    return days;
  };

  const updateBookingStatus = (bookingId: string, status: "CONFIRMED" | "CANCELLED") => {
    const allBookings = JSON.parse(localStorage.getItem("bookings") || "[]");
    const updated = allBookings.map((b: any) =>
      b.id === bookingId ? { ...b, status } : b
    );
    localStorage.setItem("bookings", JSON.stringify(updated));
    
    const myBookings = updated.filter((b: any) => b.type === "VENUE");
    setBookings(myBookings);
    calculateMonthlyAnalytics(myBookings);
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center cosmic-gradient">Loading...</div>;
  }

  const stats = {
    totalVenues: venues.length,
    totalBookings: bookings.length,
    revenue: bookings.reduce((sum, b) => sum + b.amount, 0),
    approvedVenues: venues.filter(v => v.status === "APPROVED" || v.isVerified).length,
    pendingVenues: venues.filter(v => v.status === "PENDING").length
  };

  return (
    <div className="min-h-screen cosmic-gradient pb-24 pt-8">
      <div className="mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-rainbow mb-2">Venue Owner Dashboard</h1>
          <p className="text-gray-700">Manage your venues and track performance</p>
        </motion.div>

        {/* Tabs */}
        <div className="mb-8 flex gap-3 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`rounded-full px-6 py-3 font-semibold transition-all whitespace-nowrap ${
              activeTab === "analytics"
                ? "btn-rainbow text-white shadow-lg"
                : "glass-card-vibrant hover:bg-white/80"
            }`}
          >
            📊 Analytics
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`rounded-full px-6 py-3 font-semibold transition-all whitespace-nowrap ${
              activeTab === "calendar"
                ? "btn-rainbow text-white shadow-lg"
                : "glass-card-vibrant hover:bg-white/80"
            }`}
          >
            📅 Calendar OS
          </button>
          <button
            onClick={() => setActiveTab("listings")}
            className={`rounded-full px-6 py-3 font-semibold transition-all whitespace-nowrap ${
              activeTab === "listings"
                ? "btn-rainbow text-white shadow-lg"
                : "glass-card-vibrant hover:bg-white/80"
            }`}
          >
            🏛️ My Venues
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`rounded-full px-6 py-3 font-semibold transition-all whitespace-nowrap ${
              activeTab === "bookings"
                ? "btn-rainbow text-white shadow-lg"
                : "glass-card-vibrant hover:bg-white/80"
            }`}
          >
            📋 Bookings
          </button>
        </div>

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Monthly Performance Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card-vibrant rounded-3xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Monthly Performance</h2>
                <div className="text-sm text-gray-600">
                  {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-orange-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700">Total Sales</span>
                    <DollarSign className="h-6 w-6 text-orange-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    ₹{monthlyAnalytics.totalSales.toLocaleString('en-IN')}
                  </p>
                  <div className="flex items-center gap-1 text-xs">
                    <TrendingUp className={`h-3 w-3 ${monthlyAnalytics.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    <span className={monthlyAnalytics.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {monthlyAnalytics.growthRate >= 0 ? '+' : ''}{monthlyAnalytics.growthRate.toFixed(1)}%
                    </span>
                    <span className="text-gray-600">vs last month</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700">Days Booked</span>
                    <Calendar className="h-6 w-6 text-yellow-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {monthlyAnalytics.daysBooked}
                  </p>
                  <p className="text-xs text-gray-600">
                    {monthlyAnalytics.totalBookings} total bookings
                  </p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 border-2 border-red-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700">Avg Booking Value</span>
                    <BarChart3 className="h-6 w-6 text-red-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    ₹{Math.round(monthlyAnalytics.averageBookingValue).toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-600">
                    {monthlyAnalytics.confirmedBookings} confirmed
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 border-2 border-orange-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700">Pending Amount</span>
                    <IndianRupee className="h-6 w-6 text-orange-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    ₹{monthlyAnalytics.pendingAmount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-600">
                    Revenue: ₹{monthlyAnalytics.revenue.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card-vibrant rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalVenues}</p>
                    <p className="text-sm text-gray-600">Total Venues</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 text-xs">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                    {stats.approvedVenues} Approved
                  </span>
                  {stats.pendingVenues > 0 && (
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-semibold">
                      {stats.pendingVenues} Pending
                    </span>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card-vibrant rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <Calendar className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                    <p className="text-sm text-gray-600">All Time Bookings</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-600">
                  {bookings.filter(b => b.status === "CONFIRMED").length} confirmed bookings
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card-vibrant rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <DollarSign className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{(stats.revenue / 100000).toFixed(1)}L
                    </p>
                    <p className="text-sm text-gray-600">All Time Revenue</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-600">
                  Lifetime earnings from all venues
                </p>
              </motion.div>
            </div>

            {/* Recent Bookings with Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card-vibrant rounded-3xl p-8"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Bookings</h3>
              
              {bookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No bookings yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.slice(0, 5).map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-white/60 rounded-xl p-5 hover:bg-white/80 transition-all cursor-pointer"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowBookingModal(true);
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <Users className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{booking.customerName}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(booking.date).toLocaleDateString('en-IN', { 
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                          booking.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
                          booking.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {booking.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Guests</p>
                          <p className="font-semibold text-gray-900">{booking.guests} people</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Amount</p>
                          <p className="font-semibold text-gray-900">
                            ₹{booking.amount.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">
                            {booking.amountPaid ? 'Due' : 'Status'}
                          </p>
                          <p className={`font-semibold ${
                            booking.amountDue && booking.amountDue > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {booking.amountDue && booking.amountDue > 0 
                              ? `₹${booking.amountDue.toLocaleString('en-IN')}` 
                              : 'Paid'}
                          </p>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-600 mb-1">Notes:</p>
                          <p className="text-sm text-gray-700">{booking.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Calendar OS */}
        {activeTab === "calendar" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card-vibrant rounded-3xl p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                  className="rounded-lg p-2 glass-card hover:bg-white/80"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                  className="rounded-lg p-2 glass-card hover:bg-white/80"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="mb-6">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-semibold text-gray-700 p-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {renderCalendar()}
              </div>
            </div>

            {/* Selected Date Panel */}
            {selectedDate && (
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">
                    {selectedDate.toLocaleDateString('en-IN', { 
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </h3>
                  <button onClick={() => setSelectedDate(null)}>
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <button
                  onClick={() => toggleOfflineBooking(selectedDate)}
                  className={`w-full rounded-xl py-3 font-semibold mb-4 transition-all ${
                    offlineBookings.some(d => d.toDateString() === selectedDate.toDateString())
                      ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg"
                      : "btn-rainbow text-white shadow-lg"
                  }`}
                >
                  {offlineBookings.some(d => d.toDateString() === selectedDate.toDateString())
                    ? "Unblock Date"
                    : "Block for Offline Booking"}
                </button>

                <div>
                  <h4 className="font-semibold mb-3">Bookings on this day:</h4>
                  {getDayBookings(selectedDate).length === 0 ? (
                    <p className="text-gray-600 text-sm">No bookings</p>
                  ) : (
                    <div className="space-y-3">
                      {getDayBookings(selectedDate).map(booking => (
                        <div key={booking.id} className="rounded-lg bg-white/60 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold">{booking.customerName}</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              booking.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
                              booking.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {booking.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{booking.guests} guests</p>
                          <p className="text-sm font-semibold text-gray-900">₹{booking.amount.toLocaleString('en-IN')}</p>
                          {booking.message && (
                            <p className="text-sm text-gray-600 mt-2">Note: {booking.message}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Listings Tab */}
        {activeTab === "listings" && (
          <div className="space-y-4">
            <button
              onClick={() => setShowAddVenue(!showAddVenue)}
              className="w-full glass-card-vibrant rounded-2xl p-6 hover-lift flex items-center justify-center gap-3 font-semibold transition-all"
              style={{ color: '#FF6B35' }}
            >
              <Plus className="h-5 w-5" />
              Add New Venue
            </button>

            {showAddVenue && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card-vibrant rounded-3xl p-8"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6">Add New Venue</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    placeholder="Venue Name *"
                    value={newVenue.name}
                    onChange={(e) => setNewVenue({...newVenue, name: e.target.value})}
                    className="rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-orange-500 transition-colors"
                  />
                  <input
                    placeholder="Location *"
                    value={newVenue.location}
                    onChange={(e) => setNewVenue({...newVenue, location: e.target.value})}
                    className="rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-orange-500 transition-colors"
                  />
                  <input
                    type="number"
                    placeholder="Capacity *"
                    value={newVenue.capacity}
                    onChange={(e) => setNewVenue({...newVenue, capacity: e.target.value})}
                    className="rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-orange-500 transition-colors"
                  />
                  <input
                    type="number"
                    placeholder="Price (₹) *"
                    value={newVenue.price}
                    onChange={(e) => setNewVenue({...newVenue, price: e.target.value})}
                    className="rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-orange-500 transition-colors"
                  />
                  <textarea
                    placeholder="Description"
                    value={newVenue.description}
                    onChange={(e) => setNewVenue({...newVenue, description: e.target.value})}
                    rows={3}
                    className="rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-orange-500 transition-colors sm:col-span-2 resize-none"
                  />
                  <input
                    placeholder="Amenities (comma separated)"
                    value={newVenue.amenities}
                    onChange={(e) => setNewVenue({...newVenue, amenities: e.target.value})}
                    className="rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-orange-500 transition-colors sm:col-span-2"
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddVenue(false)}
                    className="flex-1 rounded-xl border-2 border-gray-200 py-3 font-semibold hover:bg-white/60 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddVenue}
                    className="flex-1 rounded-xl btn-rainbow py-3 font-semibold text-white shadow-lg"
                  >
                    Add Venue
                  </button>
                </div>
              </motion.div>
            )}

            {venues.map((venue) => (
              <motion.div
                key={venue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card-vibrant rounded-2xl p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{venue.name}</h3>
                      {venue.status === "APPROVED" || venue.isVerified ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : venue.status === "PENDING" ? (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      ) : null}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{venue.location}</p>
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-gray-600">Capacity:</span>
                        <span className="ml-2 font-semibold">{venue.capacity} guests</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Price:</span>
                        <span className="ml-2 font-semibold">₹{venue.price.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    {venue.status === "PENDING" && (
                      <div className="mt-3 inline-block bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">
                        Awaiting Admin Approval
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-lg p-2 hover:bg-white/60 transition-colors">
                      <Edit className="h-5 w-5 text-orange-600" />
                    </button>
                    <button 
                      onClick={() => handleDeleteVenue(venue.id)}
                      className="rounded-lg p-2 hover:bg-white/60 transition-colors"
                    >
                      <Trash2 className="h-5 w-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {venues.length === 0 && !showAddVenue && (
              <div className="glass-card-vibrant rounded-3xl p-12 text-center">
                <p className="text-gray-600">No venues yet. Add your first venue!</p>
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card-vibrant rounded-3xl overflow-hidden"
          >
            {bookings.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No bookings yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/60">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Customer</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Guests</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Amount</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Paid/Due</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-white/40 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{booking.customerName}</p>
                            {booking.customerEmail && (
                              <p className="text-xs text-gray-600">{booking.customerEmail}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(booking.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm">{booking.guests}</td>
                        <td className="px-6 py-4 font-semibold">
                          ₹{booking.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs">
                            <div className="text-green-600 font-semibold">
                              ₹{(booking.amountPaid || 0).toLocaleString('en-IN')}
                            </div>
                            {booking.amountDue && booking.amountDue > 0 && (
                              <div className="text-red-600 font-semibold">
                                ₹{booking.amountDue.toLocaleString('en-IN')} due
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
                            booking.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowBookingModal(true);
                              }}
                              className="text-sm font-medium text-orange-600 hover:text-orange-700"
                            >
                              Details
                            </button>
                            {booking.status === "PENDING" && (
                              <>
                                <button
                                  onClick={() => updateBookingStatus(booking.id, "CONFIRMED")}
                                  className="text-sm font-medium text-green-600 hover:text-green-700"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => updateBookingStatus(booking.id, "CANCELLED")}
                                  className="text-sm font-medium text-red-600 hover:text-red-700"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* Booking Details Modal */}
        {showBookingModal && selectedBooking && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowBookingModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card-vibrant rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Details</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedBooking.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
                    selectedBooking.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {selectedBooking.status}
                  </span>
                </div>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Customer Information */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/60 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-orange-600" />
                      <span className="text-xs font-semibold text-gray-600">Customer Name</span>
                    </div>
                    <p className="font-bold text-gray-900">{selectedBooking.customerName}</p>
                  </div>
                  <div className="bg-white/60 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-red-600" />
                      <span className="text-xs font-semibold text-gray-600">Event Date</span>
                    </div>
                    <p className="font-bold text-gray-900">
                      {new Date(selectedBooking.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {selectedBooking.customerEmail && (
                  <div className="bg-white/60 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="h-4 w-4 text-yellow-600" />
                      <span className="text-xs font-semibold text-gray-600">Email</span>
                    </div>
                    <p className="text-gray-900">{selectedBooking.customerEmail}</p>
                  </div>
                )}

                {selectedBooking.customerPhone && (
                  <div className="bg-white/60 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-semibold text-gray-600">Phone</span>
                    </div>
                    <p className="text-gray-900">{selectedBooking.customerPhone}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/60 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-semibold text-gray-600">Guests</span>
                    </div>
                    <p className="font-bold text-gray-900">{selectedBooking.guests} people</p>
                  </div>
                  <div className="bg-white/60 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-semibold text-gray-600">Total Amount</span>
                    </div>
                    <p className="font-bold text-gray-900">
                      ₹{selectedBooking.amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Payment Tracking */}
                <div className="bg-gradient-to-r from-green-50 to-yellow-50 rounded-xl p-4 border-2 border-green-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Payment Status</h4>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Amount Paid</p>
                      <p className="text-lg font-bold text-green-600">
                        ₹{(selectedBooking.amountPaid || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Amount Due</p>
                      <p className="text-lg font-bold text-red-600">
                        ₹{(selectedBooking.amountDue || selectedBooking.amount).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Enter amount paid"
                      className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 outline-none text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement;
                          const amount = parseFloat(input.value);
                          if (amount > 0) {
                            updatePaymentDetails(selectedBooking.id, amount);
                            input.value = '';
                            setShowBookingModal(false);
                          }
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                        const amount = parseFloat(input.value);
                        if (amount > 0) {
                          updatePaymentDetails(selectedBooking.id, amount);
                          input.value = '';
                          setShowBookingModal(false);
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm"
                    >
                      Update
                    </button>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="bg-white/60 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-orange-600" />
                    <span className="text-xs font-semibold text-gray-600">Notes</span>
                  </div>
                  <textarea
                    defaultValue={selectedBooking.notes || ''}
                    placeholder="Add notes about this booking..."
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-orange-500 outline-none text-sm resize-none"
                    rows={3}
                    onBlur={(e) => {
                      if (e.target.value !== selectedBooking.notes) {
                        updateBookingNotes(selectedBooking.id, e.target.value);
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Press Enter or click outside to save
                  </p>
                </div>

                {selectedBooking.message && (
                  <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                    <p className="text-xs font-semibold text-blue-900 mb-1">Customer Message:</p>
                    <p className="text-sm text-blue-800">{selectedBooking.message}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {selectedBooking.status === "PENDING" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      updateBookingStatus(selectedBooking.id, "CONFIRMED");
                      setShowBookingModal(false);
                    }}
                    className="flex-1 btn-rainbow text-white font-bold py-3 rounded-xl shadow-lg"
                  >
                    Confirm Booking
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to reject this booking?")) {
                        updateBookingStatus(selectedBooking.id, "CANCELLED");
                        setShowBookingModal(false);
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-3 rounded-xl shadow-lg"
                  >
                    Reject Booking
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
