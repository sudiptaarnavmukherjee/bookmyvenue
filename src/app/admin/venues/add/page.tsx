"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  MapPin,
  IndianRupee,
  Users,
  Phone,
  Save,
  Loader2,
  CheckCircle,
  Camera,
  X,
} from "lucide-react";
import Link from "next/link";
import ImageUploader from "@/components/upload/ImageUploader";

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

export default function AdminAddVenuePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showImageUploader, setShowImageUploader] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    venueType: "Banquet Hall",
    city: "Kolkata",
    area: "",
    address: "",
    pincode: "",
    minGuests: "50",
    maxGuests: "500",
    estimatedMinPrice: "",
    estimatedMaxPrice: "",
    primeDayPrice: "",
    nonPrimeDayPrice: "",
    contactName: "",
    contactNumber: "",
    images: [] as string[],
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
        priceMode: "ESTIMATED",
        estimatedMinPrice: parseFloat(formData.estimatedMinPrice) || null,
        estimatedMaxPrice: parseFloat(formData.estimatedMaxPrice) || null,
        primeDayPrice: parseFloat(formData.primeDayPrice) || null,
        nonPrimeDayPrice: parseFloat(formData.nonPrimeDayPrice) || null,
        contactName: formData.contactName,
        contactNumber: formData.contactNumber,
        images: formData.images.join(","),
        coverImage: formData.images[0] || "",
        amenities: formData.amenities.join(","),
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
        }, 1500);
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
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Venue Added!</h2>
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
                <h1 className="font-bold text-gray-900">Add Venue</h1>
                <p className="text-xs text-gray-500">Fishbowl listing • Call to book</p>
              </div>
            </div>
            <button
              type="submit"
              form="venue-form"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-600 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </button>
          </div>
        </div>
      </div>

      <form id="venue-form" onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl p-5 border">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-rose-500" />
            Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g., Royal Palace Banquet"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
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
                placeholder="Brief description of the venue..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue Type</label>
                <select
                  name="venueType"
                  value={formData.venueType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
                >
                  {VENUE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area *</label>
                <select
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">Select Area</option>
                  {KOLKATA_AREAS.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Street address, building name..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Capacity */}
        <div className="bg-white rounded-xl p-5 border">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            Capacity
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Guests</label>
              <input
                type="number"
                name="minGuests"
                value={formData.minGuests}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Guests</label>
              <input
                type="number"
                name="maxGuests"
                value={formData.maxGuests}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl p-5 border">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-green-500" />
            Pricing (Approximate)
          </h2>
          <p className="text-xs text-gray-500 mb-4">Enter estimated price range. Customers will call to confirm exact pricing.</p>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Price (₹)</label>
              <input
                type="number"
                name="estimatedMinPrice"
                value={formData.estimatedMinPrice}
                onChange={handleInputChange}
                placeholder="50000"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (₹)</label>
              <input
                type="number"
                name="estimatedMaxPrice"
                value={formData.estimatedMaxPrice}
                onChange={handleInputChange}
                placeholder="150000"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-3 bg-amber-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1">Prime Day Price (₹)</label>
              <input
                type="number"
                name="primeDayPrice"
                value={formData.primeDayPrice}
                onChange={handleInputChange}
                placeholder="Weekend/auspicious days"
                className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1">Regular Day Price (₹)</label>
              <input
                type="number"
                name="nonPrimeDayPrice"
                value={formData.nonPrimeDayPrice}
                onChange={handleInputChange}
                placeholder="Weekdays"
                className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
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
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
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
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl p-5 border">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Camera className="h-4 w-4 text-indigo-500" />
            Images
          </h2>
          
          {/* Image Grid */}
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
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-rose-400 hover:text-rose-500 transition-colors"
            >
              <Camera className="h-6 w-6 mb-1" />
              <span className="text-xs">Add</span>
            </button>
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-white rounded-xl p-5 border">
          <h2 className="font-semibold text-gray-900 mb-4">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {AMENITIES_LIST.map(amenity => (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  formData.amenities.includes(amenity)
                    ? "bg-rose-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {amenity}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button (Mobile) */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 disabled:opacity-50 transition-colors sm:hidden"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          Save Venue
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
              onUpload={(urls) => {
                setFormData(prev => ({
                  ...prev,
                  images: [...prev.images, ...urls]
                }));
                setShowImageUploader(false);
              }}
              multiple
              maxFiles={10}
            />
          </div>
        </div>
      )}
    </div>
  );
}
