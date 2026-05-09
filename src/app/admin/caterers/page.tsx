"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Utensils,
  Search,
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
  Leaf,
  ShieldCheck,
  Bell,
  Pencil,
  Trash2,
} from "lucide-react";

type Caterer = {
  id: string;
  name: string;
  slug: string;
  city: string;
  area?: string;
  isPureVeg: boolean;
  isVerified: boolean;
  isAdminListed: boolean;
  bookingEnabled: boolean;
  contactNumber?: string;
  contactName?: string;
  viewCount: number;
  minPlatePrice?: number;
  silverPrice?: number;
  goldPrice?: number;
  platinumPrice?: number;
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
  verificationRequestedAt?: string | null;
};

type CateringOwner = {
  id: string;
  name: string;
  email: string;
};

export default function AdminCaterersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [caterers, setCaterers] = useState<Caterer[]>([]);
  const [cateringOwners, setCateringOwners] = useState<CateringOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "fishbowl" | "verified" | "requested">("all");
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [selectedCaterer, setSelectedCaterer] = useState<Caterer | null>(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [tagLoading, setTagLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      if ((session?.user as any)?.role !== "ADMIN") {
        router.push("/");
      } else {
        fetchCaterers();
        fetchCateringOwners();
      }
    } else if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, session, router]);

  const fetchCaterers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/caterers");
      const data = await response.json();
      if (data.success) {
        setCaterers(data.caterers || []);
      }
    } catch (error) {
      console.error("Failed to fetch caterers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCateringOwners = async () => {
    try {
      const response = await fetch("/api/admin/users?role=CATERING_OWNER");
      const data = await response.json();
      if (data.users) {
        setCateringOwners(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch catering owners:", error);
    }
  };

  const handleTagOwner = async () => {
    if (!selectedCaterer || !selectedOwnerId) return;

    try {
      setTagLoading(true);
      const response = await fetch(`/api/admin/caterers/${selectedCaterer.id}/tag-owner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: selectedOwnerId }),
      });

      const data = await response.json();
      if (data.success) {
        fetchCaterers();
        setTagModalOpen(false);
        setSelectedCaterer(null);
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

  const handleToggleBooking = async (caterer: Caterer) => {
    try {
      const response = await fetch(`/api/admin/caterers/${caterer.id}/toggle-booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !caterer.bookingEnabled }),
      });

      const data = await response.json();
      if (data.success) {
        fetchCaterers();
      } else {
        alert(data.error || "Failed to toggle booking");
      }
    } catch (error) {
      alert("Failed to toggle booking");
    }
  };

  const handleApproveVerification = async (caterer: Caterer) => {
    setApprovingId(caterer.id);
    try {
      const res = await fetch(`/api/admin/caterers/${caterer.id}/approve-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Approved by admin" }),
      });
      const data = await res.json();
      if (data.success) {
        fetchCaterers();
      } else {
        alert(data.error || "Failed to approve");
      }
    } catch {
      alert("Failed to approve");
    } finally {
      setApprovingId(null);
    }
  };

  const verificationRequestCount = caterers.filter(c => c.verificationRequestedAt && !c.bookingEnabled).length;

  const handleDelete = async (caterer: Caterer) => {
    if (!confirm(`Delete "${caterer.name}"? This cannot be undone.`)) return;
    try {
      setDeletingId(caterer.id);
      const res = await fetch(`/api/admin/caterers/${caterer.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setCaterers((prev) => prev.filter((c) => c.id !== caterer.id));
      } else {
        alert(data.error || "Failed to delete caterer");
      }
    } catch {
      alert("Failed to delete caterer");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCaterers = caterers.filter((caterer) => {
    const matchesSearch =
      caterer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caterer.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterType === "fishbowl") {
      return matchesSearch && caterer.isAdminListed && !caterer.bookingEnabled;
    }
    if (filterType === "verified") {
      return matchesSearch && caterer.bookingEnabled;
    }
    if (filterType === "requested") {
      return matchesSearch && !!caterer.verificationRequestedAt && !caterer.bookingEnabled;
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
              <h1 className="text-3xl font-bold text-gradient">Manage Caterers</h1>
              <p className="text-gray-600">Tag owners and enable online booking</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/admin/caterers/add")}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 font-semibold text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="h-5 w-5" />
            Add Caterer
          </button>
        </div>

        {/* Search & Filter */}
        <div className="glass-card rounded-2xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search caterers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-600 outline-none"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(["all", "fishbowl", "requested", "verified"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-3 rounded-xl font-medium transition-all relative ${
                    filterType === type
                      ? "bg-purple-600 text-white"
                      : "bg-white/60 text-gray-700 hover:bg-white"
                  }`}
                >
                  {type === "all" && "All"}
                  {type === "fishbowl" && "🐟 Fishbowl"}
                  {type === "requested" && (
                    <span className="flex items-center gap-1.5">
                      <Bell className="h-4 w-4" />
                      Requested
                      {verificationRequestCount > 0 && (
                        <span className="ml-1 bg-orange-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
                          {verificationRequestCount}
                        </span>
                      )}
                    </span>
                  )}
                  {type === "verified" && "✓ Verified"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-card rounded-xl p-4">
            <p className="text-3xl font-bold text-gradient">{caterers.length}</p>
            <p className="text-sm text-gray-600">Total Caterers</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-3xl font-bold text-amber-600">
              {caterers.filter(c => c.isAdminListed && !c.bookingEnabled).length}
            </p>
            <p className="text-sm text-gray-600">Fishbowl</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-3xl font-bold text-green-600">
              {caterers.filter(c => c.bookingEnabled).length}
            </p>
            <p className="text-sm text-gray-600">Online Booking</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-3xl font-bold text-blue-600">{cateringOwners.length}</p>
            <p className="text-sm text-gray-600">Catering Owners</p>
          </div>
        </div>

        {/* Caterers List */}
        <div className="space-y-4">
          {filteredCaterers.map((caterer) => (
            <motion.div
              key={caterer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Caterer Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{caterer.name}</h3>
                    {caterer.isPureVeg && (
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium flex items-center gap-1">
                        <Leaf className="h-3 w-3" />
                        Pure Veg
                      </span>
                    )}
                    {caterer.isAdminListed && !caterer.bookingEnabled && (
                      <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                        🐟 Fishbowl
                      </span>
                    )}
                    {caterer.bookingEnabled && (
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                        ✓ Online Booking
                      </span>
                    )}
                    {caterer.verificationRequestedAt && !caterer.bookingEnabled && (
                      <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold flex items-center gap-1 animate-pulse">
                        <Bell className="h-3 w-3" />
                        Verification Requested
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {caterer.area ? `${caterer.area}, ${caterer.city}` : caterer.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {caterer.viewCount || 0} views
                    </span>
                    {caterer.contactNumber && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {caterer.contactNumber}
                      </span>
                    )}
                  </div>

                  {/* Price Info */}
                  <div className="mt-2 text-sm flex flex-wrap gap-3">
                    {caterer.silverPrice && (
                      <span className="text-gray-600">
                        Silver: ₹{caterer.silverPrice}/plate
                      </span>
                    )}
                    {caterer.goldPrice && (
                      <span className="text-amber-600">
                        Gold: ₹{caterer.goldPrice}/plate
                      </span>
                    )}
                    {caterer.platinumPrice && (
                      <span className="text-purple-600">
                        Platinum: ₹{caterer.platinumPrice}/plate
                      </span>
                    )}
                    {!caterer.silverPrice && !caterer.goldPrice && !caterer.platinumPrice && caterer.minPlatePrice && (
                      <span className="text-purple-600">
                        Starting: ₹{caterer.minPlatePrice}/plate
                      </span>
                    )}
                  </div>

                  {/* Owner Info */}
                  {(caterer.taggedToOwner || caterer.owner) && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">
                        Tagged to: {caterer.taggedToOwner?.name || caterer.owner?.name}
                      </span>
                      <span className="text-gray-500">
                        ({caterer.taggedToOwner?.email || caterer.owner?.email})
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {/* Tag Owner Button */}
                  <button
                    onClick={() => {
                      setSelectedCaterer(caterer);
                      setSelectedOwnerId(caterer.taggedToOwner?.id || caterer.owner?.id || "");
                      setTagModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                  >
                    <Tag className="h-4 w-4" />
                    {caterer.taggedToOwner || caterer.owner ? "Change Owner" : "Tag Owner"}
                  </button>

                  {/* One-click Approve Verification */}
                  {caterer.verificationRequestedAt && !caterer.bookingEnabled && (
                    <button
                      onClick={() => handleApproveVerification(caterer)}
                      disabled={approvingId === caterer.id}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50 font-semibold"
                    >
                      {approvingId === caterer.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                      Approve
                    </button>
                  )}

                  {/* Toggle Booking */}
                  <button
                    onClick={() => handleToggleBooking(caterer)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                      caterer.bookingEnabled
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {caterer.bookingEnabled ? (
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

                  {/* Edit */}
                  <button
                    onClick={() => router.push(`/admin/caterers/${caterer.id}/edit`)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>

                  {/* View */}
                  <button
                    onClick={() => router.push(`/catering/${caterer.slug}`)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(caterer)}
                    disabled={deletingId === caterer.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                  >
                    {deletingId === caterer.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredCaterers.length === 0 && (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-600">No caterers found</p>
              <p className="text-gray-500">Try adjusting your search or filter</p>
            </div>
          )}
        </div>
      </div>

      {/* Tag Owner Modal */}
      {tagModalOpen && selectedCaterer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-3xl p-8 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold text-gradient mb-2">Tag Owner</h2>
            <p className="text-gray-600 mb-6">
              Assign <strong>{selectedCaterer.name}</strong> to a catering owner
            </p>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Catering Owner
              </label>
              <select
                value={selectedOwnerId}
                onChange={(e) => setSelectedOwnerId(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-purple-600 outline-none"
              >
                <option value="">-- Select Owner --</option>
                {cateringOwners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name} ({owner.email})
                  </option>
                ))}
              </select>
            </div>

            {selectedOwnerId && (
              <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200">
                <p className="text-sm text-green-700">
                  ✓ After tagging, online booking will be <strong>enabled</strong> for this caterer.
                  The owner will be able to manage their bookings from their dashboard.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setTagModalOpen(false);
                  setSelectedCaterer(null);
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
