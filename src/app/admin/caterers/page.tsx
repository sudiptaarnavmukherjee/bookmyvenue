"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Utensils,
  UtensilsCrossed,
  Search,
  Eye,
  Phone,
  CheckCircle2,
  XCircle,
  User,
  Tag,
  Mail,
  X as XIcon,
  Loader2,
  ArrowLeft,
  Plus,
  MapPin,
  Leaf,
  ShieldCheck,
  Bell,
  Pencil,
  Trash2,
  Wand2,
} from "lucide-react";
import { parseCatererVerificationNotes } from "@/lib/verification";
import { assessCatererTrust, getQualityLabel } from "@/lib/listing-trust";

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
  description?: string;
  images?: string;
  coverImage?: string;
  latitude?: number | null;
  longitude?: number | null;
  cuisines?: string;
  minGuests?: number;
  updatedAt?: string;
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
  verificationNotes?: string | null;
};

export default function AdminCaterersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [caterers, setCaterers] = useState<Caterer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "fishbowl" | "verified" | "requested" | "low-quality">("all");
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [selectedCaterer, setSelectedCaterer] = useState<Caterer | null>(null);
  const [tagEmail, setTagEmail] = useState("");
  const [tagLoading, setTagLoading] = useState(false);
  const [tagMsg, setTagMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      if ((session?.user as any)?.role !== "ADMIN") {
        router.push("/");
      } else {
        fetchCaterers();
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

  const handleTagByEmail = async () => {
    if (!selectedCaterer || !tagEmail.trim()) return;
    setTagLoading(true);
    setTagMsg(null);
    try {
      const res = await fetch(`/api/admin/caterers/${selectedCaterer.id}/tag-owner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: tagEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (data.success) {
        setTagMsg({ type: "success", text: `✅ Owner tagged & booking enabled` });
        fetchCaterers();
        setTimeout(() => {
          setTagModalOpen(false);
          setTagEmail("");
          setTagMsg(null);
          setSelectedCaterer(null);
        }, 1500);
      } else {
        setTagMsg({ type: "error", text: `❌ ${data.error || "Failed to tag"}` });
      }
    } catch {
      setTagMsg({ type: "error", text: "❌ Request failed. Please try again." });
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

  const handleRejectVerification = async (caterer: Caterer) => {
    const reason = prompt(`Reason for rejecting "${caterer.name}" verification:\n(This will be emailed to the owner)`);
    if (reason === null) return; // cancelled
    setRejectingId(caterer.id);
    try {
      const res = await fetch(`/api/admin/caterers/${caterer.id}/reject-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || "Please resubmit clearer KYC documents." }),
      });
      const data = await res.json();
      if (data.success) {
        fetchCaterers();
      } else {
        alert(data.error || "Failed to reject");
      }
    } catch {
      alert("Failed to reject");
    } finally {
      setRejectingId(null);
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
    if (filterType === "low-quality") {
      const trust = getCatererTrust(caterer);
      return matchesSearch && trust.qualityScore < 40;
    }
    return matchesSearch;
  });

  const getCatererTrust = (caterer: Caterer) => {
    const imageCount = caterer.images
      ? caterer.images.split(",").filter(Boolean).length
      : caterer.coverImage
        ? 1
        : 0;

    return assessCatererTrust({
      hasCoverImage: Boolean(caterer.coverImage),
      imagesCount: imageCount,
      hasDescription: Boolean(caterer.description && caterer.description.trim().length >= 40),
      hasCity: Boolean(caterer.city),
      hasArea: Boolean(caterer.area),
      hasCoordinates: Boolean(caterer.latitude && caterer.longitude),
      hasMinPlatePrice: Boolean(caterer.minPlatePrice),
      hasTierCount: [caterer.silverPrice, caterer.goldPrice, caterer.platinumPrice].filter(Boolean).length,
      hasCuisineData: Boolean(caterer.cuisines && caterer.cuisines.trim()),
      hasMinGuests: Boolean(caterer.minGuests),
      hasMenuPackages: false,
      hasContactDetails: Boolean(caterer.contactNumber || caterer.contactName),
      viewCount: caterer.viewCount,
      updatedAt: caterer.updatedAt,
      isVerified: caterer.isVerified,
    });
  };

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
          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                setSeedLoading(true);
                const r = await fetch("/api/admin/seed-bengali-menu", { method: "POST" });
                const d = await r.json();
                alert(d.message || d.error || "Done");
                setSeedLoading(false);
              }}
              disabled={seedLoading}
              className="flex items-center gap-2 rounded-xl bg-white/80 border-2 border-green-200 px-4 py-3 font-semibold text-green-700 hover:bg-green-50 transition-all disabled:opacity-50"
            >
              {seedLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
              Seed Bengali Menu
            </button>
            <button
              onClick={() => router.push("/admin/caterers/add")}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 font-semibold text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="h-5 w-5" />
              Add Caterer
            </button>
          </div>
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
              {(["all", "fishbowl", "requested", "verified", "low-quality"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-3 rounded-xl font-medium transition-all relative ${
                    filterType === type
                      ? type === "low-quality"
                        ? "bg-red-600 text-white"
                        : "bg-purple-600 text-white"
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
                  {type === "low-quality" && (
                    <span className="flex items-center gap-1.5">
                      ⚠️ Low Quality
                      {filterType !== "low-quality" && (
                        <span className="ml-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
                          {caterers.filter(c => getCatererTrust(c).qualityScore < 40).length}
                        </span>
                      )}
                    </span>
                  )}
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
            <p className="text-3xl font-bold text-blue-600">{caterers.filter(c => c.taggedToOwner || c.owner).length}</p>
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
              {(() => {
                const verificationDetails = parseCatererVerificationNotes(caterer.verificationNotes);
                return (
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Caterer Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <button
                      onClick={() => router.push(`/admin/caterers/${caterer.id}`)}
                      className="text-xl font-bold text-gray-900 hover:text-purple-700 transition-colors text-left"
                    >
                      {caterer.name}
                    </button>
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

                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                    <p className="font-semibold text-slate-700">
                      {(() => {
                        const trust = getCatererTrust(caterer);
                        return `Quality ${trust.qualityScore}/100 (${trust.completedItems}/${trust.totalItems}) - ${getQualityLabel(trust.qualityScore)}`;
                      })()}
                    </p>
                    <p className="mt-1 text-slate-500">
                      {(() => {
                        const trust = getCatererTrust(caterer);
                        const missing = trust.checklist.filter((item) => !item.done).slice(0, 2);
                        return missing.length > 0
                          ? `Missing: ${missing.map((item) => item.label).join(", ")}`
                          : "Checklist complete for this listing";
                      })()}
                    </p>
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

                  {caterer.verificationRequestedAt && !caterer.bookingEnabled && verificationDetails && (
                    <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs text-orange-900">
                      {verificationDetails.ownerNote ? (
                        <p className="mb-2"><strong>Owner note:</strong> {verificationDetails.ownerNote}</p>
                      ) : null}
                      {verificationDetails.kycDocuments.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {verificationDetails.kycDocuments.map((doc) => (
                            <a
                              key={`${doc.label}-${doc.url}`}
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:text-orange-700"
                            >
                              {doc.label} document
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {/* Open / Menu Builder */}
                  <button
                    onClick={() => router.push(`/admin/caterers/${caterer.id}`)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition-opacity shadow-sm"
                  >
                    <UtensilsCrossed className="h-4 w-4" />
                    Open / Build Menu
                  </button>

                  {/* Tag Owner Button */}
                  <button
                    onClick={() => {
                      setSelectedCaterer(caterer);
                      setTagEmail(caterer.taggedToOwner?.email || caterer.owner?.email || "");
                      setTagMsg(null);
                      setTagModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                  >
                    <Tag className="h-4 w-4" />
                    {caterer.taggedToOwner || caterer.owner ? "Change Owner" : "Tag Owner"}
                  </button>

                  {/* Approve / Reject Verification */}
                  {caterer.verificationRequestedAt && !caterer.bookingEnabled && (
                    <>
                      <button
                        onClick={() => handleApproveVerification(caterer)}
                        disabled={approvingId === caterer.id || rejectingId === caterer.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50 font-semibold"
                      >
                        {approvingId === caterer.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ShieldCheck className="h-4 w-4" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectVerification(caterer)}
                        disabled={rejectingId === caterer.id || approvingId === caterer.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 font-semibold"
                      >
                        {rejectingId === caterer.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Reject
                      </button>
                    </>
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

                  {/* Edit Details (granular fields) */}
                  <button
                    onClick={() => router.push(`/admin/caterers/${caterer.id}/edit`)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Details
                  </button>

                  {/* View public page */}
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
                );
              })()}
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

      {/* Tag Owner Modal — email search */}
      {tagModalOpen && selectedCaterer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Tag Catering Owner</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Link an owner account to <strong>{selectedCaterer.name}</strong>
                </p>
              </div>
              <button
                onClick={() => { setTagModalOpen(false); setTagEmail(""); setTagMsg(null); setSelectedCaterer(null); }}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Owner Email Address</label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 border-2 border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-purple-500 transition-colors">
                  <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="email"
                    placeholder="owner@email.com"
                    value={tagEmail}
                    onChange={(e) => { setTagEmail(e.target.value); setTagMsg(null); }}
                    onKeyDown={(e) => e.key === "Enter" && handleTagByEmail()}
                    className="flex-1 outline-none text-sm"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleTagByEmail}
                  disabled={!tagEmail.trim() || tagLoading}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 text-sm whitespace-nowrap"
                >
                  {tagLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
                  Tag
                </button>
              </div>

              {tagMsg && (
                <p className={`mt-2 text-sm font-medium ${tagMsg.type === "success" ? "text-green-600" : "text-red-600"}`}>
                  {tagMsg.text}
                </p>
              )}
            </div>

            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>How it works:</strong> The user just needs to sign up with their email. After tagging, their account will be promoted to Catering Owner and they can manage menus, prices, and bookings from their dashboard.
              </p>
            </div>

            <button
              onClick={() => { setTagModalOpen(false); setTagEmail(""); setTagMsg(null); setSelectedCaterer(null); }}
              className="w-full mt-4 rounded-xl border-2 border-gray-200 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
