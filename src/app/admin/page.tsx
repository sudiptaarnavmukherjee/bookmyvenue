"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles,
  Building2,
  UtensilsCrossed,
  Users,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Shield,
  AlertCircle,
  CalendarDays,
  Phone,
  Mail,
  MapPin,
  IndianRupee,
} from "lucide-react";
import Link from "next/link";

interface Venue {
  id: string;
  name: string;
  city: string;
  area: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  owner: {
    name: string;
    email: string;
  };
}

interface Caterer {
  id: string;
  name: string;
  city: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  owner: {
    name: string;
    email: string;
  };
}

interface Booking {
  id: string;
  bookingNumber: string;
  type: "VENUE" | "CATERING";
  status: string;
  eventDate: string;
  guestCount: number;
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  specialRequests?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  venue?: {
    id: string;
    name: string;
    city: string;
    area: string;
    coverImage?: string;
    owner: {
      name: string;
      email: string;
    };
  };
  caterer?: {
    id: string;
    name: string;
    city: string;
    coverImage?: string;
    owner: {
      name: string;
      email: string;
    };
  };
  payments?: {
    id: string;
    amount: number;
    status: string;
    paymentMethod?: string;
    createdAt: string;
  }[];
}

interface Stats {
  totalUsers: number;
  totalVenues: number;
  totalCaterers: number;
  pendingVenues: number;
  pendingCaterers: number;
  totalBookings: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"venues" | "caterers" | "bookings">("venues");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [caterers, setCaterers] = useState<Caterer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user || session.user.role !== "ADMIN") {
      router.push("/auth/signin");
      return;
    }

    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [venuesRes, caterersRes, statsRes, bookingsRes] = await Promise.all([
        fetch("/api/admin/venues"),
        fetch("/api/admin/caterers"),
        fetch("/api/admin/stats"),
        fetch("/api/admin/bookings"),
      ]);

      if (venuesRes.ok) {
        const data = await venuesRes.json();
        setVenues(data.venues || []);
      }

      if (caterersRes.ok) {
        const data = await caterersRes.json();
        setCaterers(data.caterers || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyVenue = async (venueId: string, verify: boolean) => {
    setActionLoading(venueId);
    try {
      const res = await fetch(`/api/admin/venues/${venueId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: verify }),
      });

      if (res.ok) {
        setVenues(venues.map(v => 
          v.id === venueId ? { ...v, isVerified: verify } : v
        ));
      }
    } catch (error) {
      console.error("Error verifying venue:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyCaterer = async (catererId: string, verify: boolean) => {
    setActionLoading(catererId);
    try {
      const res = await fetch(`/api/admin/caterers/${catererId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: verify }),
      });

      if (res.ok) {
        setCaterers(caterers.map(c => 
          c.id === catererId ? { ...c, isVerified: verify } : c
        ));
      }
    } catch (error) {
      console.error("Error verifying caterer:", error);
    } finally {
      setActionLoading(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  const pendingVenues = venues.filter(v => !v.isVerified);
  const pendingCaterers = caterers.filter(c => !c.isVerified);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="glass-card border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-10 w-10 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gradient">Admin Dashboard</h1>
                <p className="text-gray-600">Manage venues, caterers, and users</p>
              </div>
            </div>
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-white/60 text-gray-700 hover:bg-white transition-all"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-4 text-center"
            >
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              <p className="text-sm text-gray-600">Total Users</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-2xl p-4 text-center"
            >
              <Building2 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.totalVenues}</p>
              <p className="text-sm text-gray-600">Total Venues</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-2xl p-4 text-center"
            >
              <UtensilsCrossed className="h-8 w-8 text-pink-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.totalCaterers}</p>
              <p className="text-sm text-gray-600">Total Caterers</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-2xl p-4 text-center bg-yellow-50"
            >
              <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-700">{stats.pendingVenues}</p>
              <p className="text-sm text-yellow-600">Pending Venues</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card rounded-2xl p-4 text-center bg-yellow-50"
            >
              <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-700">{stats.pendingCaterers}</p>
              <p className="text-sm text-yellow-600">Pending Caterers</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card rounded-2xl p-4 text-center"
            >
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
              <p className="text-sm text-gray-600">Total Bookings</p>
            </motion.div>
          </div>
        )}

        {/* Pending Approvals Alert */}
        {(pendingVenues.length > 0 || pendingCaterers.length > 0) && (
          <div className="mb-6 p-4 rounded-2xl bg-yellow-50 border border-yellow-200 flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
            <p className="text-yellow-800">
              <strong>{pendingVenues.length + pendingCaterers.length}</strong> items pending approval
              ({pendingVenues.length} venues, {pendingCaterers.length} caterers)
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab("venues")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "venues"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                : "bg-white/60 text-gray-700 hover:bg-white"
            }`}
          >
            <Building2 className="inline h-5 w-5 mr-2" />
            Venues ({venues.length})
          </button>
          <button
            onClick={() => setActiveTab("caterers")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "caterers"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                : "bg-white/60 text-gray-700 hover:bg-white"
            }`}
          >
            <UtensilsCrossed className="inline h-5 w-5 mr-2" />
            Caterers ({caterers.length})
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "bookings"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                : "bg-white/60 text-gray-700 hover:bg-white"
            }`}
          >
            <CalendarDays className="inline h-5 w-5 mr-2" />
            Bookings ({bookings.length})
          </button>
        </div>

        {/* Venues Tab */}
        {activeTab === "venues" && (
          <div className="space-y-4">
            {venues.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No venues found</p>
              </div>
            ) : (
              venues.map((venue) => (
                <motion.div
                  key={venue.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`glass-card rounded-2xl p-6 ${
                    !venue.isVerified ? "border-2 border-yellow-400" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-900">{venue.name}</h3>
                        {venue.isVerified ? (
                          <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                            ✓ Verified
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
                            ⏳ Pending
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mt-1">
                        {venue.area}, {venue.city}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Owner: {venue.owner?.name || "N/A"} ({venue.owner?.email || "N/A"})
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Added: {new Date(venue.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/venues/${venue.id}`}
                        className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all"
                        title="View"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>

                      {!venue.isVerified ? (
                        <button
                          onClick={() => handleVerifyVenue(venue.id, true)}
                          disabled={actionLoading === venue.id}
                          className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-all disabled:opacity-50"
                        >
                          {actionLoading === venue.id ? "..." : "Approve"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVerifyVenue(venue.id, false)}
                          disabled={actionLoading === venue.id}
                          className="px-4 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all disabled:opacity-50"
                        >
                          {actionLoading === venue.id ? "..." : "Revoke"}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Caterers Tab */}
        {activeTab === "caterers" && (
          <div className="space-y-4">
            {caterers.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center">
                <UtensilsCrossed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No caterers found</p>
              </div>
            ) : (
              caterers.map((caterer) => (
                <motion.div
                  key={caterer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`glass-card rounded-2xl p-6 ${
                    !caterer.isVerified ? "border-2 border-yellow-400" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-900">{caterer.name}</h3>
                        {caterer.isVerified ? (
                          <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                            ✓ Verified
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
                            ⏳ Pending
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mt-1">{caterer.city}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Owner: {caterer.owner?.name || "N/A"} ({caterer.owner?.email || "N/A"})
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Added: {new Date(caterer.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/catering/${caterer.id}`}
                        className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all"
                        title="View"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>

                      {!caterer.isVerified ? (
                        <button
                          onClick={() => handleVerifyCaterer(caterer.id, true)}
                          disabled={actionLoading === caterer.id}
                          className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-all disabled:opacity-50"
                        >
                          {actionLoading === caterer.id ? "..." : "Approve"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVerifyCaterer(caterer.id, false)}
                          disabled={actionLoading === caterer.id}
                          className="px-4 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all disabled:opacity-50"
                        >
                          {actionLoading === caterer.id ? "..." : "Revoke"}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center">
                <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No bookings found</p>
              </div>
            ) : (
              bookings.map((booking) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-2xl p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-bold text-gray-900">
                          {booking.bookingNumber}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          booking.status === "CONFIRMED" 
                            ? "bg-green-100 text-green-700"
                            : booking.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : booking.status === "CANCELLED"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {booking.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          booking.type === "VENUE" 
                            ? "bg-purple-100 text-purple-700"
                            : "bg-pink-100 text-pink-700"
                        }`}>
                          {booking.type}
                        </span>
                      </div>

                      {/* Venue/Caterer Info */}
                      <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                        {booking.venue ? (
                          <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-purple-600" />
                            <div>
                              <p className="font-semibold text-gray-900">{booking.venue.name}</p>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {booking.venue.area}, {booking.venue.city}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Owner: {booking.venue.owner?.name} ({booking.venue.owner?.email})
                              </p>
                            </div>
                          </div>
                        ) : booking.caterer ? (
                          <div className="flex items-center gap-3">
                            <UtensilsCrossed className="h-5 w-5 text-pink-600" />
                            <div>
                              <p className="font-semibold text-gray-900">{booking.caterer.name}</p>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {booking.caterer.city}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Owner: {booking.caterer.owner?.name} ({booking.caterer.owner?.email})
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      {/* Customer Info */}
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 bg-blue-50 rounded-xl">
                          <p className="text-xs text-blue-600 font-semibold mb-1">CUSTOMER</p>
                          <p className="font-semibold text-gray-900">{booking.customerName}</p>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <Mail className="h-3 w-3" />
                            {booking.customerEmail}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {booking.customerPhone}
                          </p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-xl">
                          <p className="text-xs text-purple-600 font-semibold mb-1">BOOKING USER</p>
                          <p className="font-semibold text-gray-900">{booking.user?.name || "N/A"}</p>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <Mail className="h-3 w-3" />
                            {booking.user?.email || "N/A"}
                          </p>
                          {booking.user?.phone && (
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {booking.user.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="mt-3 flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-700">
                            <strong>Event:</strong> {new Date(booking.eventDate).toLocaleDateString("en-IN", { 
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric"
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-700">
                            <strong>Guests:</strong> {booking.guestCount || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IndianRupee className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-700">
                            <strong>Total:</strong> ₹{(booking.totalAmount || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>

                      {/* Special Requests */}
                      {booking.specialRequests && (
                        <div className="mt-3 p-3 bg-yellow-50 rounded-xl">
                          <p className="text-xs text-yellow-700 font-semibold mb-1">SPECIAL REQUESTS</p>
                          <p className="text-sm text-gray-700">{booking.specialRequests}</p>
                        </div>
                      )}

                      {/* Payments */}
                      {booking.payments && booking.payments.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 font-semibold mb-2">PAYMENTS</p>
                          <div className="flex flex-wrap gap-2">
                            {booking.payments.map((payment) => (
                              <div 
                                key={payment.id}
                                className={`px-3 py-2 rounded-lg text-xs ${
                                  payment.status === "COMPLETED"
                                    ? "bg-green-100 text-green-700"
                                    : payment.status === "PENDING"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                ₹{(payment.amount || 0).toLocaleString("en-IN")} - {payment.status}
                                {payment.paymentMethod && ` (${payment.paymentMethod})`}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-gray-400 mt-3">
                        Booked on: {new Date(booking.createdAt).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {booking.venue && (
                        <Link
                          href={`/venues/${booking.venue.id}`}
                          className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all"
                          title="View Venue"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                      )}
                      {booking.caterer && (
                        <Link
                          href={`/catering/${booking.caterer.id}`}
                          className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all"
                          title="View Caterer"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
