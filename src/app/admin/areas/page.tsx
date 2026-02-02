"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MapPin,
  Search,
  Plus,
  Edit2,
  Trash2,
  Star,
  ArrowUp,
  ArrowDown,
  Loader2,
  ArrowLeft,
  Building2,
  Utensils,
  Eye,
  Save,
  X,
} from "lucide-react";

type Area = {
  id: string;
  name: string;
  city: string;
  state: string;
  pincode?: string;
  isPopular: boolean;
  priority: number;
  venueCount: number;
  catererCount: number;
  totalViews: number;
  createdAt: string;
};

const CITIES = ["Kolkata", "Howrah", "Salt Lake", "New Town", "Barasat", "Barrackpore"];

export default function AdminAreasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    city: "Kolkata",
    state: "West Bengal",
    pincode: "",
    isPopular: false,
    priority: 0,
  });

  useEffect(() => {
    if (status === "authenticated") {
      if ((session?.user as any)?.role !== "ADMIN") {
        router.push("/");
      } else {
        fetchAreas();
      }
    } else if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, session, router]);

  const fetchAreas = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/areas");
      const data = await response.json();
      if (data.success) {
        setAreas(data.areas || []);
      }
    } catch (error) {
      console.error("Failed to fetch areas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveArea = async () => {
    if (!formData.name || !formData.city) {
      alert("Name and city are required");
      return;
    }

    try {
      setSaving(true);
      const url = editingArea
        ? `/api/admin/areas/${editingArea.id}`
        : "/api/admin/areas";
      const method = editingArea ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        fetchAreas();
        closeModal();
      } else {
        alert(data.error || "Failed to save area");
      }
    } catch (error) {
      alert("Failed to save area");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArea = async (areaId: string) => {
    if (!confirm("Are you sure you want to delete this area?")) return;

    try {
      const response = await fetch(`/api/admin/areas/${areaId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        fetchAreas();
      } else {
        alert(data.error || "Failed to delete area");
      }
    } catch (error) {
      alert("Failed to delete area");
    }
  };

  const handleTogglePopular = async (area: Area) => {
    try {
      const response = await fetch(`/api/admin/areas/${area.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...area, isPopular: !area.isPopular }),
      });

      if (response.ok) {
        fetchAreas();
      }
    } catch (error) {
      console.error("Failed to toggle popular:", error);
    }
  };

  const handlePriorityChange = async (area: Area, direction: "up" | "down") => {
    const newPriority = direction === "up" ? area.priority + 1 : Math.max(0, area.priority - 1);
    try {
      const response = await fetch(`/api/admin/areas/${area.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...area, priority: newPriority }),
      });

      if (response.ok) {
        fetchAreas();
      }
    } catch (error) {
      console.error("Failed to update priority:", error);
    }
  };

  const openAddModal = () => {
    setFormData({
      name: "",
      city: "Kolkata",
      state: "West Bengal",
      pincode: "",
      isPopular: false,
      priority: 0,
    });
    setEditingArea(null);
    setShowAddModal(true);
  };

  const openEditModal = (area: Area) => {
    setFormData({
      name: area.name,
      city: area.city,
      state: area.state,
      pincode: area.pincode || "",
      isPopular: area.isPopular,
      priority: area.priority,
    });
    setEditingArea(area);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingArea(null);
    setFormData({
      name: "",
      city: "Kolkata",
      state: "West Bengal",
      pincode: "",
      isPopular: false,
      priority: 0,
    });
  };

  const filteredAreas = areas
    .filter((area) => {
      const matchesSearch =
        area.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        area.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = selectedCity === "all" || area.city === selectedCity;
      return matchesSearch && matchesCity;
    })
    .sort((a, b) => b.priority - a.priority);

  const uniqueCities = Array.from(new Set(areas.map((a) => a.city))).sort();

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
              <h1 className="text-3xl font-bold text-gradient">Manage Areas</h1>
              <p className="text-gray-600">Configure area-based sorting and popular locations</p>
            </div>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 font-semibold text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="h-5 w-5" />
            Add Area
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-card rounded-xl p-4">
            <p className="text-3xl font-bold text-gradient">{areas.length}</p>
            <p className="text-sm text-gray-600">Total Areas</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-3xl font-bold text-amber-600">
              {areas.filter((a) => a.isPopular).length}
            </p>
            <p className="text-sm text-gray-600">Popular Areas</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-3xl font-bold text-purple-600">
              {areas.reduce((sum, a) => sum + a.venueCount, 0)}
            </p>
            <p className="text-sm text-gray-600">Total Venues</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-3xl font-bold text-orange-600">
              {areas.reduce((sum, a) => sum + a.catererCount, 0)}
            </p>
            <p className="text-sm text-gray-600">Total Caterers</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="glass-card rounded-2xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search areas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-600 outline-none"
              />
            </div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-600 outline-none"
            >
              <option value="all">All Cities</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Areas List */}
        <div className="space-y-4">
          {filteredAreas.map((area) => (
            <motion.div
              key={area.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Area Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{area.name}</h3>
                    {area.isPopular && (
                      <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-500" />
                        Popular
                      </span>
                    )}
                    <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                      Priority: {area.priority}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {area.city}, {area.state}
                    </span>
                    {area.pincode && (
                      <span className="text-gray-500">PIN: {area.pincode}</span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-1 text-purple-600">
                      <Building2 className="h-4 w-4" />
                      {area.venueCount} venues
                    </span>
                    <span className="flex items-center gap-1 text-orange-600">
                      <Utensils className="h-4 w-4" />
                      {area.catererCount} caterers
                    </span>
                    <span className="flex items-center gap-1 text-blue-600">
                      <Eye className="h-4 w-4" />
                      {area.totalViews} views
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {/* Priority Controls */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handlePriorityChange(area, "up")}
                      className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                      title="Increase priority"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handlePriorityChange(area, "down")}
                      className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                      title="Decrease priority"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Toggle Popular */}
                  <button
                    onClick={() => handleTogglePopular(area)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                      area.isPopular
                        ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Star className={`h-4 w-4 ${area.isPopular ? "fill-amber-500" : ""}`} />
                    {area.isPopular ? "Popular" : "Mark Popular"}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => openEditModal(area)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteArea(area.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredAreas.length === 0 && (
            <div className="glass-card rounded-2xl p-12 text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-600">No areas found</p>
              <p className="text-gray-500 mb-4">Add areas to enable location-based sorting</p>
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 font-semibold text-white"
              >
                <Plus className="h-5 w-5" />
                Add First Area
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gradient">
                {editingArea ? "Edit Area" : "Add New Area"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Area Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Salt Lake Sector V"
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  City *
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-purple-600 outline-none"
                >
                  {CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  PIN Code
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="e.g., 700091"
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Priority (higher = shown first)
                </label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  min={0}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-purple-600 outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPopular"
                  checked={formData.isPopular}
                  onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                  className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="isPopular" className="text-sm font-medium text-gray-700">
                  Mark as Popular Area
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 rounded-xl border-2 border-gray-200 py-3 font-semibold text-gray-700 hover:bg-white/60 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveArea}
                disabled={saving}
                className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    {editingArea ? "Update" : "Create"}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
