"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, MapPin, Calendar, Edit2, Camera, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api-client";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", phone: "" });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status === "authenticated") {
      fetchUserProfile();
    }
  }, [status, router]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await api.getCurrentUser();
      
      if (err) {
        setError(err);
      } else {
        const userData = (data as any)?.user;
        setUser(userData);
        setFormData({
          name: userData?.name || "",
          phone: userData?.phone || ""
        });
      }
    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data, error: err } = await api.updateProfile(formData);
      
      if (err) {
        alert(`Update failed: ${err}`);
      } else {
        const updatedUser = (data as any)?.user;
        setUser(updatedUser);
        setIsEditing(false);
        alert("Profile updated successfully!");
      }
    } catch (err) {
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="glass-card rounded-3xl p-8 flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="glass-card rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <h2 className="text-2xl font-bold text-gradient">
              {error || "Failed to load profile"}
            </h2>
          </div>
          <button
            onClick={fetchUserProfile}
            className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2 font-semibold text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-24 pt-8">
      <div className="mx-auto max-w-4xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-8"
        >
          {/* Profile Header */}
          <div className="mb-8 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="h-32 w-32 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-5xl font-bold">
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <button className="absolute bottom-0 right-0 rounded-full bg-white p-2 shadow-lg hover:shadow-xl transition-all">
                <Camera className="h-5 w-5 text-purple-600" />
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold text-gradient mb-2">{user.name || "User"}</h1>
              <p className="text-gray-600 mb-3">{user.email}</p>
              <span className="inline-block rounded-full bg-purple-100 px-4 py-1.5 text-sm font-semibold text-purple-600">
                {user.role}
              </span>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2.5 font-semibold text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Edit2 className="h-4 w-4" />
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {/* Profile Details */}
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Full Name</label>
                <div className="flex items-center gap-3 rounded-xl bg-white/60 p-4">
                  <User className="h-5 w-5 text-purple-600" />
                  <input
                    type="text"
                    value={isEditing ? formData.name : user.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className="flex-1 bg-transparent outline-none disabled:text-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Email</label>
                <div className="flex items-center gap-3 rounded-xl bg-white/60 p-4">
                  <Mail className="h-5 w-5 text-purple-600" />
                  <input
                    type="email"
                    value={user.email || ""}
                    disabled={!isEditing}
                    className="flex-1 bg-transparent outline-none disabled:text-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Phone</label>
                <div className="flex items-center gap-3 rounded-xl bg-white/60 p-4">
                  <Phone className="h-5 w-5 text-purple-600" />
                  <input
                    type="tel"
                    value={isEditing ? formData.phone : user.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Add phone number"
                    disabled={!isEditing}
                    className="flex-1 bg-transparent outline-none disabled:text-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Location</label>
                <div className="flex items-center gap-3 rounded-xl bg-white/60 p-4">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  <input
                    type="text"
                    placeholder="Add location"
                    disabled={!isEditing}
                    className="flex-1 bg-transparent outline-none disabled:text-gray-600"
                  />
                </div>
              </div>
            </div>

            {isEditing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 justify-end"
              >
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: user.name || "",
                      phone: user.phone || ""
                    });
                  }}
                  disabled={saving}
                  className="rounded-xl border-2 border-gray-300 px-6 py-2.5 font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2.5 font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Additional Stats for Owners */}
        {(user.role === "VENUE_OWNER" || user.role === "CATERING_OWNER") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 glass-card rounded-3xl p-8"
          >
            <h2 className="text-2xl font-bold text-gradient mb-6">Your Stats</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/60 p-6">
                <p className="text-sm text-gray-600 mb-1">Total Listings</p>
                <p className="text-3xl font-bold text-gradient">1</p>
              </div>
              <div className="rounded-2xl bg-white/60 p-6">
                <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
                <p className="text-3xl font-bold text-gradient">5</p>
              </div>
              <div className="rounded-2xl bg-white/60 p-6">
                <p className="text-sm text-gray-600 mb-1">Revenue</p>
                <p className="text-3xl font-bold text-gradient">₹6.25L</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
