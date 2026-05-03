"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2,
  Search,
  Filter,
  Eye,
  Phone,
  CheckCircle2,
  XCircle,
  User,
  Tag,
  Loader2,
  ArrowLeft,
  Plus,
  MapPin,
} from "lucide-react";

type Venue = {
  id: string;
  name: string;
  slug: string;
  city: string;
  area?: string;
  isVerified: boolean;
  isAdminListed: boolean;
  bookingEnabled: boolean;
  contactNumber?: string;
  contactName?: string;
  viewCount: number;
  exactPrice?: number;
  estimatedMinPrice?: number;
  marriagePrice?: number;
  birthdayPrice?: number;
  otherEventPrice?: number;
  taggedToOwner?: {
    id: string;
    name: string;
    email: string;
  };
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
};

type VenueOwner = {
  id: string;
  name: string;
  email: string;
};

export default function AdminVenuesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venueOwners, setVenueOwners] = useState<VenueOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "fishbowl" | "verified">("all");
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [tagLoading, setTagLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      if ((session?.user as any)?.role !== "ADMIN") {
        router.push("/");
      } else {
        fetchVenues();
        fetchVenueOwners();
      }
    } else if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, session, router]);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/venues");
      const data = await response.json();
      if (data.success) {
        setVenues(data.venues || []);
      }
    } catch (error) {
      console.error("Failed to fetch venues:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVenueOwners = async () => {
    try {
      const response = await fetch("/api/admin/users?role=VENUE_OWNER");
      const data = await response.json();
      if (data.users) {
        setVenueOwners(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch venue owners:", error);
    }
  };

  const handleTagOwner = async () => {
    if (!selectedVenue || !selectedOwnerId) return;

    try {
      setTagLoading(true);
      const response = await fetch(`/api/admin/venues/${selectedVenue.id}/tag-owner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: selectedOwnerId }),
      });

      const data = await response.json();
      if (data.success) {
        fetchVenues();
        setTagModalOpen(false);
        setSelectedVenue(null);
        setSelectedOwnerId("");
      } else {
        alert(data.error || "Failed to tag owner");
      }
    } catch (error) {
      alert("Failed to tag owner");
    } finally {
      setTagLoading(false);
    }
  };

  const handleToggleBooking = async (venue: Venue) => {
    try {
      const response = await fetch(`/api/admin/venues/${venue.id}/toggle-booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !venue.bookingEnabled }),
      });

      const data = await response.json();
      if (data.success) {
        fetchVenues();
      } else {
        alert(data.error || "Failed to toggle booking");
      }
    } catch (error) {
      alert("Failed to toggle booking");
    }
  };

  const filteredVenues = venues.filter((venue) => {
    const matchesSearch =
      venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterType === "fishbowl") {
      return matchesSearch && venue.isAdminListed && !venue.bookingEnabled;
    }
    if (filterType === "verified") {
      return matchesSearch && venue.bookingEnabled;
    }
    return matchesSearch;
  });

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-24 pt-8">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin")}
              className="p-2 rounded-full hover:bg-white/60 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gradient">Manage Venues</h1>
              <p className="text-gray-600">Tag owners and enable online booking</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/admin/venues/add")}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 font-semibold text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="h-5 w-5" />
            Add Venue
          </button>
        </div>

        {/* Search & Filter */}
        <div className="glass-card rounded-2xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-600 outline-none"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "fishbowl", "verified"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    filterType === type
                      ? "bg-purple-600 text-white"
                      : "bg-white/60 text-gray-700 hover:bg-white"
                  }`}
                >
                  {type === "all" && "All"}
                  {type === "fishbowl" && "🐟 Fishbowl"}
                  {type === "verified" && "✓ Verified"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-card rounded-xl p-4">
            <p className="text-3xl font-bold text-gradient">{venues.length}</p>
            <p className="text-sm text-gray-600">Total Venues</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-3xl font-bold text-amber-600">
              {venues.filter(v => v.isAdminListed && !v.bookingEnabled).length}
            </p>
            <p className="text-sm text-gray-600">Fishbowl</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-3xl font-bold text-green-600">
              {venues.filter(v => v.bookingEnabled).length}
            </p>
            <p className="text-sm text-gray-600">Online Booking</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-3xl font-bold text-blue-600">{venueOwners.length}</p>
            <p className="text-sm text-gray-600">Venue Owners</p>
          </div>
        </div>

        {/* Venues List */}
        <div className="space-y-4">
          {filteredVenues.map((venue) => (
            <motion.div
              key={venue.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Venue Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{venue.name}</h3>
                    {venue.isAdminListed && !venue.bookingEnabled && (
                      <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                        🐟 Fishbowl
                      </span>
                    )}
                    {venue.bookingEnabled && (
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                        ✓ Online Booking
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {venue.area ? `${venue.area}, ${venue.city}` : venue.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {venue.viewCount || 0} views
                    </span>
                    {venue.contactNumber && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {venue.contactNumber}
                      </span>
                    )}
                  </div>

                  {/* Price Info */}
                  <div className="mt-2 text-sm flex flex-wrap gap-3">
                    {venue.marriagePrice && (
                      <span className="text-rose-600">💍 ₹{venue.marriagePrice.toLocaleString()}</span>
                    )}
                    {venue.birthdayPrice && (
                      <span className="text-yellow-600">🎂 ₹{venue.birthdayPrice.toLocaleString()}</span>
                    )}
                    {venue.otherEventPrice && (
                      <span className="text-purple-600">🙏 ₹{venue.otherEventPrice.toLocaleString()}</span>
                    )}
                    {!venue.marriagePrice && !venue.birthdayPrice && !venue.otherEventPrice && venue.exactPrice && (
                      <span className="text-gray-600">₹{venue.exactPrice.toLocaleString()}</span>
                    )}
                  </div>

                  {/* Owner Info */}
                  {(venue.taggedToOwner || venue.owner) && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">
                        Tagged to: {venue.taggedToOwner?.name || venue.owner?.name}
                      </span>
                      <span className="text-gray-500">
                        ({venue.taggedToOwner?.email || venue.owner?.email})
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {/* Tag Owner Button */}
                  <button
                    onClick={() => {
                      setSelectedVenue(venue);
                      setSelectedOwnerId(venue.taggedToOwner?.id || venue.owner?.id || "");
                      setTagModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                  >
                    <Tag className="h-4 w-4" />
                    {venue.taggedToOwner || venue.owner ? "Change Owner" : "Tag Owner"}
                  </button>

                  {/* Toggle Booking */}
                  <button
                    onClick={() => handleToggleBooking(venue)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                      venue.bookingEnabled
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {venue.bookingEnabled ? (
                      <>
                        <XCircle className="h-4 w-4" />
                        Disable Booking
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Enable Booking
                      </>
                    )}
                  </button>

                  {/* View */}
                  <button
                    onClick={() => router.push(`/venues/${venue.slug}`)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredVenues.length === 0 && (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-600">No venues found</p>
              <p className="text-gray-500">Try adjusting your search or filter</p>
            </div>
          )}
        </div>
      </div>

      {/* Tag Owner Modal */}
      {tagModalOpen && selectedVenue && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-3xl p-8 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold text-gradient mb-2">Tag Owner</h2>
            <p className="text-gray-600 mb-6">
              Assign <strong>{selectedVenue.name}</strong> to a venue owner
            </p>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Venue Owner
              </label>
              <select
                value={selectedOwnerId}
                onChange={(e) => setSelectedOwnerId(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-purple-600 outline-none"
              >
                <option value="">-- Select Owner --</option>
                {venueOwners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name} ({owner.email})
                  </option>
                ))}
              </select>
            </div>

            {selectedOwnerId && (
              <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200">
                <p className="text-sm text-green-700">
                  ✓ After tagging, online booking will be <strong>enabled</strong> for this venue.
                  The owner will be able to manage their bookings from their dashboard.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setTagModalOpen(false);
                  setSelectedVenue(null);
                  setSelectedOwnerId("");
                }}
                className="flex-1 rounded-xl border-2 border-gray-200 py-3 font-semibold text-gray-700 hover:bg-white/60 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTagOwner}
                disabled={!selectedOwnerId || tagLoading}
                className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {tagLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Tagging...
                  </>
                ) : (
                  "Tag & Enable Booking"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
