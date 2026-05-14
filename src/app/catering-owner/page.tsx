"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { api } from "@/lib/api-client";

const AvailabilityCalendar = dynamic(() => import("@/components/calendar/AvailabilityCalendar"));
const BlockDateModal = dynamic(() => import("@/components/calendar/BlockDateModal"));
const EngagementDashboard = dynamic(() => import("@/components/owner/EngagementDashboard"));
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
  Phone,
  Plus,
  Leaf,
  Drumstick,
  Sparkles,
  Copy,
  Pencil,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Clock3,
  Eye,
  Star,
  Wand2,
  Upload,
} from "lucide-react";
import { parseCatererVerificationNotes } from "@/lib/verification";

type Caterer = {
  id: string;
  name: string;
  city: string;
  area: string;
  isVerified?: boolean;
  isAdminListed?: boolean;
  bookingEnabled?: boolean;
  verificationRequestedAt?: string | null;
  verificationNotes?: string | null;
  silverPrice?: number;
  goldPrice?: number;
  platinumPrice?: number;
  minPlatePrice?: number;
  viewCount?: number;
  isPureVeg?: boolean;
  cuisines?: string;
  _count?: { bookings: number; reviews: number };
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

type KycDraft = {
  ownerNote: string;
  aadhaarUrl: string;
  panUrl: string;
  uploadingAadhaar: boolean;
  uploadingPan: boolean;
};

export default function CateringOwnerDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [caterers, setCaterers] = useState<Caterer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"bookings" | "calendar" | "menus" | "profile" | "insights">("bookings");

  // Profile / verification state
  const [ownedCaterers, setOwnedCaterers] = useState<Caterer[]>([]);
  const [verificationLoading, setVerificationLoading] = useState<string | null>(null);
  const [kycDrafts, setKycDrafts] = useState<Record<string, KycDraft>>({});

  // Menus state — uses owned caterers, not booking caterers
  const [menuCatererId, setMenuCatererId] = useState<string | null>(null);
  const [menuPackages, setMenuPackages] = useState<any[]>([]);
  const [loadingMenus, setLoadingMenus] = useState(false);
  // Legacy template state (kept for calendar compatibility)
  const [selectedCatererId, setSelectedCatererId] = useState<string | null>(null);
  
  // Block date modal state
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedBlockedDate, setSelectedBlockedDate] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [{ data, error: err }, ownedRes] = await Promise.all([
        api.getBookings(),
        fetch("/api/catering-owner/caterers"),
      ]);

      if (err) {
        setError(err);
      } else {
        const allBookings = (data as any)?.bookings || [];
        const cateringBookings = allBookings.filter((b: any) => b.type === "CATERING");
        setBookings(cateringBookings);

        // Extract unique caterers from bookings (for calendar)
        const uniqueCaterers: Caterer[] = [];
        cateringBookings.forEach((b: Booking) => {
          if (b.caterer && !uniqueCaterers.find(c => c.id === b.caterer?.id)) {
            uniqueCaterers.push(b.caterer);
          }
        });
        setCaterers(uniqueCaterers);

        if (uniqueCaterers.length > 0) {
          setSelectedCatererId(prev => prev || uniqueCaterers[0].id);
        }
      }

      if (ownedRes.ok) {
        const ownedData = await ownedRes.json();
        const owned: Caterer[] = ownedData.caterers || [];
        setOwnedCaterers(owned);
        // Set calendar caterer if not already set
        if (owned.length > 0) {
          setSelectedCatererId(prev => prev || owned[0].id);
        }
        // Always set menuCatererId from OWNED caterers (not bookings)
        if (owned.length > 0) {
          setMenuCatererId(owned[0].id);
        }
      }
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

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
  }, [status, session, router, fetchData]);
  
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

  // Fetch menu packages for a specific owned caterer
  const fetchBuiltMenus = async (catererId: string) => {
    setLoadingMenus(true);
    const res = await fetch(`/api/caterer/${catererId}/menu`);
    if (res.ok) {
      const data = await res.json();
      setMenuPackages(data.packages || []);
    } else {
      setMenuPackages([]);
    }
    setLoadingMenus(false);
  };

  const updateKycDraft = (catererId: string, patch: Partial<KycDraft>) => {
    setKycDrafts((prev) => ({
      ...(prev || {}),
      [catererId]: Object.assign(
        {
          ownerNote: "",
          aadhaarUrl: "",
          panUrl: "",
          uploadingAadhaar: false,
          uploadingPan: false,
        } as KycDraft,
        prev[catererId] || {},
        patch
      ),
    }));
  };

  const uploadKycImage = async (catererId: string, file: File, docType: "aadhaar" | "pan") => {
    const uploadingKey = docType === "aadhaar" ? "uploadingAadhaar" : "uploadingPan";
    const urlKey = docType === "aadhaar" ? "aadhaarUrl" : "panUrl";
    updateKycDraft(catererId, { [uploadingKey]: true } as Partial<KycDraft>);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "kyc-documents");

      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Upload failed");
      }

      updateKycDraft(catererId, { [urlKey]: data.url } as Partial<KycDraft>);
    } catch (error: any) {
      alert(error?.message || "Failed to upload KYC document");
    } finally {
      updateKycDraft(catererId, { [uploadingKey]: false } as Partial<KycDraft>);
    }
  };

  const handleRequestVerification = async (catererId: string) => {
    setVerificationLoading(catererId);
    const draft = kycDrafts[catererId];

    const kycDocuments = [
      draft?.aadhaarUrl ? { label: "Aadhaar", url: draft.aadhaarUrl } : null,
      draft?.panUrl ? { label: "PAN/GST", url: draft.panUrl } : null,
    ].filter(Boolean);

    if (kycDocuments.length === 0) {
      alert("Please upload at least one KYC document before requesting verification");
      setVerificationLoading(null);
      return;
    }

    try {
      const res = await fetch("/api/catering-owner/request-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catererId,
          ownerNote: draft?.ownerNote || "",
          kycDocuments,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOwnedCaterers(prev =>
          prev.map(c => c.id === catererId
            ? { ...c, verificationRequestedAt: new Date().toISOString() }
            : c
          )
        );
      } else {
        alert(data.error || "Failed to submit request");
      }
    } catch {
      alert("Failed to submit request");
    } finally {
      setVerificationLoading(null);
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
          <button
            onClick={() => {
              setActiveTab("menus");
              if (menuCatererId) fetchBuiltMenus(menuCatererId);
            }}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "menus"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <UtensilsCrossed className="inline h-5 w-5 mr-2" />
            My Menus
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all relative ${
              activeTab === "profile"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <ShieldCheck className="inline h-5 w-5 mr-2" />
            Profile & Verification
            {ownedCaterers.some(c => !c.isVerified && !c.verificationRequestedAt) && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white" />
            )}
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

        {/* Menus Tab */}
        {activeTab === "menus" && (
          <div className="space-y-4">
            {ownedCaterers.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                <UtensilsCrossed className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No caterers linked</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  An admin needs to tag your account to a catering business first. Share your email with the admin.
                </p>
              </div>
            ) : (
              <>
                {/* Caterer selector — only shown if multiple owned caterers */}
                {ownedCaterers.length > 1 && (
                  <div className="bg-white rounded-2xl px-6 py-4 shadow-sm flex items-center gap-4">
                    <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Caterer:</label>
                    <select
                      value={menuCatererId || ""}
                      onChange={(e) => {
                        setMenuCatererId(e.target.value);
                        fetchBuiltMenus(e.target.value);
                      }}
                      className="flex-1 max-w-xs border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    >
                      {ownedCaterers.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} — {c.city}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Menu Builder card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Menu Builder</h2>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Build Silver · Gold · Platinum packages with authentic Bengali dishes
                      </p>
                    </div>
                    <button
                      onClick={() => menuCatererId && router.push(`/catering-owner/menu-builder/${menuCatererId}`)}
                      disabled={!menuCatererId}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
                    >
                      <Wand2 className="h-4 w-4" />
                      Build / Edit Menu
                    </button>
                  </div>

                  {loadingMenus ? (
                    <div className="flex items-center justify-center py-10 gap-3">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                      <span className="text-gray-500">Loading packages…</span>
                    </div>
                  ) : menuPackages.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
                      <UtensilsCrossed className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium">No menu built yet</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Click &quot;Build / Edit Menu&quot; to set up your Silver, Gold, and Platinum packages.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {menuPackages.map((pkg: any) => (
                        <div
                          key={pkg.id}
                          className="flex items-center justify-between border rounded-xl p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              pkg.tier === "SILVER" ? "bg-gray-100 text-gray-700" :
                              pkg.tier === "GOLD" ? "bg-yellow-100 text-yellow-800" :
                              "bg-purple-100 text-purple-800"
                            }`}>
                              {pkg.tier === "SILVER" ? "🥈" : pkg.tier === "GOLD" ? "🥇" : "💜"} {pkg.tier}
                            </span>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{pkg.name}</p>
                              <p className="text-xs text-gray-500">{pkg.itemCount} items</p>
                            </div>
                          </div>
                          <p className="font-bold text-purple-700">
                            ₹{pkg.pricePerPlate?.toLocaleString("en-IN")}
                            <span className="text-xs font-normal text-gray-400">/plate</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === "insights" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Engagement Insights</h2>
            <EngagementDashboard />
          </div>
        )}

        {/* Profile & Verification Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            {ownedCaterers.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                <ShieldAlert className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No caterers linked yet</h3>
                <p className="text-gray-500">Your caterer profiles will appear here once an admin tags you as the owner.</p>
              </div>
            ) : (
              ownedCaterers.map((caterer) => {
                const isFullyVerified = caterer.isVerified && caterer.bookingEnabled;
                const isPending = !!caterer.verificationRequestedAt && !isFullyVerified;
                const isFishbowl = caterer.isAdminListed && !caterer.bookingEnabled;

                return (
                  <div key={caterer.id} className="bg-white rounded-2xl p-6 shadow-sm">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{caterer.name}</h2>
                        <p className="text-gray-500 text-sm mt-0.5">{caterer.area}, {caterer.city}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {isFullyVerified ? (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                            <ShieldCheck className="h-4 w-4" />
                            Verified & Live
                          </span>
                        ) : isPending ? (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                            <Clock3 className="h-4 w-4" />
                            Verification Pending
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold">
                            🐟 Fishbowl
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <p className="text-2xl font-bold text-gray-900">{caterer.viewCount ?? 0}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Profile Views</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <p className="text-2xl font-bold text-gray-900">{caterer._count?.bookings ?? 0}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Bookings</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <p className="text-2xl font-bold text-gray-900">{caterer._count?.reviews ?? 0}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Reviews</p>
                      </div>
                    </div>

                    {/* Verification checklist */}
                    {!isFullyVerified && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Verification Checklist</h3>
                        <div className="space-y-2">
                          {[
                            { label: "Caterer name & city set", done: !!(caterer.name && caterer.city) },
                            { label: "Pricing added (Silver / Gold / Platinum)", done: !!(caterer.silverPrice || caterer.goldPrice || caterer.platinumPrice) },
                            { label: "Cuisine types listed", done: !!(caterer.cuisines && caterer.cuisines.trim()) },
                            { label: "Admin has tagged you as owner", done: true }, // if they can see this page, they are tagged
                          ].map(({ label, done }) => (
                            <div key={label} className="flex items-center gap-3 text-sm">
                              <span className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                              </span>
                              <span className={done ? "text-gray-700" : "text-gray-400"}>{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Verification action */}
                    {isFullyVerified ? (
                      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                        <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-green-800">Your caterer is verified and accepting online bookings!</p>
                          {caterer.verificationNotes && (
                            <p className="text-xs text-green-600 mt-0.5">
                              {parseCatererVerificationNotes(caterer.verificationNotes)?.adminReviewNote || caterer.verificationNotes}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : isPending ? (
                      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <Clock3 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-blue-800">Verification request submitted — admin will review shortly</p>
                          <p className="text-xs text-blue-500 mt-0.5">
                            Submitted {new Date(caterer.verificationRequestedAt!).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                          {(() => {
                            const details = parseCatererVerificationNotes(caterer.verificationNotes);
                            if (!details) return null;
                            return (
                              <div className="mt-2 text-xs text-blue-700 space-y-1">
                                {details.ownerNote ? <p><strong>Owner note:</strong> {details.ownerNote}</p> : null}
                                {details.kycDocuments.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {details.kycDocuments.map((doc) => (
                                      <a
                                        key={`${doc.label}-${doc.url}`}
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline hover:text-blue-900"
                                      >
                                        {doc.label} document
                                      </a>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                        <p className="text-sm text-amber-800 mb-3">
                          <strong>Ready to go live?</strong> Request verification and our admin team will review your profile and enable online bookings within 24–48 hours.
                        </p>
                        <div className="grid md:grid-cols-2 gap-3 mb-3">
                          <label className="text-xs text-amber-900">
                            Aadhaar document (image URL or upload)
                            <input
                              type="url"
                              value={kycDrafts[caterer.id]?.aadhaarUrl || ""}
                              onChange={(e) => updateKycDraft(caterer.id, { aadhaarUrl: e.target.value })}
                              placeholder="https://..."
                              className="mt-1 w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-sm"
                            />
                            <label className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-purple-700 cursor-pointer">
                              <Upload className="h-3.5 w-3.5" />
                              Upload Aadhaar
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) uploadKycImage(caterer.id, file, "aadhaar");
                                }}
                              />
                            </label>
                          </label>

                          <label className="text-xs text-amber-900">
                            PAN/GST document (image URL or upload)
                            <input
                              type="url"
                              value={kycDrafts[caterer.id]?.panUrl || ""}
                              onChange={(e) => updateKycDraft(caterer.id, { panUrl: e.target.value })}
                              placeholder="https://..."
                              className="mt-1 w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-sm"
                            />
                            <label className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-purple-700 cursor-pointer">
                              <Upload className="h-3.5 w-3.5" />
                              Upload PAN/GST
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) uploadKycImage(caterer.id, file, "pan");
                                }}
                              />
                            </label>
                          </label>
                        </div>
                        <textarea
                          value={kycDrafts[caterer.id]?.ownerNote || ""}
                          onChange={(e) => updateKycDraft(caterer.id, { ownerNote: e.target.value })}
                          rows={2}
                          placeholder="Optional note for admin reviewer"
                          className="mb-3 w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-sm"
                        />
                        <button
                          onClick={() => handleRequestVerification(caterer.id)}
                          disabled={verificationLoading === caterer.id}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {verificationLoading === caterer.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ShieldCheck className="h-4 w-4" />
                          )}
                          Request Verification
                        </button>
                      </div>
                    )}

                    {/* View public page link */}
                    <div className="mt-4 pt-4 border-t">
                      <a
                        href={`/catering/${caterer.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 font-medium"
                      >
                        <Eye className="h-4 w-4" />
                        View Public Profile
                      </a>
                    </div>
                  </div>
                );
              })
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
