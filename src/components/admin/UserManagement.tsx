"use client";

import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Shield,
  Ban,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Search,
  Building,
  Calendar,
  Pencil,
  KeyRound,
  X,
  Save,
  Trash2,
} from "lucide-react";

interface UserData {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  kycVerified: boolean;
  isBanned: boolean;
  createdAt: string;
  image: string | null;
  _count?: {
    venues: number;
    caterings: number;
    bookings: number;
    reviews: number;
  };
}

interface UserDetails extends UserData {
  venues: Array<{ id: string; name: string; isActive: boolean }>;
  caterings: Array<{ id: string; name: string; isActive: boolean }>;
  bookings: Array<{
    id: string;
    status: string;
    totalAmount: number;
    eventDate: string;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
  paymentStats: {
    totalPaid: number;
    totalBookings: number;
    avgBookingValue: number;
  };
}

interface UsersData {
  users: UserData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function UserManagement() {
  const [data, setData] = useState<UsersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Edit profile modal
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Set password modal
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Ban reason modal
  const [showBanReason, setShowBanReason] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [pendingBanUserId, setPendingBanUserId] = useState<string | null>(null);

  // Delete confirmation modal
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", page.toString());
      if (roleFilter) params.set("role", roleFilter);
      if (search) params.set("search", search);

      const response = await fetch(`/api/admin/users?${params}`);
      const result = await response.json();

      if (response.ok) {
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      setDetailsLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`);
      const result = await response.json();

      if (response.ok) {
        setSelectedUser(result.user);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleAction = async (userId: string, action: string, data?: any) => {
    try {
      setActionLoading(userId);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...data }),
      });

      if (response.ok) {
        fetchUsers();
        if (selectedUser?.id === userId) {
          fetchUserDetails(userId);
        }
      } else {
        const error = await response.json();
        alert(error.error || "Action failed");
      }
    } catch (error) {
      console.error("Error performing action:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const openEdit = (user: UserDetails) => {
    setEditForm({ name: user.name || "", email: user.email, phone: user.phone || "" });
    setEditError(null);
    setShowEdit(true);
  };

  const saveEdit = async () => {
    if (!selectedUser) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error || "Failed to save"); return; }
      setShowEdit(false);
      fetchUsers();
      fetchUserDetails(selectedUser.id);
    } catch { setEditError("Network error"); }
    finally { setEditSaving(false); }
  };

  const savePassword = async () => {
    if (!selectedUser) return;
    if (newPassword.length < 8) { setPasswordError("Minimum 8 characters"); return; }
    if (newPassword !== confirmPassword) { setPasswordError("Passwords do not match"); return; }
    setPasswordSaving(true);
    setPasswordError(null);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setPasswordError(data.error || "Failed to set password"); return; }
      setShowPassword(false);
      setNewPassword("");
      setConfirmPassword("");
      alert("Password updated successfully");
    } catch { setPasswordError("Network error"); }
    finally { setPasswordSaving(false); }
  };

  const openBan = (userId: string) => {
    setPendingBanUserId(userId);
    setBanReason("");
    setShowBanReason(true);
  };

  const confirmBan = async () => {
    if (!pendingBanUserId) return;
    setShowBanReason(false);
    await handleAction(pendingBanUserId, "ban", { reason: banReason.trim() || undefined });
    setPendingBanUserId(null);
    setBanReason("");
  };

  const openDelete = () => {
    setDeleteConfirmEmail("");
    setDeleteError(null);
    setShowDelete(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    if (deleteConfirmEmail.trim().toLowerCase() !== selectedUser.email.toLowerCase()) {
      setDeleteError("Email does not match");
      return;
    }
    setDeleteSaving(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setDeleteError(data.error || "Failed to delete user"); return; }
      setShowDelete(false);
      setSelectedUser(null);
      fetchUsers();
    } catch { setDeleteError("Network error"); }
    finally { setDeleteSaving(false); }
  };

  const roleColors: Record<string, string> = {
    USER: "bg-gray-100 text-gray-700",
    VENUE_OWNER: "bg-blue-100 text-blue-700",
    CATERING_OWNER: "bg-orange-100 text-orange-700",
    ADMIN: "bg-purple-100 text-purple-700",
  };

  const roleLabels: Record<string, string> = {
    USER: "User",
    VENUE_OWNER: "Venue Owner",
    CATERING_OWNER: "Caterer",
    ADMIN: "Admin",
  };

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
        >
          <option value="">All Roles</option>
          <option value="USER">Users</option>
          <option value="VENUE_OWNER">Venue Owners</option>
          <option value="CATERING_OWNER">Caterers</option>
          <option value="ADMIN">Admins</option>
        </select>
        <button
          onClick={fetchUsers}
          className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
        >
          Search
        </button>
      </div>

      <div className="flex gap-6">
        {/* Users List */}
        <div className={`${selectedUser ? "w-1/2" : "w-full"} transition-all`}>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {loading && !data ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : (
              <>
                <div className="divide-y">
                  {data?.users.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => fetchUserDetails(user.id)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedUser?.id === user.id ? "bg-purple-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name || "User"}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                              {(user.name || user.email)[0].toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 truncate">
                              {user.name || "Unnamed User"}
                            </p>
                            {user.isBanned && (
                              <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                                <Ban className="h-3 w-3" />
                                Banned
                              </span>
                            )}
                            {user.kycVerified && (
                              <span className="text-green-500">
                                <CheckCircle className="h-4 w-4" />
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                roleColors[user.role]
                              }`}
                            >
                              {roleLabels[user.role]}
                            </span>
                            {user._count && (
                              <>
                                {user._count.venues > 0 && (
                                  <span className="text-xs text-gray-400">
                                    {user._count.venues} venues
                                  </span>
                                )}
                                {user._count.caterings > 0 && (
                                  <span className="text-xs text-gray-400">
                                    {user._count.caterings} caterers
                                  </span>
                                )}
                                {user._count.bookings > 0 && (
                                  <span className="text-xs text-gray-400">
                                    {user._count.bookings} bookings
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (user.isBanned) {
                                handleAction(user.id, "unban");
                              } else {
                                openBan(user.id);
                              }
                            }}
                            disabled={actionLoading === user.id}
                            className={`p-2 rounded-lg ${
                              user.isBanned
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-red-100 text-red-700 hover:bg-red-200"
                            } disabled:opacity-50`}
                            title={user.isBanned ? "Unban User" : "Ban User"}
                          >
                            {user.isBanned ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Ban className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {data && data.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t">
                    <p className="text-sm text-gray-600">
                      Page {data.pagination.page} of {data.pagination.totalPages} (
                      {data.pagination.total} users)
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 bg-gray-100 rounded-lg disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          setPage((p) => Math.min(data.pagination.totalPages, p + 1))
                        }
                        disabled={page === data.pagination.totalPages}
                        className="px-3 py-1 bg-gray-100 rounded-lg disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {data?.users.length === 0 && (
                  <div className="py-12 text-center text-gray-500">
                    <User className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No users found</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* User Details Panel */}
        {selectedUser && (
          <div className="w-1/2">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-4">
              {detailsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {selectedUser.image ? (
                        <img
                          src={selectedUser.image}
                          alt={selectedUser.name || "User"}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                          {(selectedUser.name || selectedUser.email)[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {selectedUser.name || "Unnamed User"}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            roleColors[selectedUser.role]
                          }`}
                        >
                          {roleLabels[selectedUser.role]}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                    >
                      ×
                    </button>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{selectedUser.email}</span>
                    </div>
                    {selectedUser.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{selectedUser.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Joined{" "}
                        {new Date(selectedUser.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex gap-2">
                    {selectedUser.kycVerified ? (
                      <span className="flex items-center gap-1 text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full">
                        <CheckCircle className="h-3 w-3" />
                        KYC Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                        <AlertTriangle className="h-3 w-3" />
                        KYC Pending
                      </span>
                    )}
                    {selectedUser.isBanned && (
                      <span className="flex items-center gap-1 text-xs px-3 py-1 bg-red-100 text-red-700 rounded-full">
                        <Ban className="h-3 w-3" />
                        Banned
                      </span>
                    )}
                  </div>

                  {/* Payment Stats */}
                  {selectedUser.paymentStats && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-purple-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-purple-600">Total Spent</p>
                        <p className="text-lg font-bold text-purple-700">
                          ₹{selectedUser.paymentStats.totalPaid.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-blue-600">Bookings</p>
                        <p className="text-lg font-bold text-blue-700">
                          {selectedUser.paymentStats.totalBookings}
                        </p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-green-600">Avg Value</p>
                        <p className="text-lg font-bold text-green-700">
                          ₹{Math.round(selectedUser.paymentStats.avgBookingValue).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Venues */}
                  {selectedUser.venues && selectedUser.venues.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Venues ({selectedUser.venues.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedUser.venues.slice(0, 3).map((venue) => (
                          <div
                            key={venue.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                          >
                            <span className="text-sm">{venue.name}</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                venue.isActive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {venue.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-4 border-t space-y-2">
                    <h4 className="font-semibold text-gray-900 mb-3">Actions</h4>
                    <div className="flex flex-wrap gap-2">
                      {/* Edit Profile */}
                      <button
                        onClick={() => openEdit(selectedUser)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit Profile
                      </button>

                      {/* Set Password */}
                      <button
                        onClick={() => { setPasswordError(null); setNewPassword(""); setConfirmPassword(""); setShowPassword(true); }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 text-sm"
                      >
                        <KeyRound className="h-3.5 w-3.5" /> Set Password
                      </button>

                      {!selectedUser.kycVerified && (
                        <button
                          onClick={() => handleAction(selectedUser.id, "verify_kyc")}
                          disabled={actionLoading === selectedUser.id}
                          className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 text-sm"
                        >
                          Verify KYC
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (selectedUser.isBanned) {
                            handleAction(selectedUser.id, "unban");
                          } else {
                            openBan(selectedUser.id);
                          }
                        }}
                        disabled={actionLoading === selectedUser.id}
                        className={`px-4 py-2 rounded-lg text-sm ${
                          selectedUser.isBanned
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                        } disabled:opacity-50`}
                      >
                        {selectedUser.isBanned ? "Unban User" : "Ban User"}
                      </button>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAction(selectedUser.id, "change_role", { role: e.target.value });
                            e.target.value = "";
                          }
                        }}
                        className="px-4 py-2 bg-gray-100 rounded-lg text-sm"
                        defaultValue=""
                      >
                        <option value="" disabled>Change Role</option>
                        <option value="USER">User</option>
                        <option value="VENUE_OWNER">Venue Owner</option>
                        <option value="CATERING_OWNER">Caterer</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <button
                        onClick={openDelete}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete User
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Edit Profile Modal ────────────────────────────────────────── */}
      {showEdit && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Pencil className="h-5 w-5 text-blue-600" /> Edit Profile
              </h3>
              <button onClick={() => setShowEdit(false)} className="p-1.5 hover:bg-gray-100 rounded-full">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Email address"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Phone number"
                />
              </div>
              {editError && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{editError}</p>}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEdit(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={editSaving}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {editSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Set Password Modal ────────────────────────────────────────── */}
      {showPassword && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-amber-600" /> Set New Password
              </h3>
              <button onClick={() => setShowPassword(false)} className="p-1.5 hover:bg-gray-100 rounded-full">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Setting password for <span className="font-semibold text-gray-800">{selectedUser.name || selectedUser.email}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  placeholder="Repeat password"
                  autoComplete="new-password"
                />
              </div>
              {passwordError && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{passwordError}</p>}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPassword(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={savePassword}
                disabled={passwordSaving}
                className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {passwordSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Ban Reason Modal ──────────────────────────────────────────── */}
      {showBanReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Ban className="h-5 w-5 text-red-600" /> Ban User
              </h3>
              <button onClick={() => setShowBanReason(false)} className="p-1.5 hover:bg-gray-100 rounded-full">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Optionally provide a reason for banning this user.
            </p>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              rows={3}
              placeholder="Reason for ban (optional)"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none"
            />
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowBanReason(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmBan}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <Ban className="h-4 w-4" /> Confirm Ban
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ─────────────────────────────────── */}
      {showDelete && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
                <Trash2 className="h-5 w-5" /> Delete User
              </h3>
              <button onClick={() => setShowDelete(false)} className="p-1.5 hover:bg-gray-100 rounded-full">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-red-700 font-medium">This action cannot be undone.</p>
              <p className="text-sm text-red-600 mt-1">
                The user account will be anonymised and permanently deactivated.
                All their venues, bookings and data will remain but ownership will be removed.
              </p>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Type <span className="font-mono font-semibold text-gray-900">{selectedUser.email}</span> to confirm:
            </p>
            <input
              type="email"
              value={deleteConfirmEmail}
              onChange={(e) => setDeleteConfirmEmail(e.target.value)}
              placeholder="Enter user email to confirm"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
            {deleteError && <p className="text-red-600 text-sm mt-2 bg-red-50 px-3 py-2 rounded-lg">{deleteError}</p>}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteSaving || deleteConfirmEmail.toLowerCase() !== selectedUser.email.toLowerCase()}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
