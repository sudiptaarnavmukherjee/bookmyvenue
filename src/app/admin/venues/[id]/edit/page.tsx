"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, MapPin, IndianRupee, Users,
  Phone, Save, Loader2, CheckCircle,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { parseGoogleMapsUrl } from "@/lib/utils";

const ImageUploader = dynamic(() => import("@/components/upload/ImageUploader"), {
  ssr: false,
});

const LocationPicker = dynamic(() => import("@/components/admin/LocationPicker"), {
  ssr: false,
});

const KOLKATA_AREAS = [
  "Barasat", "Kalyani", "Salt Lake", "New Town", "Madhyamgram",
  "Rajarhat", "Howrah", "Barrackpore", "Dum Dum", "Tollygunge",
  "Gariahat", "Ballygunge", "Park Street", "Alipore", "Jadavpur",
  "Behala", "Kasba", "Garia", "Narendrapur", "Sonarpur",
  "Baruipur", "Sealdah", "Esplanade", "Shyambazar", "Ultadanga",
  "Lake Town", "Kankurgachi", "Phoolbagan", "Entally", "Park Circus",
];

const INDIAN_STATES = [
  "West Bengal", "Maharashtra", "Delhi", "Karnataka", "Tamil Nadu",
  "Uttar Pradesh", "Gujarat", "Punjab", "Rajasthan", "Andhra Pradesh",
  "Telangana", "Kerala", "Jharkhand", "Odisha", "Bihar",
  "Madhya Pradesh", "Haryana", "Himachal Pradesh", "Uttarakhand", "Assam",
  "Goa", "Tripura", "Mizoram", "Manipur", "Meghalya", "Nagaland", "Sikkim",
];

const VENUE_TYPES = [
  "Banquet Hall", "Marriage Hall", "Lawn/Garden", "Resort",
  "Hotel", "Farmhouse", "Rooftop", "Community Hall",
  "Palace/Heritage", "Convention Center", "Beach Resort",
];

const AMENITIES_LIST = [
  "AC Hall", "Parking", "Valet Parking", "Catering Allowed",
  "In-house Catering", "Decoration Included", "DJ/Music System",
  "Stage Setup", "Green Room", "Bridal Room", "Wi-Fi",
  "Generator Backup", "Alcohol Permitted", "Outdoor Space",
  "Swimming Pool", "Lift/Elevator", "Wheelchair Access",
  "Fire Safety", "CCTV", "Security",
];

type FormData = {
  name: string;
  description: string;
  venueType: string;
  state: string;
  city: string;
  area: string;
  address: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string;
  minGuests: string;
  maxGuests: string;
  estimatedMinPrice: string;
  estimatedMaxPrice: string;
  marriagePrice: string;
  birthdayPrice: string;
  otherEventPrice: string;
  contactName: string;
  contactNumber: string;
  images: string[];
  amenities: string[];
};

export default function EditVenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    venueType: "Banquet Hall",
    state: "West Bengal",
    city: "Kolkata",
    area: "",
    address: "",
    pincode: "",
    latitude: null,
    longitude: null,
    googleMapsUrl: "",
    minGuests: "50",
    maxGuests: "500",
    estimatedMinPrice: "",
    estimatedMaxPrice: "",
    marriagePrice: "",
    birthdayPrice: "",
    otherEventPrice: "",
    contactName: "",
    contactNumber: "",
    images: [],
    amenities: [],
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      router.push("/auth/signin");
      return;
    }
    fetchVenue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status]);

  const fetchVenue = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/venues");
      const data = await res.json();
      const venue = (data.venues || []).find((v: any) => v.id === id);
      if (!venue) { setNotFound(true); return; }

      setFormData({
        name: venue.name || "",
        description: venue.description || "",
        venueType: venue.venueType || "Banquet Hall",
        state: venue.state || "West Bengal",
        city: venue.city || "Kolkata",
        area: venue.area || "",
        address: venue.address || "",
        pincode: venue.pincode || "",
        latitude: venue.latitude ?? null,
        longitude: venue.longitude ?? null,
        googleMapsUrl: venue.googleMapsUrl || "",
        minGuests: String(venue.minGuests || 50),
        maxGuests: String(venue.maxGuests || 500),
        estimatedMinPrice: venue.estimatedMinPrice ? String(venue.estimatedMinPrice) : "",
        estimatedMaxPrice: venue.estimatedMaxPrice ? String(venue.estimatedMaxPrice) : "",
        marriagePrice: venue.marriagePrice ? String(venue.marriagePrice) : "",
        birthdayPrice: venue.birthdayPrice ? String(venue.birthdayPrice) : "",
        otherEventPrice: venue.otherEventPrice ? String(venue.otherEventPrice) : "",
        contactName: venue.contactName || "",
        contactNumber: venue.contactNumber || "",
        images: venue.images ? venue.images.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        amenities: venue.amenities ? venue.amenities.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      });
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGoogleMapsUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData((prev) => {
      const coords = parseGoogleMapsUrl(url);
      return {
        ...prev,
        googleMapsUrl: url,
        ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
      };
    });
  };

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleLocationChange = (location: {
    address: string; area: string; city: string; pincode: string;
    latitude: number | null; longitude: number | null;
  }) => {
    setFormData((prev) => ({
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
    setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { alert("Venue name is required"); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/venues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          venueType: formData.venueType,
          state: formData.state,
          city: formData.city,
          area: formData.area,
          address: formData.address,
          pincode: formData.pincode,
          latitude: formData.latitude,
          longitude: formData.longitude,
          googleMapsUrl: formData.googleMapsUrl,
          minGuests: formData.minGuests,
          maxGuests: formData.maxGuests,
          priceMode: "ESTIMATED",
          estimatedMinPrice: formData.estimatedMinPrice || null,
          estimatedMaxPrice: formData.estimatedMaxPrice || null,
          marriagePrice: formData.marriagePrice || null,
          birthdayPrice: formData.birthdayPrice || null,
          otherEventPrice: formData.otherEventPrice || null,
          contactName: formData.contactName,
          contactNumber: formData.contactNumber,
          images: formData.images,
          amenities: formData.amenities,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push("/admin/venues"), 1500);
      } else {
        alert(data.error || "Failed to update venue");
      }
    } catch {
      alert("Failed to update venue. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-xl font-semibold text-gray-600">Venue not found</p>
          <Link href="/admin/venues" className="text-purple-600 text-sm mt-2 inline-block hover:underline">
            Back to venues
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Venue Updated!</h2>
          <p className="text-gray-600">Redirecting…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin/venues" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="font-bold text-gray-900">Edit Venue</h1>
                <p className="text-xs text-gray-500 truncate max-w-[200px]">{formData.name}</p>
              </div>
            </div>
            <button
              type="submit"
              form="venue-edit-form"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <form id="venue-edit-form" onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl p-5 border">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-purple-500" />
            Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name *</label>
              <input
                type="text" name="name" value={formData.name}
                onChange={handleInputChange} required
                placeholder="e.g., Royal Palace Banquet"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                name="description" value={formData.description}
                onChange={handleInputChange} required rows={3}
                placeholder="Brief description of the venue..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue Type</label>
                <select name="venueType" value={formData.venueType} onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                  {VENUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select name="state" value={formData.state} onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input type="text" name="city" value={formData.city} onChange={handleInputChange}
                  placeholder="e.g., Kolkata"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Locality / Area</label>
                <select name="area" value={formData.area} onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option value="">Select Locality</option>
                  {KOLKATA_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
              <input type="text" name="address" value={formData.address}
                onChange={handleInputChange} placeholder="Building name, house number, street..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
              <p className="text-xs text-gray-500 mt-1">Include building name, house number, and street details</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
              <input type="text" name="pincode" value={formData.pincode}
                onChange={handleInputChange} placeholder="e.g., 700064"
                maxLength={6}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
              <p className="text-xs text-gray-500 mt-1">6-digit Indian postal code</p>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl p-5 border">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-purple-500" />
            Location (for Nearby Search)
          </h2>
          <LocationPicker
            value={{
              address: formData.address, area: formData.area, city: formData.city,
              pincode: formData.pincode,
              latitude: formData.latitude ?? undefined,
              longitude: formData.longitude ?? undefined,
            }}
            onChange={handleLocationChange}
            placeholder="Search venue location on Ola Maps..."
          />
          {formData.latitude && formData.longitude && (
            <p className="text-xs text-green-600 mt-2 font-medium">
              ✓ Coordinates: {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
            </p>
          )}
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Maps URL (Google/Ola) (optional)</label>
            <input type="url" name="googleMapsUrl" value={formData.googleMapsUrl}
              onChange={handleGoogleMapsUrlChange} placeholder="https://maps.app.goo.gl/... or https://maps.olacabs.com/?q=..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
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
              <input type="number" name="minGuests" value={formData.minGuests}
                onChange={handleInputChange} min={1}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Guests</label>
              <input type="number" name="maxGuests" value={formData.maxGuests}
                onChange={handleInputChange} min={1}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl p-5 border">
          <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-green-500" />
            Event-Type Pricing
          </h2>
          <p className="text-xs text-gray-500 mb-4">These 3 prices are shown on every card.</p>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">💍 Marriage (₹)</label>
              <input type="number" name="marriagePrice" value={formData.marriagePrice}
                onChange={handleInputChange} placeholder="e.g. 250000"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">🎂 Birthday (₹)</label>
              <input type="number" name="birthdayPrice" value={formData.birthdayPrice}
                onChange={handleInputChange} placeholder="e.g. 80000"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">🙏 Other (₹)</label>
              <input type="number" name="otherEventPrice" value={formData.otherEventPrice}
                onChange={handleInputChange} placeholder="e.g. 60000"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Estimate (₹)</label>
              <input type="number" name="estimatedMinPrice" value={formData.estimatedMinPrice}
                onChange={handleInputChange} placeholder="50000"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Estimate (₹)</label>
              <input type="number" name="estimatedMaxPrice" value={formData.estimatedMaxPrice}
                onChange={handleInputChange} placeholder="300000"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-xl p-5 border">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Phone className="h-4 w-4 text-orange-500" />
            Contact (Fishbowl)
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
              <input type="text" name="contactName" value={formData.contactName}
                onChange={handleInputChange} placeholder="Manager name"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input type="tel" name="contactNumber" value={formData.contactNumber}
                onChange={handleInputChange} placeholder="+91 98765 43210"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl p-5 border">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            Photos
          </h2>
          <ImageUploader
            images={formData.images}
            onImagesChange={(imgs) => setFormData((prev) => ({ ...prev, images: imgs }))}
            maxImages={10}
            folder="venues"
          />
        </div>

        {/* Amenities */}
        <div className="bg-white rounded-xl p-5 border">
          <h2 className="font-semibold text-gray-900 mb-4">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {AMENITIES_LIST.map((amenity) => (
              <button key={amenity} type="button" onClick={() => toggleAmenity(amenity)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  formData.amenities.includes(amenity)
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}>
                {amenity}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
