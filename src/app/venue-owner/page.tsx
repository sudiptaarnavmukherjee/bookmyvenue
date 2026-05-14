"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { api } from "@/lib/api-client";
import { Calendar, CheckCircle2, Clock, Users, Loader2, Building, MapPin, X, CalendarDays, Eye, Phone, Mail, IndianRupee, Wallet, ExternalLink } from "lucide-react";

const AvailabilityCalendar = dynamic(() => import("@/components/calendar/AvailabilityCalendar"));
const BlockDateModal = dynamic(() => import("@/components/calendar/BlockDateModal"));
const EarningsDashboard = dynamic(() => import("@/components/owner/EarningsDashboard"));
const EngagementDashboard = dynamic(() => import("@/components/owner/EngagementDashboard"));

type Venue = {
  id: string;
  name: string;
  city: string;
  area: string;
  priceMode: string;
  exactPrice?: number;
  estimatedMinPrice?: number;
  estimatedMaxPrice?: number;
  maxGuests: number;
  isVerified: boolean;
  coverImage?: string;
};

type Booking = {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  eventDate: string;
  guestCount?: number;
  status: string;
  totalAmount?: number;
  specialRequests?: string;
  createdAt: string;
  venue?: {
    id: string;
    name: string;
  };
};

export default function VenueOwnerDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"venues" | "bookings" | "calendar" | "earnings" | "insights">("venues");
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Google Form URL for venue listing requests
  const VENUE_REQUEST_FORM_URL = "https://forms.gle/yourformid"; // Replace with actual Google Form URL
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch venues
      const venueRes = await api.getMyVenues();
      if (!venueRes.error && venueRes.data) {
        const data = venueRes.data as any;
        const venueList = Array.isArray(data.venues) ? data.venues : Array.isArray(data) ? data : [];
        setVenues(venueList);
        if (venueList.length > 0) {
          setSelectedVenueId(prev => prev || venueList[0].id);
        }
      }
      
      // Fetch bookings
      const bookingRes = await fetch("/api/bookings");
      if (bookingRes.ok) {
        const bookingData = await bookingRes.json();
        setBookings(Array.isArray(bookingData) ? bookingData : bookingData.bookings || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
    else if (status === "authenticated") fetchData();
  }, [status, router, fetchData]);

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Venue Owner Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome, {session?.user?.name}</p>
          </div>
          <a 
            href={VENUE_REQUEST_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90"
          >
            <ExternalLink className="h-5 w-5" /> Request New Venue Listing
          </a>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab("venues")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "venues"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Building className="inline h-5 w-5 mr-2" />
            My Venues ({venues.length})
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "bookings"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Clock className="inline h-5 w-5 mr-2" />
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
          <button
            onClick={() => setActiveTab("earnings")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "earnings"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Wallet className="inline h-5 w-5 mr-2" />
            Earnings
          </button>
          <button
            onClick={() => setActiveTab("insights")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "insights"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Eye className="inline h-5 w-5 mr-2" />
            Insights
          </button>
        </div>

        {/* Venues Tab */}
        {activeTab === "venues" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">My Venues</h2>
          
          {venues.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No venues assigned yet</h3>
              <p className="text-gray-500 mb-6">Request a venue listing to get started</p>
              <a 
                href={VENUE_REQUEST_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold"
              >
                <ExternalLink className="h-5 w-5" /> Request Venue Listing
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map((venue) => (
                <div key={venue.id} className="bg-gray-50 rounded-xl overflow-hidden border">
                  <div className="h-40 bg-gradient-to-r from-purple-400 to-pink-400 relative">
                    {venue.coverImage && <img src={venue.coverImage} alt={venue.name} className="w-full h-full object-cover" />}
                    <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${venue.isVerified ? "bg-green-500 text-white" : "bg-yellow-500 text-white"}`}>
                      {venue.isVerified ? "Verified" : "Pending"}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900">{venue.name}</h3>
                    <p className="text-gray-600 text-sm flex items-center gap-1 mt-1"><MapPin className="h-4 w-4" />{venue.area}, {venue.city}</p>
                    <div className="flex justify-between items-center mt-4">
                      <p className="text-purple-600 font-bold">₹{(venue.exactPrice || venue.estimatedMinPrice || 0).toLocaleString('en-IN')}</p>
                      <p className="text-gray-500 text-sm"><Users className="h-4 w-4 inline mr-1" />{venue.maxGuests} guests</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">My Bookings</h2>
            
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No bookings yet</h3>
                <p className="text-gray-500">Bookings will appear here when customers book your venues</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="border rounded-xl p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-bold text-gray-900">{booking.bookingNumber}</h3>
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
                        </div>
                        {booking.venue && (
                          <p className="text-sm text-purple-600 mt-1">Venue: {booking.venue.name}</p>
                        )}
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <p className="text-gray-500">Customer</p>
                            <p className="font-medium">{booking.customerName}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Event Date</p>
                            <p className="font-medium">{new Date(booking.eventDate).toLocaleDateString("en-IN")}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Guests</p>
                            <p className="font-medium">{booking.guestCount || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Amount</p>
                            <p className="font-medium text-purple-600">₹{(booking.totalAmount || 0).toLocaleString("en-IN")}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {booking.customerPhone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {booking.customerEmail}
                          </span>
                        </div>
                        {booking.specialRequests && (
                          <p className="mt-2 text-sm text-gray-500 bg-yellow-50 p-2 rounded">
                            <strong>Special Requests:</strong> {booking.specialRequests}
                          </p>
                        )}
                      </div>
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
            
            {venues.length === 0 ? (
              <div className="text-center py-12">
                <CalendarDays className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No venues yet</h3>
                <p className="text-gray-500">Add a venue to manage its calendar</p>
              </div>
            ) : (
              <>
                {/* Venue Selector */}
                {venues.length > 1 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Venue</label>
                    <select
                      value={selectedVenueId || ""}
                      onChange={(e) => setSelectedVenueId(e.target.value)}
                      className="w-full max-w-xs px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      {venues.map((venue) => (
                        <option key={venue.id} value={venue.id}>
                          {venue.name} - {venue.area}, {venue.city}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Calendar */}
                {selectedVenueId && (
                  <AvailabilityCalendar
                    venueId={selectedVenueId}
                    bookings={bookings.filter((b) => b.venue?.id === selectedVenueId).map((b) => ({
                      id: b.id,
                      bookingNumber: b.bookingNumber,
                      customerName: b.customerName,
                      customerPhone: b.customerPhone,
                      eventDate: b.eventDate,
                      guestCount: b.guestCount,
                      status: b.status,
                      totalAmount: b.totalAmount,
                    }))}
                    onDateClick={(date, blockedDate) => {
                      setSelectedDate(date);
                      if (!blockedDate && date >= new Date()) {
                        setShowBlockModal(true);
                      }
                    }}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === "earnings" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Earnings & Payouts</h2>
            <EarningsDashboard />
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === "insights" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Engagement Insights</h2>
            <EngagementDashboard />
          </div>
        )}

        {/* Block Date Modal */}
        {selectedVenueId && selectedDate && (
          <BlockDateModal
            isOpen={showBlockModal}
            venueId={selectedVenueId}
            date={selectedDate}
            onClose={() => {
              setShowBlockModal(false);
              setSelectedDate(null);
            }}
            onSuccess={() => {
              setShowBlockModal(false);
              setSelectedDate(null);
              // Calendar will refetch automatically
            }}
          />
        )}
      </div>
    </div>
  );
}
