"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building,
  UtensilsCrossed,
  Eye,
  Check,
  X,
  Plus,
  Clock,
  CheckCircle2,
  MapPin,
  Users,
  DollarSign,
  Calendar
} from "lucide-react";
import { useRouter } from "next/navigation";

type PendingItem = {
  id: string;
  name: string;
  location: string;
  capacity?: number;
  price?: number;
  minGuests?: number;
  packages?: any[];
  ownerName?: string;
  ownerEmail?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt?: string;
  description?: string;
  amenities?: string[];
  images?: string[];
};

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "pending" | "bookings" | "addProperty">("overview");
  const [pendingVenues, setPendingVenues] = useState<PendingItem[]>([]);
  const [pendingCatering, setPendingCatering] = useState<PendingItem[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<PendingItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Add Property Form
  const [propertyForm, setPropertyForm] = useState({
    type: "VENUE" as "VENUE" | "CATERING",
    name: "",
    location: "",
    capacity: "",
    price: "",
    minGuests: "",
    description: "",
    amenities: "",
    ownerEmail: ""
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/auth/signin");
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "ADMIN") {
      router.push("/");
      return;
    }
    
    setUser(parsedUser);
    loadPendingItems();
  }, [router]);

  const loadPendingItems = () => {
    const venues = JSON.parse(localStorage.getItem("myVenues") || "[]");
    const catering = JSON.parse(localStorage.getItem("myCaterers") || "[]");
    const bookings = JSON.parse(localStorage.getItem("bookings") || "[]");
    
    setPendingVenues(venues.filter((v: PendingItem) => v.status === "PENDING"));
    setPendingCatering(catering.filter((c: PendingItem) => c.status === "PENDING"));
    setAllBookings(bookings);
  };

  const handleApprove = (item: PendingItem, type: "VENUE" | "CATERING") => {
    const storageKey = type === "VENUE" ? "myVenues" : "myCaterers";
    const items = JSON.parse(localStorage.getItem(storageKey) || "[]");
    
    const updatedItems = items.map((i: PendingItem) => 
      i.id === item.id ? { ...i, status: "APPROVED" } : i
    );
    
    localStorage.setItem(storageKey, JSON.stringify(updatedItems));
    loadPendingItems();
    setShowDetailsModal(false);
    alert(`${type === "VENUE" ? "Venue" : "Catering service"} approved successfully!`);
  };

  const handleReject = (item: PendingItem, type: "VENUE" | "CATERING") => {
    if (!confirm(`Are you sure you want to reject "${item.name}"?`)) return;
    
    const storageKey = type === "VENUE" ? "myVenues" : "myCaterers";
    const items = JSON.parse(localStorage.getItem(storageKey) || "[]");
    
    const updatedItems = items.filter((i: PendingItem) => i.id !== item.id);
    
    localStorage.setItem(storageKey, JSON.stringify(updatedItems));
    loadPendingItems();
    setShowDetailsModal(false);
    alert(`${type === "VENUE" ? "Venue" : "Catering service"} rejected.`);
  };

  const handleAddProperty = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newProperty: PendingItem = {
      id: Date.now().toString(),
      name: propertyForm.name,
      location: propertyForm.location,
      capacity: propertyForm.capacity ? parseInt(propertyForm.capacity) : undefined,
      price: propertyForm.price ? parseFloat(propertyForm.price) : undefined,
      minGuests: propertyForm.minGuests ? parseInt(propertyForm.minGuests) : undefined,
      description: propertyForm.description,
      amenities: propertyForm.amenities.split(",").map(a => a.trim()),
      ownerEmail: propertyForm.ownerEmail || undefined,
      status: "APPROVED",
      submittedAt: new Date().toISOString(),
      images: []
    };

    const storageKey = propertyForm.type === "VENUE" ? "myVenues" : "myCaterers";
    const existingItems = JSON.parse(localStorage.getItem(storageKey) || "[]");
    
    localStorage.setItem(storageKey, JSON.stringify([...existingItems, newProperty]));
    
    // Reset form
    setPropertyForm({
      type: "VENUE",
      name: "",
      location: "",
      capacity: "",
      price: "",
      minGuests: "",
      description: "",
      amenities: "",
      ownerEmail: ""
    });
    
    alert(`${propertyForm.type === "VENUE" ? "Venue" : "Catering service"} added successfully!`);
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center cosmic-gradient">Loading...</div>;
  }

  const totalPending = pendingVenues.length + pendingCatering.length;

  return (
    <div className="min-h-screen cosmic-gradient pb-24 pt-8">
      <div className="mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-rainbow mb-2">Admin Dashboard</h1>
          <p className="text-gray-700">Manage property approvals and add new listings</p>
        </motion.div>

        {/* Tabs */}
        <div className="mb-8 flex gap-3 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`rounded-full px-6 py-3 font-semibold transition-all whitespace-nowrap ${
              activeTab === "overview"
                ? "btn-rainbow text-white shadow-lg"
                : "glass-card-vibrant hover:bg-white/80"
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`rounded-full px-6 py-3 font-semibold transition-all whitespace-nowrap relative ${
              activeTab === "pending"
                ? "btn-rainbow text-white shadow-lg"
                : "glass-card-vibrant hover:bg-white/80"
            }`}
          >
            ⏳ Pending Approvals
            {totalPending > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {totalPending}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`rounded-full px-6 py-3 font-semibold transition-all whitespace-nowrap relative ${
              activeTab === "bookings"
                ? "btn-rainbow text-white shadow-lg"
                : "glass-card-vibrant hover:bg-white/80"
            }`}
          >
            📅 All Bookings
            <span className="ml-2 text-xs opacity-80">({allBookings.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("addProperty")}
            className={`rounded-full px-6 py-3 font-semibold transition-all whitespace-nowrap ${
              activeTab === "addProperty"
                ? "btn-rainbow text-white shadow-lg"
                : "glass-card-vibrant hover:bg-white/80"
            }`}
          >
            ➕ Add Property
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card-vibrant rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Pending Venues</span>
                <Building className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-4xl font-bold text-rainbow">{pendingVenues.length}</p>
              <p className="mt-2 text-xs text-gray-600">Awaiting approval</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card-vibrant rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Pending Catering</span>
                <UtensilsCrossed className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-4xl font-bold text-rainbow">{pendingCatering.length}</p>
              <p className="mt-2 text-xs text-gray-600">Awaiting approval</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card-vibrant rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Total Properties</span>
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-4xl font-bold text-rainbow">
                {JSON.parse(localStorage.getItem("myVenues") || "[]").length + 
                 JSON.parse(localStorage.getItem("myCaterers") || "[]").length}
              </p>
              <p className="mt-2 text-xs text-gray-600">All listings</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card-vibrant rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Requires Action</span>
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <p className="text-4xl font-bold text-rainbow">{totalPending}</p>
              <p className="mt-2 text-xs text-gray-600">Pending items</p>
            </motion.div>
          </div>
        )}

        {/* Pending Approvals Tab */}
        {activeTab === "pending" && (
          <div className="space-y-6">
            {/* Pending Venues */}
            {pendingVenues.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Building className="h-6 w-6 text-orange-600" />
                  Pending Venues ({pendingVenues.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {pendingVenues.map((venue) => (
                    <motion.div
                      key={venue.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass-card-vibrant rounded-2xl p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{venue.name}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <MapPin className="h-4 w-4" />
                            {venue.location}
                          </p>
                        </div>
                        <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">
                          <Clock className="h-3 w-3" />
                          PENDING
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        {venue.capacity && (
                          <p className="text-sm text-gray-700 flex items-center gap-2">
                            <Users className="h-4 w-4 text-orange-600" />
                            Capacity: <span className="font-semibold">{venue.capacity} guests</span>
                          </p>
                        )}
                        {venue.price && (
                          <p className="text-sm text-gray-700 flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            Price: <span className="font-semibold">₹{venue.price.toLocaleString('en-IN')}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedItem(venue);
                            setShowDetailsModal(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </button>
                        <button
                          onClick={() => handleApprove(venue, "VENUE")}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleReject(venue, "VENUE")}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Catering */}
            {pendingCatering.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <UtensilsCrossed className="h-6 w-6 text-red-600" />
                  Pending Catering ({pendingCatering.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {pendingCatering.map((catering) => (
                    <motion.div
                      key={catering.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass-card-vibrant rounded-2xl p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{catering.name}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <MapPin className="h-4 w-4" />
                            {catering.location}
                          </p>
                        </div>
                        <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">
                          <Clock className="h-3 w-3" />
                          PENDING
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        {catering.minGuests && (
                          <p className="text-sm text-gray-700 flex items-center gap-2">
                            <Users className="h-4 w-4 text-orange-600" />
                            Min Guests: <span className="font-semibold">{catering.minGuests}</span>
                          </p>
                        )}
                        {catering.packages && catering.packages.length > 0 && (
                          <p className="text-sm text-gray-700 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-purple-600" />
                            Packages: <span className="font-semibold">{catering.packages.length}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedItem(catering);
                            setShowDetailsModal(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </button>
                        <button
                          onClick={() => handleApprove(catering, "CATERING")}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleReject(catering, "CATERING")}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {totalPending === 0 && (
              <div className="glass-card-vibrant rounded-2xl p-12 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">All Caught Up!</h3>
                <p className="text-gray-600">No pending approvals at the moment.</p>
              </div>
            )}
          </div>
        )}

        {/* All Bookings Tab */}
        {activeTab === "bookings" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">All Platform Bookings</h2>
              <span className="text-sm text-gray-600">Total: {allBookings.length}</span>
            </div>

            {allBookings.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card-vibrant rounded-2xl p-12 text-center"
              >
                <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-xl font-semibold text-gray-600 mb-2">No bookings yet</p>
                <p className="text-gray-500">All customer bookings will appear here</p>
              </motion.div>
            ) : (
              <div className="grid gap-4">
                {allBookings.map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card-vibrant rounded-2xl p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {booking.type === "VENUE" ? (
                            <Building className="h-5 w-5 text-orange-600" />
                          ) : (
                            <UtensilsCrossed className="h-5 w-5 text-red-600" />
                          )}
                          <h3 className="text-lg font-bold text-gray-900">
                            {booking.venueName || booking.catererName}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.status === "CONFIRMED" 
                              ? "bg-green-100 text-green-700"
                              : booking.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-gray-500">Customer</p>
                            <p className="text-sm font-semibold text-gray-900">{booking.userName || "Guest User"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Date</p>
                            <p className="text-sm font-semibold text-gray-900">{booking.date}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Guests</p>
                            <p className="text-sm font-semibold text-gray-900">{booking.guests} people</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Amount</p>
                            <p className="text-sm font-semibold text-green-600">
                              ₹{booking.amount.toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Property Tab */}
        {activeTab === "addProperty" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card-vibrant rounded-3xl p-8 max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-rainbow mb-6">Add New Property</h2>
            
            <form onSubmit={handleAddProperty} className="space-y-6">
              {/* Property Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Property Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPropertyForm({ ...propertyForm, type: "VENUE" })}
                    className={`p-4 rounded-xl font-semibold transition-all ${
                      propertyForm.type === "VENUE"
                        ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg"
                        : "glass-card hover:bg-white/80"
                    }`}
                  >
                    <Building className="h-6 w-6 mx-auto mb-2" />
                    Venue
                  </button>
                  <button
                    type="button"
                    onClick={() => setPropertyForm({ ...propertyForm, type: "CATERING" })}
                    className={`p-4 rounded-xl font-semibold transition-all ${
                      propertyForm.type === "CATERING"
                        ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg"
                        : "glass-card hover:bg-white/80"
                    }`}
                  >
                    <UtensilsCrossed className="h-6 w-6 mx-auto mb-2" />
                    Catering
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {propertyForm.type === "VENUE" ? "Venue Name" : "Catering Service Name"} *
                </label>
                <input
                  type="text"
                  required
                  value={propertyForm.name}
                  onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                  placeholder="Enter property name"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location *</label>
                <input
                  type="text"
                  required
                  value={propertyForm.location}
                  onChange={(e) => setPropertyForm({ ...propertyForm, location: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                  placeholder="City, State"
                />
              </div>

              {/* Capacity / Min Guests */}
              <div className="grid grid-cols-2 gap-4">
                {propertyForm.type === "VENUE" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Capacity</label>
                    <input
                      type="number"
                      value={propertyForm.capacity}
                      onChange={(e) => setPropertyForm({ ...propertyForm, capacity: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                      placeholder="Max guests"
                    />
                  </div>
                )}
                {propertyForm.type === "CATERING" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Min Guests</label>
                    <input
                      type="number"
                      value={propertyForm.minGuests}
                      onChange={(e) => setPropertyForm({ ...propertyForm, minGuests: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                      placeholder="Minimum guests"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price (₹)</label>
                  <input
                    type="number"
                    value={propertyForm.price}
                    onChange={(e) => setPropertyForm({ ...propertyForm, price: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="Base price"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={propertyForm.description}
                  onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                  rows={4}
                  placeholder="Describe the property..."
                />
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Amenities/Features (comma-separated)
                </label>
                <input
                  type="text"
                  value={propertyForm.amenities}
                  onChange={(e) => setPropertyForm({ ...propertyForm, amenities: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                  placeholder="WiFi, Parking, AC, etc."
                />
              </div>

              {/* Owner Email (Optional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tag to Owner (Optional)
                </label>
                <input
                  type="email"
                  value={propertyForm.ownerEmail}
                  onChange={(e) => setPropertyForm({ ...propertyForm, ownerEmail: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                  placeholder="owner@example.com"
                />
                <p className="mt-2 text-xs text-gray-600">Leave empty if not tagging to a specific owner</p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full btn-rainbow text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add {propertyForm.type === "VENUE" ? "Venue" : "Catering Service"}
              </button>
            </form>
          </motion.div>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowDetailsModal(false)}
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
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedItem.name}</h2>
                  <p className="text-gray-600 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {selectedItem.location}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                {selectedItem.capacity && (
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-orange-600" />
                    <span className="text-gray-700">
                      <span className="font-semibold">Capacity:</span> {selectedItem.capacity} guests
                    </span>
                  </div>
                )}
                {selectedItem.minGuests && (
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-orange-600" />
                    <span className="text-gray-700">
                      <span className="font-semibold">Min Guests:</span> {selectedItem.minGuests}
                    </span>
                  </div>
                )}
                {selectedItem.price && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">
                      <span className="font-semibold">Price:</span> ₹{selectedItem.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                {selectedItem.description && (
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">Description:</p>
                    <p className="text-gray-700">{selectedItem.description}</p>
                  </div>
                )}
                {selectedItem.amenities && selectedItem.amenities.length > 0 && (
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">Amenities:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.amenities.map((amenity, index) => (
                        <span
                          key={index}
                          className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedItem.ownerEmail && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-700">
                      <span className="font-semibold">Owner:</span> {selectedItem.ownerEmail}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(selectedItem, selectedItem.capacity !== undefined ? "VENUE" : "CATERING")}
                  className="flex-1 btn-rainbow text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Check className="h-5 w-5" />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(selectedItem, selectedItem.capacity !== undefined ? "VENUE" : "CATERING")}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <X className="h-5 w-5" />
                  Reject
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
