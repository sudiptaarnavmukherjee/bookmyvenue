"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api-client";
import { Calendar, CheckCircle2, Clock, Users, Loader2, Plus, Building, MapPin, X, CalendarDays, Eye, Phone, Mail, IndianRupee } from "lucide-react";
import AvailabilityCalendar from "@/components/calendar/AvailabilityCalendar";
import BlockDateModal from "@/components/calendar/BlockDateModal";

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
  const [activeTab, setActiveTab] = useState<"venues" | "bookings" | "calendar">("venues");
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const [showAddVenue, setShowAddVenue] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newVenue, setNewVenue] = useState({
    name: "", description: "", city: "", area: "", address: "", pincode: "",
    priceMode: "EXACT", exactPrice: "", estimatedMinPrice: "", estimatedMaxPrice: "",
    minGuests: "50", maxGuests: "500", venueType: "Banquet Hall",
    amenities: "Parking,AC,Catering", images: ""
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch venues
      const venueRes = await api.getMyVenues();
      if (!venueRes.error && venueRes.data) {
        const data = venueRes.data as any;
        const venueList = Array.isArray(data.venues) ? data.venues : Array.isArray(data) ? data : [];
        setVenues(venueList);
        if (venueList.length > 0 && !selectedVenueId) {
          setSelectedVenueId(venueList[0].id);
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
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
    else if (status === "authenticated") fetchData();
  }, [status, router]);

  const handleAddVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const venueData = {
        name: newVenue.name,
        description: newVenue.description,
        city: newVenue.city,
        area: newVenue.area,
        address: newVenue.address,
        pincode: newVenue.pincode,
        priceMode: newVenue.priceMode,
        exactPrice: newVenue.priceMode === "EXACT" ? parseFloat(newVenue.exactPrice) || 0 : 0,
        estimatedMinPrice: newVenue.priceMode === "ESTIMATED" ? parseFloat(newVenue.estimatedMinPrice) || 0 : 0,
        estimatedMaxPrice: newVenue.priceMode === "ESTIMATED" ? parseFloat(newVenue.estimatedMaxPrice) || 0 : 0,
        minGuests: newVenue.minGuests,
        maxGuests: newVenue.maxGuests,
        venueType: newVenue.venueType,
        amenities: newVenue.amenities.split(",").map(a => a.trim()),
        images: newVenue.images ? newVenue.images.split(",").map(i => i.trim()) : [],
        coverImage: newVenue.images ? newVenue.images.split(",")[0] : "",
        ownerId: session?.user?.id
      };
      
      const res = await api.createVenue(venueData);
      if (res.error) alert("Failed: " + res.error);
      else {
        alert("Venue created!");
        setShowAddVenue(false);
        setNewVenue({ name: "", description: "", city: "", area: "", address: "", pincode: "", priceMode: "EXACT", exactPrice: "", estimatedMinPrice: "", estimatedMaxPrice: "", minGuests: "50", maxGuests: "500", venueType: "Banquet Hall", amenities: "Parking,AC,Catering", images: "" });
        fetchData();
      }
    } catch (err) { alert("Failed to create venue"); }
    finally { setSaving(false); }
  };

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
          <button onClick={() => setShowAddVenue(true)} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90">
            <Plus className="h-5 w-5" /> Add New Venue
          </button>
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
        </div>

        {/* Venues Tab */}
        {activeTab === "venues" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">My Venues</h2>
          
          {venues.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No venues yet</h3>
              <p className="text-gray-500 mb-6">Add your first venue to start receiving bookings</p>
              <button onClick={() => setShowAddVenue(true)} className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold">
                <Plus className="h-5 w-5" /> Add Your First Venue
              </button>
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
        {showAddVenue && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
                <h2 className="text-2xl font-bold">Add New Venue</h2>
                <button onClick={() => setShowAddVenue(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-6 w-6" /></button>
              </div>
              
              <form onSubmit={handleAddVenue} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Venue Name *</label>
                    <input type="text" required value={newVenue.name} onChange={(e) => setNewVenue({...newVenue, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border" placeholder="Grand Palace" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select value={newVenue.venueType} onChange={(e) => setNewVenue({...newVenue, venueType: e.target.value})} className="w-full px-4 py-3 rounded-xl border">
                      <option>Banquet Hall</option><option>Resort</option><option>Hotel</option><option>Farmhouse</option><option>Garden/Lawn</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description *</label>
                  <textarea required rows={2} value={newVenue.description} onChange={(e) => setNewVenue({...newVenue, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border" placeholder="Describe your venue..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">City *</label>
                    <input type="text" required value={newVenue.city} onChange={(e) => setNewVenue({...newVenue, city: e.target.value})} className="w-full px-4 py-3 rounded-xl border" placeholder="Mumbai" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Area *</label>
                    <input type="text" required value={newVenue.area} onChange={(e) => setNewVenue({...newVenue, area: e.target.value})} className="w-full px-4 py-3 rounded-xl border" placeholder="Andheri" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Address *</label>
                    <input type="text" required value={newVenue.address} onChange={(e) => setNewVenue({...newVenue, address: e.target.value})} className="w-full px-4 py-3 rounded-xl border" placeholder="Full address" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Pincode *</label>
                    <input type="text" required value={newVenue.pincode} onChange={(e) => setNewVenue({...newVenue, pincode: e.target.value})} className="w-full px-4 py-3 rounded-xl border" placeholder="400001" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Price Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2"><input type="radio" checked={newVenue.priceMode === "EXACT"} onChange={() => setNewVenue({...newVenue, priceMode: "EXACT"})} /><span>Fixed Price</span></label>
                    <label className="flex items-center gap-2"><input type="radio" checked={newVenue.priceMode === "ESTIMATED"} onChange={() => setNewVenue({...newVenue, priceMode: "ESTIMATED"})} /><span>Price Range</span></label>
                  </div>
                </div>

                {newVenue.priceMode === "EXACT" ? (
                  <div>
                    <label className="block text-sm font-medium mb-1">Price (₹) *</label>
                    <input type="number" required value={newVenue.exactPrice} onChange={(e) => setNewVenue({...newVenue, exactPrice: e.target.value})} className="w-full px-4 py-3 rounded-xl border" placeholder="150000" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Min Price *</label>
                      <input type="number" required value={newVenue.estimatedMinPrice} onChange={(e) => setNewVenue({...newVenue, estimatedMinPrice: e.target.value})} className="w-full px-4 py-3 rounded-xl border" placeholder="100000" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Max Price *</label>
                      <input type="number" required value={newVenue.estimatedMaxPrice} onChange={(e) => setNewVenue({...newVenue, estimatedMaxPrice: e.target.value})} className="w-full px-4 py-3 rounded-xl border" placeholder="300000" />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Min Guests</label>
                    <input type="number" value={newVenue.minGuests} onChange={(e) => setNewVenue({...newVenue, minGuests: e.target.value})} className="w-full px-4 py-3 rounded-xl border" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Guests</label>
                    <input type="number" value={newVenue.maxGuests} onChange={(e) => setNewVenue({...newVenue, maxGuests: e.target.value})} className="w-full px-4 py-3 rounded-xl border" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Amenities</label>
                  <input type="text" value={newVenue.amenities} onChange={(e) => setNewVenue({...newVenue, amenities: e.target.value})} className="w-full px-4 py-3 rounded-xl border" placeholder="Parking,AC,Catering" />
                  <p className="text-xs text-gray-500 mt-1">Comma separated</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Image URLs</label>
                  <input type="text" value={newVenue.images} onChange={(e) => setNewVenue({...newVenue, images: e.target.value})} className="w-full px-4 py-3 rounded-xl border" placeholder="https://example.com/image.jpg" />
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowAddVenue(false)} className="flex-1 px-6 py-3 rounded-xl border font-semibold">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold disabled:opacity-50">
                    {saving ? "Saving..." : "Add Venue"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
