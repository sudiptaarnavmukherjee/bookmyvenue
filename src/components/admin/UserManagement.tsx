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
  MapPin,
  Calendar,
  CreditCard,
  Star,
  Eye,
  MoreVertical,
  ChevronDown,
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
    caterers: number;
    bookings: number;
    reviews: number;
  };
}

interface UserDetails extends UserData {
  venues: Array<{ id: string; name: string; isActive: boolean }>;
  caterers: Array<{ id: string; businessName: string; isActive: boolean }>;
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
                                {user._count.caterers > 0 && (
                                  <span className="text-xs text-gray-400">
                                    {user._count.caterers} caterers
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
                              handleAction(
                                user.id,
                                user.isBanned ? "unban" : "ban"
                              );
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
                      {!selectedUser.kycVerified && (
                        <button
                          onClick={() =>
                            handleAction(selectedUser.id, "verify_kyc")
                          }
                          disabled={actionLoading === selectedUser.id}
                          className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 text-sm"
                        >
                          Verify KYC
                        </button>
                      )}
                      <button
                        onClick={() =>
                          handleAction(
                            selectedUser.id,
                            selectedUser.isBanned ? "unban" : "ban"
                          )
                        }
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
                            handleAction(selectedUser.id, "change_role", {
                              newRole: e.target.value,
                            });
                            e.target.value = "";
                          }
                        }}
                        className="px-4 py-2 bg-gray-100 rounded-lg text-sm"
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Change Role
                        </option>
                        <option value="USER">User</option>
                        <option value="VENUE_OWNER">Venue Owner</option>
                        <option value="CATERING_OWNER">Caterer</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
