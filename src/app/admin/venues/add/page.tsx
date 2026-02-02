"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  MapPin,
  IndianRupee,
  Users,
  Phone,
  Image as ImageIcon,
  Calendar,
  Sparkles,
  Save,
  Loader2,
  CheckCircle,
  Info,
  Star,
} from "lucide-react";
import Link from "next/link";

// Kolkata Areas for dropdown
const KOLKATA_AREAS = [
  "Barasat", "Kalyani", "Salt Lake", "New Town", "Madhyamgram",
  "Rajarhat", "Howrah", "Barrackpore", "Dum Dum", "Tollygunge",
  "Gariahat", "Ballygunge", "Park Street", "Alipore", "Jadavpur",
  "Behala", "Kasba", "Garia", "Narendrapur", "Sonarpur",
  "Baruipur", "Sealdah", "Esplanade", "Shyambazar", "Ultadanga",
  "Lake Town", "Kankurgachi", "Phoolbagan", "Entally", "Park Circus"
];

const VENUE_TYPES = [
  "Banquet Hall", "Marriage Hall", "Lawn/Garden", "Resort",
  "Hotel", "Farmhouse", "Rooftop", "Community Hall",
  "Palace/Heritage", "Convention Center", "Beach Resort"
];

const AMENITIES_LIST = [
  "AC Hall", "Parking", "Valet Parking", "Catering Allowed",
  "In-house Catering", "Decoration Included", "DJ/Music System",
  "Stage Setup", "Green Room", "Bridal Room", "Wi-Fi",
  "Generator Backup", "Alcohol Permitted", "Outdoor Space",
  "Swimming Pool", "Lift/Elevator", "Wheelchair Access",
  "Fire Safety", "CCTV", "Security"
];

const PRIME_DAYS = [
  "Saturday", "Sunday", "Auspicious Days", "Wedding Season (Nov-Feb)",
  "Public Holidays", "Long Weekends"
];

export default function AdminAddVenuePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    // Basic Info
    name: "",
    description: "",
    venueType: "Banquet Hall",
    
    // Location
    city: "Kolkata",
    area: "",
    address: "",
    pincode: "",
    
    // Capacity
    minGuests: "50",
    maxGuests: "500",
    
    // Pricing - Fishbowl Model
    priceMode: "ESTIMATED",
    estimatedMinPrice: "",
    estimatedMaxPrice: "",
    primeDayPrice: "",
    nonPrimeDayPrice: "",
    primeDays: ["Saturday", "Sunday", "Auspicious Days"],
    
    // Contact (Fishbowl - Direct contact)
    contactName: "",
    contactNumber: "",
    
    // Media
    images: "",
    coverImage: "",
    
    // Amenities
    amenities: [] as string[],
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || session.user.role !== "ADMIN") {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const togglePrimeDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      primeDays: prev.primeDays.includes(day)
        ? prev.primeDays.filter(d => d !== day)
        : [...prev.primeDays, day]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const venueData = {
        name: formData.name,
        description: formData.description,
        venueType: formData.venueType,
        city: formData.city,
        area: formData.area,
        address: formData.address,
        pincode: formData.pincode,
        minGuests: parseInt(formData.minGuests),
        maxGuests: parseInt(formData.maxGuests),
        priceMode: formData.priceMode,
        estimatedMinPrice: parseFloat(formData.estimatedMinPrice) || null,
        estimatedMaxPrice: parseFloat(formData.estimatedMaxPrice) || null,
        primeDayPrice: parseFloat(formData.primeDayPrice) || null,
        nonPrimeDayPrice: parseFloat(formData.nonPrimeDayPrice) || null,
        primeDays: formData.primeDays.join(","),
        contactName: formData.contactName,
        contactNumber: formData.contactNumber,
        images: formData.images,
        coverImage: formData.coverImage || formData.images.split(",")[0] || "",
        amenities: formData.amenities.join(","),
        // Fishbowl flags
        isAdminListed: true,
        bookingEnabled: false,
        isVerified: false,
      };

      const res = await fetch("/api/admin/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(venueData),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/admin?tab=venues");
        }, 2000);
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || "Failed to add venue"}`);
      }
    } catch (error) {
      console.error("Error adding venue:", error);
      alert("Failed to add venue. Please try again.");
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Venue Added Successfully!</h2>
          <p className="text-gray-600">Redirecting to admin dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 pb-12">
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
                <h1 className="text-xl font-bold text-gray-900">Add Fishbowl Venue</h1>
                <p className="text-sm text-gray-500">Admin-listed venue with approximate pricing</p>
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
              <h3 className="font-semibold text-blue-900">Fishbowl Model</h3>
              <p className="text-sm text-blue-700 mt-1">
                This venue will be listed with approximate pricing. Customers will see a &quot;Call for Booking&quot; 
                button instead of online booking. Once you verify an owner and tag this venue to their account, 
                online booking will be enabled.
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
              <div className="p-2 bg-purple-100 rounded-xl">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Royal Palace Banquet"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  placeholder="Describe the venue, its ambiance, special features..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Type *
                </label>
                <select
                  name="venueType"
                  value={formData.venueType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {VENUE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area * <span className="text-purple-600">(Important for search)</span>
                </label>
                <select
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  placeholder="Enter complete address with landmarks"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pincode *
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., 700124"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </motion.div>

          {/* Capacity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Capacity</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Guests *
                </label>
                <input
                  type="number"
                  name="minGuests"
                  value={formData.minGuests}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Guests *
                </label>
                <input
                  type="number"
                  name="maxGuests"
                  value={formData.maxGuests}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </motion.div>

          {/* Pricing - Fishbowl Model */}
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
              <h2 className="text-lg font-semibold text-gray-900">Pricing (Approximate)</h2>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">Fishbowl</span>
            </div>

            <div className="space-y-6">
              {/* Estimated Price Range */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">General Price Range</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Price (₹) *
                    </label>
                    <input
                      type="number"
                      name="estimatedMinPrice"
                      value={formData.estimatedMinPrice}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., 50000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Price (₹) *
                    </label>
                    <input
                      type="number"
                      name="estimatedMaxPrice"
                      value={formData.estimatedMaxPrice}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., 150000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Prime vs Non-Prime Pricing */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 text-purple-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Prime Day vs Regular Day Pricing</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prime Day Price (₹)
                    </label>
                    <input
                      type="number"
                      name="primeDayPrice"
                      value={formData.primeDayPrice}
                      onChange={handleInputChange}
                      placeholder="e.g., 120000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Wedding season, weekends, auspicious days</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Non-Prime Day Price (₹)
                    </label>
                    <input
                      type="number"
                      name="nonPrimeDayPrice"
                      value={formData.nonPrimeDayPrice}
                      onChange={handleInputChange}
                      placeholder="e.g., 80000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Weekdays, off-season</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prime Days (Select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRIME_DAYS.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => togglePrimeDay(day)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          formData.primeDays.includes(day)
                            ? "bg-purple-600 text-white"
                            : "bg-white border border-gray-300 text-gray-700 hover:border-purple-400"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Information (Fishbowl) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-rose-100 rounded-xl">
                <Phone className="h-5 w-5 text-rose-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
              <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs rounded-full">For Customers</span>
            </div>

            <div className="p-4 bg-rose-50 rounded-xl mb-6">
              <p className="text-sm text-rose-700">
                <strong>Fishbowl Mode:</strong> Since online booking is not enabled, customers will see this 
                contact information to directly call and book the venue.
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
                  placeholder="e.g., Mr. Sharma"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </motion.div>

          {/* Media */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <ImageIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Images</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URLs (comma-separated) *
              </label>
              <textarea
                name="images"
                value={formData.images}
                onChange={handleInputChange}
                required
                rows={3}
                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                First image will be used as cover. Use Unsplash, Cloudinary, or any direct image URLs.
              </p>
            </div>
          </motion.div>

          {/* Amenities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-teal-100 rounded-xl">
                <Sparkles className="h-5 w-5 text-teal-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Amenities</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {AMENITIES_LIST.map(amenity => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    formData.amenities.includes(amenity)
                      ? "bg-teal-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
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
              className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Adding Venue...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Add Fishbowl Venue
                </>
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
