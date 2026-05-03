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
} from "lucide-react";

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

export default function CateringOwnerDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [caterers, setCaterers] = useState<Caterer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"bookings" | "calendar" | "menus" | "profile">("bookings");

  // Profile / verification state
  const [ownedCaterers, setOwnedCaterers] = useState<Caterer[]>([]);
  const [verificationLoading, setVerificationLoading] = useState<string | null>(null);

  // Menus state
  const [packages, setPackages] = useState<any[]>([]);
  const [globalTemplates, setGlobalTemplates] = useState<any[]>([]);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [deletingPkgId, setDeletingPkgId] = useState<string | null>(null);
  const [editingPkg, setEditingPkg] = useState<{ id: string; price: number } | null>(null);
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

        if (uniqueCaterers.length > 0 && !selectedCatererId) {
          setSelectedCatererId(uniqueCaterers[0].id);
        }
      }

      if (ownedRes.ok) {
        const ownedData = await ownedRes.json();
        const owned: Caterer[] = ownedData.caterers || [];
        setOwnedCaterers(owned);
        // If no bookings caterer selected yet, pick first owned
        if (!selectedCatererId && owned.length > 0) {
          setSelectedCatererId(owned[0].id);
        }
      }
    } catch (err) {
      setError("Failed to load data");
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

  const fetchMenus = async (catererId: string) => {
    setLoadingMenus(true);
    const [pkgRes, tplRes] = await Promise.all([
      fetch(`/api/catering/${catererId}/packages`),
      fetch("/api/admin/menu-templates"),
    ]);
    const [pkgs, tpls] = await Promise.all([pkgRes.json(), tplRes.json()]);
    setPackages(Array.isArray(pkgs) ? pkgs : []);
    setGlobalTemplates(Array.isArray(tpls) ? tpls : []);
    setLoadingMenus(false);
  };

  const handleRequestVerification = async (catererId: string) => {
    setVerificationLoading(catererId);
    try {
      const res = await fetch("/api/catering-owner/request-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catererId }),
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

  const handleCloneTemplate = async (templateId: string) => {
    const res = await fetch(`/api/catering/${selectedCatererId}/packages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromTemplateId: templateId }),
    });
    if (res.ok) {
      if (selectedCatererId) await fetchMenus(selectedCatererId);
    } else {
      alert("Failed to clone template");
    }
    setCloningId(null);
  };

  const handleDeletePackage = async (packageId: string) => {
    if (!selectedCatererId || !confirm("Delete this package?")) return;
    setDeletingPkgId(packageId);
    await fetch(`/api/catering/${selectedCatererId}/packages?packageId=${packageId}`, {
      method: "DELETE",
    });
    setPackages((prev) => prev.filter((p) => p.id !== packageId));
    setDeletingPkgId(null);
  };

  const handleSavePrice = async (pkgId: string, newPrice: number) => {
    if (!selectedCatererId) return;
    const res = await fetch(`/api/catering/${selectedCatererId}/packages`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId: pkgId, pricePerPlate: newPrice }),
    });
    if (res.ok) {
      setPackages((prev) =>
        prev.map((p) => (p.id === pkgId ? { ...p, pricePerPlate: newPrice } : p))
      );
      setEditingPkg(null);
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
              if (selectedCatererId) fetchMenus(selectedCatererId);
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
          <div className="space-y-6">
            {!selectedCatererId ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <UtensilsCrossed className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No catering service found. Menus will appear once you have bookings.</p>
              </div>
            ) : loadingMenus ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600 mr-3" />
                <span className="text-gray-500">Loading menus…</span>
              </div>
            ) : (
              <>
                {/* My Packages */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    My Packages ({packages.length})
                  </h2>
                  {packages.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      No packages yet. Clone one of the Bengali templates below to get started.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {packages.map((pkg) => (
                        <div
                          key={pkg.id}
                          className="border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                pkg.tier === "SILVER" ? "bg-gray-100 text-gray-700" :
                                pkg.tier === "GOLD" ? "bg-yellow-100 text-yellow-800" :
                                "bg-purple-100 text-purple-800"
                              }`}>{pkg.tier}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                pkg.variant === "VEG" ? "bg-green-100 text-green-700" :
                                pkg.variant === "JAIN" ? "bg-amber-100 text-amber-700" :
                                "bg-red-100 text-red-700"
                              }`}>{pkg.variant}</span>
                              <span className="font-medium text-gray-800">{pkg.name}</span>
                            </div>
                            {pkg.description && (
                              <p className="text-sm text-gray-500 mb-1">{pkg.description}</p>
                            )}
                            <p className="text-xs text-gray-400">{pkg.itemCount} items</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {editingPkg?.id === pkg.id ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">₹</span>
                                <input
                                  type="number"
                                  defaultValue={pkg.pricePerPlate}
                                  className="w-24 border rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleSavePrice(pkg.id, Number((e.target as HTMLInputElement).value));
                                    }
                                  }}
                                  autoFocus
                                />
                                <span className="text-xs text-gray-400">/plate</span>
                                <button
                                  onClick={(e) => {
                                    const input = (e.currentTarget.parentElement?.querySelector("input") as HTMLInputElement);
                                    if (input) handleSavePrice(pkg.id, Number(input.value));
                                  }}
                                  className="text-xs bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingPkg(null)}
                                  className="text-xs text-gray-400 hover:text-gray-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="font-semibold text-purple-700">
                                  ₹{pkg.pricePerPlate?.toLocaleString("en-IN")}/plate
                                </span>
                                <button
                                  onClick={() => setEditingPkg({ id: pkg.id, price: pkg.pricePerPlate })}
                                  className="text-gray-400 hover:text-purple-600 transition-colors"
                                  title="Edit price"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeletePackage(pkg.id)}
                              disabled={deletingPkgId === pkg.id}
                              className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
                              title="Delete package"
                            >
                              {deletingPkgId === pkg.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bengali Templates to Clone */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Bengali Menu Templates</h2>
                  <p className="text-sm text-gray-500 mb-6">
                    Click &quot;Use Template&quot; to instantly clone a pre-built Bengali menu into your packages. You can adjust pricing after cloning.
                  </p>
                  {(["SILVER", "GOLD", "PLATINUM"] as const).map((tier) => (
                    <div key={tier} className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        {tier === "SILVER" ? "🥈" : tier === "GOLD" ? "🥇" : "💎"} {tier}
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {globalTemplates
                          .filter((t) => t.tier === tier)
                          .map((tpl) => {
                            const alreadyAdded = packages.some(
                              (p) => p.tier === tpl.tier && p.variant === tpl.variant
                            );
                            return (
                              <div
                                key={tpl.id}
                                className={`border rounded-xl p-4 ${alreadyAdded ? "opacity-60" : ""}`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  {tpl.variant === "VEG" ? (
                                    <Leaf className="h-3.5 w-3.5 text-green-600" />
                                  ) : tpl.variant === "JAIN" ? (
                                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                  ) : (
                                    <Drumstick className="h-3.5 w-3.5 text-red-500" />
                                  )}
                                  <span className="text-sm font-semibold text-gray-800">{tpl.name}</span>
                                </div>
                                <p className="text-xs text-gray-500 mb-2 line-clamp-2">{tpl.description}</p>
                                <p className="text-xs text-gray-400 mb-3">{tpl.itemCount} items · ₹{tpl.pricePerPlate}/plate</p>
                                <button
                                  onClick={() => !alreadyAdded && handleCloneTemplate(tpl.id)}
                                  disabled={alreadyAdded || cloningId === tpl.id}
                                  className={`w-full text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                                    alreadyAdded
                                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                      : "bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white"
                                  }`}
                                >
                                  {cloningId === tpl.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : alreadyAdded ? (
                                    "Already added"
                                  ) : (
                                    <>
                                      <Copy className="h-3.5 w-3.5" /> Use Template
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
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
                            <p className="text-xs text-green-600 mt-0.5">{caterer.verificationNotes}</p>
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
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                        <p className="text-sm text-amber-800 mb-3">
                          <strong>Ready to go live?</strong> Request verification and our admin team will review your profile and enable online bookings within 24–48 hours.
                        </p>
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
