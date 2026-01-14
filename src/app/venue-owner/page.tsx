"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api-client";
import { Calendar, CheckCircle2, Clock, Users, Loader2, Plus, Building, MapPin, X } from "lucide-react";

type Venue = {
  id: string;
  name: string;
  city: string;
  area: string;
  priceMode: string;
  exactPrice?: number;
  estimatedMinPrice?: number;
  estimatedMaxPrice?: number;
  maxGuests: number;
  isVerified: boolean;
  coverImage?: string;
};

export default function VenueOwnerDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"venues" | "bookings">("venues");
  
  const [showAddVenue, setShowAddVenue] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newVenue, setNewVenue] = useState({
    name: "", description: "", city: "", area: "", address: "", pincode: "",
    priceMode: "EXACT", exactPrice: "", estimatedMinPrice: "", estimatedMaxPrice: "",
    minGuests: "50", maxGuests: "500", venueType: "Banquet Hall",
    amenities: "Parking,AC,Catering", images: ""
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.getMyVenues();
      if (!res.error && res.data) {
        const data = res.data as any;
        setVenues(Array.isArray(data.venues) ? data.venues : Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
    else if (status === "authenticated") fetchData();
  }, [status, router]);

  const handleAddVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const venueData = {
        name: newVenue.name,
        description: newVenue.description,
        city: newVenue.city,
        area: newVenue.area,
        address: newVenue.address,
        pincode: newVenue.pincode,
        priceMode: newVenue.priceMode,
        exactPrice: newVenue.priceMode === "EXACT" ? parseFloat(newVenue.exactPrice) || 0 : 0,
        estimatedMinPrice: newVenue.priceMode === "ESTIMATED" ? parseFloat(newVenue.estimatedMinPrice) || 0 : 0,
        estimatedMaxPrice: newVenue.priceMode === "ESTIMATED" ? parseFloat(newVenue.estimatedMaxPrice) || 0 : 0,
        minGuests: newVenue.minGuests,
        maxGuests: newVenue.maxGuests,
        venueType: newVenue.venueType,
        amenities: newVenue.amenities.split(",").map(a => a.trim()),
        images: newVenue.images ? newVenue.images.split(",").map(i => i.trim()) : [],
        coverImage: newVenue.images ? newVenue.images.split(",")[0] : "",
        ownerId: session?.user?.id
      };
      
      const res = await api.createVenue(venueData);
      if (res.error) alert("Failed: " + res.error);
      else {
        alert("Venue created!");
        setShowAddVenue(false);
        setNewVenue({ name: "", description: "", city: "", area: "", address: "", pincode: "", priceMode: "EXACT", exactPrice: "", estimatedMinPrice: "", estimatedMaxPrice: "", minGuests: "50", maxGuests: "500", venueType: "Banquet Hall", amenities: "Parking,AC,Catering", images: "" });
        fetchData();
      }
    } catch (err) { alert("Failed to create venue"); }
    finally { setSaving(false); }
  };

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Venue Owner Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome, {session?.user?.name}</p>
          </div>
          <button onClick={() => setShowAddVenue(true)} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90">
            <Plus className="h-5 w-5" /> Add New Venue
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">My Venues</h2>
          
          {venues.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No venues yet</h3>
              <p className="text-gray-500 mb-6">Add your first venue to start receiving bookings</p>
              <button onClick={() => setShowAddVenue(true)} className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold">
                <Plus className="h-5 w-5" /> Add Your First Venue
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map((venue) => (
                <div key={venue.id} className="bg-gray-50 rounded-xl overflow-hidden border">
                  <div className="h-40 bg-gradient-to-r from-purple-400 to-pink-400 relative">
                    {venue.coverImage && <img src={venue.coverImage} alt={venue.name} className="w-full h-full object-cover" />}
                    <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${venue.isVerified ? "bg-green-500 text-white" : "bg-yellow-500 text-white"}`}>
                      {venue.isVerified ? "Verified" : "Pending"}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900">{venue.name}</h3>
                    <p className="text-gray-600 text-sm flex items-center gap-1 mt-1"><MapPin className="h-4 w-4" />{venue.area}, {venue.city}</p>
                    <div className="flex justify-between items-center mt-4">
                      <p className="text-purple-600 font-bold">₹{(venue.exactPrice || venue.estimatedMinPrice || 0).toLocaleString('en-IN')}</p>
                      <p className="text-gray-500 text-sm"><Users className="h-4 w-4 inline mr-1" />{venue.maxGuests} guests</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showAddVenue && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
                <h2 className="text-2xl font-bold">Add New Venue</h2>
                <button onClick={() => setShowAddVenue(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-6 w-6" /></button>
              </div>
              
              <form onSubmit={handleAddVenue} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Venue Name *</label>
                    <input type="text" required value={newVenue.name} onChange={(e) => setNewVenue({...newVenue, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border" placeholder="Grand Palace" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select value={newVenue.venueType} onChange={(e) => setNewVenue({...newVenue, venueType: e.target.value})} className="w-full px-4 py-3 rounded-xl border">
                      <option>Banquet Hall</option><option>Resort</option><option>Hotel</option><option>Farmhouse</option><option>Garden/Lawn</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description *</label>
                  <textarea required rows={2} value={newVenue.description} onChange={(e) => setNewVenue({...newVenue, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border" placeholder="Describe your venue..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">City *</label>
                    <input type="text" required value={newVenue.city} onChange={(e) => setNewVenue({...newVenue, city: e.target.value})} className="w-full px-4 py-3 rounded-xl border" placeholder="Mumbai" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Area *</label>
                    <input type="text" required value={newVenue.area} onChange={(e) => setNewVenue({...newVenue, area: e.target.value})} className="w-full px-4 py-3 rounded-xl border" placeholder="Andheri" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Address *</label>
                    <input type="text" required value={newVenue.address} onChange={(e) => setNewVenue({...newVenue, address: e.target.value})} className="w-full px-4 py-3 rounded-xl border" placeholder="Full address" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Pincode *</label>
                    <input type="text" required value={newVenue.pincode} onChange={(e) => setNewVenue({...newVenue, pincode: e.target.value})} className="w-full px-4 py-3 rounded-xl border" placeholder="400001" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Price Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2"><input type="radio" checked={newVenue.priceMode === "EXACT"} onChange={() => setNewVenue({...newVenue, priceMode: "EXACT"})} /><span>Fixed Price</span></label>
                    <label className="flex items-center gap-2"><input type="radio" checked={newVenue.priceMode === "ESTIMATED"} onChange={() => setNewVenue({...newVenue, priceMode: "ESTIMATED"})} /><span>Price Range</span></label>
                  </div>
                </div>

                {newVenue.priceMode === "EXACT" ? (
                  <div>
                    <label className="block text-sm font-medium mb-1">Price (₹) *</label>
                    <input type="number" required value={newVenue.exactPrice} onChange={(e) => setNewVenue({...newVenue, exactPrice: e.target.value})} className="w-full px-4 py-3 rounded-xl border" placeholder="150000" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Min Price *</label>
                      <input type="number" required value={newVenue.estimatedMinPrice} onChange={(e) => setNewVenue({...newVenue, estimatedMinPrice: e.target.value})} className="w-full px-4 py-3 rounded-xl border" placeholder="100000" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Max Price *</label>
                      <input type="number" required value={newVenue.estimatedMaxPrice} onChange={(e) => setNewVenue({...newVenue, estimatedMaxPrice: e.target.value})} className="w-full px-4 py-3 rounded-xl border" placeholder="300000" />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Min Guests</label>
                    <input type="number" value={newVenue.minGuests} onChange={(e) => setNewVenue({...newVenue, minGuests: e.target.value})} className="w-full px-4 py-3 rounded-xl border" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Guests</label>
                    <input type="number" value={newVenue.maxGuests} onChange={(e) => setNewVenue({...newVenue, maxGuests: e.target.value})} className="w-full px-4 py-3 rounded-xl border" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Amenities</label>
                  <input type="text" value={newVenue.amenities} onChange={(e) => setNewVenue({...newVenue, amenities: e.target.value})} className="w-full px-4 py-3 rounded-xl border" placeholder="Parking,AC,Catering" />
                  <p className="text-xs text-gray-500 mt-1">Comma separated</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Image URLs</label>
                  <input type="text" value={newVenue.images} onChange={(e) => setNewVenue({...newVenue, images: e.target.value})} className="w-full px-4 py-3 rounded-xl border" placeholder="https://example.com/image.jpg" />
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowAddVenue(false)} className="flex-1 px-6 py-3 rounded-xl border font-semibold">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold disabled:opacity-50">
                    {saving ? "Saving..." : "Add Venue"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
