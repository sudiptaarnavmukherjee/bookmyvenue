"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UtensilsCrossed,
  MapPin,
  IndianRupee,
  Phone,
  Save,
  Loader2,
  CheckCircle,
  Camera,
  X,
  Leaf,
  Medal,
  Award,
  Crown,
} from "lucide-react";
import Link from "next/link";
import ImageUploader from "@/components/upload/ImageUploader";
import LocationPicker from "@/components/admin/LocationPicker";

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
  const [showImageUploader, setShowImageUploader] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    city: "Kolkata",
    area: "",
    address: "",
    pincode: "",
    latitude: null as number | null,
    longitude: null as number | null,
    silverPrice: "",
    goldPrice: "",
    platinumPrice: "",
    isPureVeg: false,
    cuisines: [] as string[],
    minGuests: "100",
    contactName: "",
    contactNumber: "",
    images: [] as string[],
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

  const handleLocationChange = (location: {
    address: string;
    area: string;
    city: string;
    pincode: string;
    latitude: number | null;
    longitude: number | null;
  }) => {
    setFormData(prev => ({
      ...prev,
      address: location.address,
      area: location.area,
      city: location.city || "Kolkata",
      pincode: location.pincode,
      latitude: location.latitude,
      longitude: location.longitude,
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
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
        latitude: formData.latitude,
        longitude: formData.longitude,
        silverPrice: parseFloat(formData.silverPrice) || null,
        goldPrice: parseFloat(formData.goldPrice) || null,
        platinumPrice: parseFloat(formData.platinumPrice) || null,
        minPlatePrice: parseFloat(formData.silverPrice) || 0,
        isPureVeg: formData.isPureVeg,
        cuisines: formData.cuisines.join(","),
        minGuests: parseInt(formData.minGuests),
        contactName: formData.contactName,
        contactNumber: formData.contactNumber,
        phone: formData.contactNumber,
        images: formData.images.join(","),
        coverImage: formData.images[0] || "",
        silverItems: formData.silverItems,
        goldItems: formData.goldItems,
        platinumItems: formData.platinumItems,
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
        }, 1500);
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
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Caterer Added!</h2>
          <p className="text-gray-600">Redirecting to admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="font-bold text-gray-900">Add Caterer</h1>
                <p className="text-xs text-gray-500">Fishbowl listing • Call to book</p>
              </div>
            </div>
            <button
              type="submit"
              form="caterer-form"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </button>
          </div>
        </div>
      </div>

      <form id="caterer-form" onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl p-5 border">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-orange-500" />
            Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caterer Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g., Sharma Catering Services"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={3}
                placeholder="Brief description of the catering service..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="bg-white rounded-xl p-5 border">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-purple-500" />
            Location (Important for Nearby Search)
          </h2>
          
          <LocationPicker
            value={{
              address: formData.address,
              area: formData.area,
              city: formData.city,
              pincode: formData.pincode,
              latitude: formData.latitude || undefined,
              longitude: formData.longitude || undefined,
            }}
            onChange={handleLocationChange}
            placeholder="Search caterer location on Ola Maps..."
          />

          {/* Manual Area Selection (fallback) */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500 mb-3">Or select area manually:</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                <select
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select Area</option>
                  {KOLKATA_AREAS.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min. Guests</label>
                <input
                  type="number"
                  name="minGuests"
                  value={formData.minGuests}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-xl p-5 border">
          <h2 className="font-semibold text-gray-900 mb-4">Features</h2>
          
          {/* Pure Veg Toggle */}
          <label className="flex items-center gap-3 p-3 bg-green-50 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              name="isPureVeg"
              checked={formData.isPureVeg}
              onChange={handleInputChange}
              className="rounded text-green-500 focus:ring-green-500"
            />
            <Leaf className="h-5 w-5 text-green-500" />
              <span className="font-medium text-green-700">Pure Vegetarian</span>
            </label>
          </div>
        </div>

        {/* Tier Pricing */}
        <div className="bg-white rounded-xl p-5 border">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-green-500" />
            Package Pricing (Per Plate)
          </h2>
          <p className="text-xs text-gray-500 mb-4">Set per-plate prices for different packages</p>
          
          <div className="space-y-4">
            {/* Silver */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Medal className="h-5 w-5 text-gray-500" />
                <span className="font-medium text-gray-700">Silver Package</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Price per plate (₹)</label>
                  <input
                    type="number"
                    name="silverPrice"
                    value={formData.silverPrice}
                    onChange={handleInputChange}
                    placeholder="350"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Items included</label>
                  <input
                    type="text"
                    name="silverItems"
                    value={formData.silverItems}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Gold */}
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-700">Gold Package</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-yellow-600 mb-1">Price per plate (₹)</label>
                  <input
                    type="number"
                    name="goldPrice"
                    value={formData.goldPrice}
                    onChange={handleInputChange}
                    placeholder="550"
                    className="w-full px-3 py-2 border border-yellow-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs text-yellow-600 mb-1">Items included</label>
                  <input
                    type="text"
                    name="goldItems"
                    value={formData.goldItems}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-yellow-200 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Platinum */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-purple-700">Platinum Package</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-purple-600 mb-1">Price per plate (₹)</label>
                  <input
                    type="number"
                    name="platinumPrice"
                    value={formData.platinumPrice}
                    onChange={handleInputChange}
                    placeholder="850"
                    className="w-full px-3 py-2 border border-purple-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs text-purple-600 mb-1">Items included</label>
                  <input
                    type="text"
                    name="platinumItems"
                    value={formData.platinumItems}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-xl p-5 border">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Phone className="h-4 w-4 text-purple-500" />
            Contact Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleInputChange}
                placeholder="Name"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                required
                placeholder="+91 98XXXXXXXX"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl p-5 border">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Camera className="h-4 w-4 text-indigo-500" />
            Food & Setup Images
          </h2>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
            {formData.images.map((img, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
                {index === 0 && (
                  <span className="absolute bottom-1 left-1 text-xs bg-black/70 text-white px-2 py-0.5 rounded">
                    Cover
                  </span>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setShowImageUploader(true)}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-500 transition-colors"
            >
              <Camera className="h-6 w-6 mb-1" />
              <span className="text-xs">Add</span>
            </button>
          </div>
        </div>

        {/* Cuisines */}
        <div className="bg-white rounded-xl p-5 border">
          <h2 className="font-semibold text-gray-900 mb-4">Cuisines Offered</h2>
          <div className="flex flex-wrap gap-2">
            {CUISINES.map(cuisine => (
              <button
                key={cuisine}
                type="button"
                onClick={() => toggleCuisine(cuisine)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  formData.cuisines.includes(cuisine)
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button (Mobile) */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors sm:hidden"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          Save Caterer
        </button>
      </form>

      {/* Image Uploader Modal */}
      {showImageUploader && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Upload Images</h3>
              <button onClick={() => setShowImageUploader(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <ImageUploader
              images={formData.images}
              onImagesChange={(images) => {
                setFormData(prev => ({
                  ...prev,
                  images
                }));
              }}
              maxImages={10}
            />
          </div>
        </div>
      )}
    </div>
  );
}
