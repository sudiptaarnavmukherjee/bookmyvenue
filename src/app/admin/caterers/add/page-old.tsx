"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  UtensilsCrossed,
  MapPin,
  IndianRupee,
  Users,
  Phone,
  Image as ImageIcon,
  Sparkles,
  Save,
  Loader2,
  CheckCircle,
  Info,
  Leaf,
  Crown,
  Medal,
  Award,
} from "lucide-react";
import Link from "next/link";
import ImageUploader from "@/components/upload/ImageUploader";

// Kolkata Areas
const KOLKATA_AREAS = [
  "Barasat", "Kalyani", "Salt Lake", "New Town", "Madhyamgram",
  "Rajarhat", "Howrah", "Barrackpore", "Dum Dum", "Tollygunge",
  "Gariahat", "Ballygunge", "Park Street", "Alipore", "Jadavpur",
  "Behala", "Kasba", "Garia", "Narendrapur", "Sonarpur",
  "Baruipur", "Sealdah", "Esplanade", "Shyambazar", "Ultadanga",
  "Lake Town", "Kankurgachi", "Phoolbagan", "Entally", "Park Circus"
];

const CUISINES = [
  "Bengali", "North Indian", "South Indian", "Chinese",
  "Mughlai", "Continental", "Italian", "Thai",
  "Tandoori", "Biryani Specialist", "Street Food", "Desserts",
  "Multi-Cuisine", "Punjabi", "Rajasthani"
];

export default function AdminAddCatererPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    // Basic Info
    name: "",
    description: "",
    
    // Location
    city: "Kolkata",
    area: "",
    address: "",
    
    // Tier Pricing (Fishbowl Model)
    silverPrice: "",
    goldPrice: "",
    platinumPrice: "",
    minPlatePrice: "",
    
    // Features
    isPureVeg: false,
    cuisines: [] as string[],
    minGuests: "100",
    
    // Contact (Fishbowl)
    contactName: "",
    contactNumber: "",
    
    // Media
    images: [] as string[],
    coverImage: "",
    
    // Sample Menu Items
    silverItems: "Rice, Dal, 2 Sabzi, Salad, Papad, Sweet",
    goldItems: "Pulao, Dal Makhani, Paneer Dish, 2 Sabzi, Raita, Salad, Papad, 2 Sweets",
    platinumItems: "Biryani/Pulao, Dal Makhani, Paneer Butter Masala, Malai Kofta, 3 Sabzi, Raita, Multiple Salads, Papad, Live Counter, 3 Premium Sweets, Ice Cream",
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || session.user.role !== "ADMIN") {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleCuisine = (cuisine: string) => {
    setFormData(prev => ({
      ...prev,
      cuisines: prev.cuisines.includes(cuisine)
        ? prev.cuisines.filter(c => c !== cuisine)
        : [...prev.cuisines, cuisine]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const catererData = {
        name: formData.name,
        description: formData.description,
        city: formData.city,
        area: formData.area,
        address: formData.address,
        silverPrice: parseFloat(formData.silverPrice) || null,
        goldPrice: parseFloat(formData.goldPrice) || null,
        platinumPrice: parseFloat(formData.platinumPrice) || null,
        minPlatePrice: parseFloat(formData.minPlatePrice || formData.silverPrice) || 0,
        isPureVeg: formData.isPureVeg,
        cuisines: formData.cuisines.join(","),
        minGuests: parseInt(formData.minGuests),
        contactName: formData.contactName,
        contactNumber: formData.contactNumber,
        phone: formData.contactNumber,
        images: formData.images.join(","),
        coverImage: formData.images[0] || "",
        // Sample menu items for display
        silverItems: formData.silverItems,
        goldItems: formData.goldItems,
        platinumItems: formData.platinumItems,
        // Fishbowl flags
        isAdminListed: true,
        bookingEnabled: false,
        isVerified: false,
      };

      const res = await fetch("/api/admin/caterers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catererData),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/admin?tab=caterers");
        }, 2000);
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || "Failed to add caterer"}`);
      }
    } catch (error) {
      console.error("Error adding caterer:", error);
      alert("Failed to add caterer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Caterer Added Successfully!</h2>
          <p className="text-gray-600">Redirecting to admin dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-rose-50 pb-12">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Add Fishbowl Caterer</h1>
                <p className="text-sm text-gray-500">Admin-listed caterer with tier pricing</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                🐟 Fishbowl Listing
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-2xl"
        >
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Fishbowl Catering Model</h3>
              <p className="text-sm text-blue-700 mt-1">
                Add caterers with Silver, Gold &amp; Platinum tier pricing. Customers will see approximate rates 
                and a &quot;Call for Booking&quot; option. Once verified and tagged to an owner, they can add custom menus.
              </p>
            </div>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-xl">
                <UtensilsCrossed className="h-5 w-5 text-orange-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caterer/Business Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Royal Bengali Caterers"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  placeholder="Describe the caterer, specialties, years of experience..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isPureVeg"
                    checked={formData.isPureVeg}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <Leaf className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-700">Pure Vegetarian</span>
                </label>
              </div>
            </div>
          </motion.div>

          {/* Location */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-xl">
                <MapPin className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Location</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area * <span className="text-orange-600">(Important for search)</span>
                </label>
                <select
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select Area</option>
                  {KOLKATA_AREAS.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Address *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows={2}
                  placeholder="Enter complete address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </motion.div>

          {/* Tier Pricing - Fishbowl Model */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-100 rounded-xl">
                <IndianRupee className="h-5 w-5 text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Tier Pricing (Per Plate)</h2>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">Fishbowl</span>
            </div>

            <div className="space-y-6">
              {/* Silver Tier */}
              <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Medal className="h-6 w-6 text-gray-500" />
                  <h3 className="font-semibold text-gray-900">Silver Package</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price per Plate (₹) *
                    </label>
                    <input
                      type="number"
                      name="silverPrice"
                      value={formData.silverPrice}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., 350"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Includes (approx.)
                    </label>
                    <input
                      type="text"
                      name="silverItems"
                      value={formData.silverItems}
                      onChange={handleInputChange}
                      placeholder="Menu items..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Gold Tier */}
              <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="h-6 w-6 text-yellow-600" />
                  <h3 className="font-semibold text-yellow-900">Gold Package</h3>
                  <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs rounded-full">Popular</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price per Plate (₹) *
                    </label>
                    <input
                      type="number"
                      name="goldPrice"
                      value={formData.goldPrice}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., 550"
                      className="w-full px-4 py-3 border border-yellow-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Includes (approx.)
                    </label>
                    <input
                      type="text"
                      name="goldItems"
                      value={formData.goldItems}
                      onChange={handleInputChange}
                      placeholder="Menu items..."
                      className="w-full px-4 py-3 border border-yellow-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Platinum Tier */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="h-6 w-6 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">Platinum Package</h3>
                  <span className="px-2 py-0.5 bg-purple-200 text-purple-800 text-xs rounded-full">Premium</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price per Plate (₹) *
                    </label>
                    <input
                      type="number"
                      name="platinumPrice"
                      value={formData.platinumPrice}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., 850"
                      className="w-full px-4 py-3 border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Includes (approx.)
                    </label>
                    <input
                      type="text"
                      name="platinumItems"
                      value={formData.platinumItems}
                      onChange={handleInputChange}
                      placeholder="Menu items..."
                      className="w-full px-4 py-3 border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Cuisines */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-rose-100 rounded-xl">
                <Sparkles className="h-5 w-5 text-rose-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Cuisines</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {CUISINES.map(cuisine => (
                <button
                  key={cuisine}
                  type="button"
                  onClick={() => toggleCuisine(cuisine)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    formData.cuisines.includes(cuisine)
                      ? "bg-rose-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {cuisine}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Guests Required
              </label>
              <input
                type="number"
                name="minGuests"
                value={formData.minGuests}
                onChange={handleInputChange}
                placeholder="e.g., 100"
                className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </motion.div>

          {/* Contact Information (Fishbowl) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">For Customers</span>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl mb-6">
              <p className="text-sm text-blue-700">
                <strong>Fishbowl Mode:</strong> Customers will see this contact for direct booking inquiries.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person Name *
                </label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Mr. Das"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., 9876543210"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </motion.div>

          {/* Media */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <ImageIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Images</h2>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Upload directly</span>
            </div>

            <ImageUploader
              images={formData.images}
              onImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
              maxImages={10}
              folder="caterers"
            />
            <p className="text-xs text-gray-500 mt-3">
              📸 Upload up to 10 high-quality images of food, setup, and catering events. First image becomes the cover photo.
            </p>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex gap-4"
          >
            <Link
              href="/admin"
              className="flex-1 py-4 text-center border-2 border-gray-300 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-2xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Adding Caterer...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Add Fishbowl Caterer
                </>
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
