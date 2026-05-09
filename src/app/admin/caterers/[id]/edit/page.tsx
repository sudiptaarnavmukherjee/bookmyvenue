"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, UtensilsCrossed, MapPin, IndianRupee,
  Phone, Save, Loader2, CheckCircle, Camera, X, Leaf,
} from "lucide-react";
import Link from "next/link";
import ImageUploader from "@/components/upload/ImageUploader";
import LocationPicker from "@/components/admin/LocationPicker";
import { parseGoogleMapsUrl } from "@/lib/utils";

const KOLKATA_AREAS = [
  "Barasat", "Kalyani", "Salt Lake", "New Town", "Madhyamgram",
  "Rajarhat", "Howrah", "Barrackpore", "Dum Dum", "Tollygunge",
  "Gariahat", "Ballygunge", "Park Street", "Alipore", "Jadavpur",
  "Behala", "Kasba", "Garia", "Narendrapur", "Sonarpur",
  "Baruipur", "Sealdah", "Esplanade", "Shyambazar", "Ultadanga",
  "Lake Town", "Kankurgachi", "Phoolbagan", "Entally", "Park Circus",
];

const CUISINES = [
  "Bengali", "North Indian", "South Indian", "Chinese",
  "Mughlai", "Continental", "Italian", "Thai",
  "Tandoori", "Biryani Specialist", "Street Food", "Desserts",
  "Multi-Cuisine", "Punjabi", "Rajasthani",
];

type FormData = {
  name: string; description: string;
  city: string; area: string; address: string; pincode: string;
  latitude: number | null; longitude: number | null; googleMapsUrl: string;
  silverPrice: string; goldPrice: string; platinumPrice: string; minPlatePrice: string;
  isPureVeg: boolean;
  cuisines: string[];
  contactName: string; contactNumber: string;
  images: string[];
};

export default function EditCatererPage({
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
  const [showImageUploader, setShowImageUploader] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: "", description: "",
    city: "Kolkata", area: "", address: "", pincode: "",
    latitude: null, longitude: null, googleMapsUrl: "",
    silverPrice: "", goldPrice: "", platinumPrice: "", minPlatePrice: "",
    isPureVeg: false,
    cuisines: [],
    contactName: "", contactNumber: "",
    images: [],
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      router.push("/auth/signin");
      return;
    }
    fetchCaterer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status]);

  const fetchCaterer = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/caterers");
      const data = await res.json();
      const caterer = (data.caterers || []).find((c: any) => c.id === id);
      if (!caterer) { setNotFound(true); return; }

      setFormData({
        name: caterer.name || "",
        description: caterer.description || "",
        city: caterer.city || "Kolkata",
        area: caterer.area || "",
        address: caterer.address || "",
        pincode: caterer.pincode || "",
        latitude: caterer.latitude ?? null,
        longitude: caterer.longitude ?? null,
        googleMapsUrl: caterer.googleMapsUrl || "",
        silverPrice: caterer.silverPrice ? String(caterer.silverPrice) : "",
        goldPrice: caterer.goldPrice ? String(caterer.goldPrice) : "",
        platinumPrice: caterer.platinumPrice ? String(caterer.platinumPrice) : "",
        minPlatePrice: caterer.minPlatePrice ? String(caterer.minPlatePrice) : "",
        isPureVeg: caterer.isPureVeg || false,
        cuisines: caterer.cuisines ? caterer.cuisines.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        contactName: caterer.contactName || "",
        contactNumber: caterer.contactNumber || "",
        images: caterer.images ? caterer.images.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
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
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleGoogleMapsUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData((prev) => {
      const coords = parseGoogleMapsUrl(url);
      return { ...prev, googleMapsUrl: url, ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}) };
    });
  };

  const toggleCuisine = (c: string) => {
    setFormData((prev) => ({
      ...prev,
      cuisines: prev.cuisines.includes(c) ? prev.cuisines.filter((x) => x !== c) : [...prev.cuisines, c],
    }));
  };

  const handleLocationChange = (location: {
    address: string; area: string; city: string; pincode: string;
    latitude: number | null; longitude: number | null;
  }) => {
    setFormData((prev) => ({
      ...prev, address: location.address, area: location.area,
      city: location.city || "Kolkata", pincode: location.pincode,
      latitude: location.latitude, longitude: location.longitude,
    }));
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { alert("Caterer name is required"); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/caterers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          city: formData.city,
          area: formData.area,
          address: formData.address,
          pincode: formData.pincode,
          latitude: formData.latitude,
          longitude: formData.longitude,
          googleMapsUrl: formData.googleMapsUrl,
          silverPrice: formData.silverPrice || null,
          goldPrice: formData.goldPrice || null,
          platinumPrice: formData.platinumPrice || null,
          minPlatePrice: formData.minPlatePrice || null,
          isPureVeg: formData.isPureVeg,
          cuisines: formData.cuisines.join(","),
          contactName: formData.contactName,
          contactNumber: formData.contactNumber,
          images: formData.images,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push("/admin/caterers"), 1500);
      } else {
        alert(data.error || "Failed to update caterer");
      }
    } catch {
      alert("Failed to update caterer. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <UtensilsCrossed className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-xl font-semibold text-gray-600">Caterer not found</p>
          <Link href="/admin/caterers" className="text-orange-600 text-sm mt-2 inline-block hover:underline">
            Back to caterers
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Caterer Updated!</h2>
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
              <Link href="/admin/caterers" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="font-bold text-gray-900">Edit Caterer</h1>
                <p className="text-xs text-gray-500 truncate max-w-[200px]">{formData.name}</p>
              </div>
            </div>
            <button type="submit" form="caterer-edit-form" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <form id="caterer-edit-form" onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl p-5 border">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-orange-500" />
            Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caterer Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required
                placeholder="e.g., Bose Brothers Catering"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3}
                placeholder="About the caterer, specialities..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                <select name="area" value={formData.area} onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500">
                  <option value="">Select Area</option>
                  {KOLKATA_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleInputChange}
                  placeholder="Street address..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>

            {/* Pure Veg toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-12 h-6 rounded-full transition-colors relative ${formData.isPureVeg ? "bg-green-500" : "bg-gray-300"}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.isPureVeg ? "translate-x-7" : "translate-x-1"}`} />
              </div>
              <input type="checkbox" name="isPureVeg" checked={formData.isPureVeg} onChange={handleInputChange} className="sr-only" />
              <span className="flex items-center gap-1 text-sm font-medium text-gray-700">
                <Leaf className="h-4 w-4 text-green-500" /> Pure Veg only
              </span>
            </label>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl p-5 border">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-orange-500" />
            Location (for Nearby Search)
          </h2>
          <LocationPicker
            value={{
              address: formData.address, area: formData.area, city: formData.city,
              pincode: formData.pincode,
              latitude: formData.latitude ?? undefined, longitude: formData.longitude ?? undefined,
            }}
            onChange={handleLocationChange}
            placeholder="Search caterer location on Ola Maps..."
          />
          {formData.latitude && formData.longitude && (
            <p className="text-xs text-green-600 mt-2 font-medium">
              ✓ Coordinates: {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
            </p>
          )}
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps URL (optional)</label>
            <input type="url" name="googleMapsUrl" value={formData.googleMapsUrl}
              onChange={handleGoogleMapsUrlChange} placeholder="https://maps.app.goo.gl/..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
          </div>
        </div>

        {/* Cuisines */}
        <div className="bg-white rounded-xl p-5 border">
          <h2 className="font-semibold text-gray-900 mb-4">Cuisines Served</h2>
          <div className="flex flex-wrap gap-2">
            {CUISINES.map((cuisine) => (
              <button key={cuisine} type="button" onClick={() => toggleCuisine(cuisine)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  formData.cuisines.includes(cuisine) ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}>
                {cuisine}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing per plate */}
        <div className="bg-white rounded-xl p-5 border">
          <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-green-500" />
            Package Pricing (per plate)
          </h2>
          <p className="text-xs text-gray-500 mb-4">Leave empty what doesn&apos;t apply.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">🥈 Silver (₹/plate)</label>
              <input type="number" name="silverPrice" value={formData.silverPrice}
                onChange={handleInputChange} placeholder="e.g. 350"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">🥇 Gold (₹/plate)</label>
              <input type="number" name="goldPrice" value={formData.goldPrice}
                onChange={handleInputChange} placeholder="e.g. 550"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">💎 Platinum (₹/plate)</label>
              <input type="number" name="platinumPrice" value={formData.platinumPrice}
                onChange={handleInputChange} placeholder="e.g. 850"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Starting from (₹/plate)</label>
              <input type="number" name="minPlatePrice" value={formData.minPlatePrice}
                onChange={handleInputChange} placeholder="e.g. 300"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-xl p-5 border">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Phone className="h-4 w-4 text-orange-500" />
            Contact
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
              <input type="text" name="contactName" value={formData.contactName}
                onChange={handleInputChange} placeholder="Manager / Owner name"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input type="tel" name="contactNumber" value={formData.contactNumber}
                onChange={handleInputChange} placeholder="+91 98765 43210"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl p-5 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Camera className="h-4 w-4 text-pink-500" />
              Photos ({formData.images.length})
            </h2>
            <button type="button" onClick={() => setShowImageUploader(!showImageUploader)}
              className="text-sm px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors">
              {showImageUploader ? "Done" : "Add Photos"}
            </button>
          </div>
          {showImageUploader && (
            <div className="mb-4">
              <ImageUploader
                onUploadComplete={(urls: string[]) =>
                  setFormData((prev) => ({ ...prev, images: [...prev.images, ...urls] }))
                }
                maxFiles={10}
                folder="caterers"
              />
            </div>
          )}
          {formData.images.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {formData.images.map((url, i) => (
                <div key={i} className="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  {i === 0 && (
                    <span className="absolute top-1 left-1 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      Cover
                    </span>
                  )}
                  <button type="button" onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
