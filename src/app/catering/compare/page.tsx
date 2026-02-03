"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  X, 
  Check, 
  Users, 
  MapPin, 
  IndianRupee,
  Star,
  Phone,
  ChevronLeft,
  Plus,
  Minus,
  UtensilsCrossed,
  Leaf
} from "lucide-react";

type Caterer = {
  id: string;
  name: string;
  slug: string;
  area: string;
  city: string;
  coverImage?: string;
  pricePerPlate?: number;
  minPlateCount?: number;
  maxPlateCount?: number;
  cuisines: string[];
  isPureVeg: boolean;
  rating?: number;
  reviewCount?: number;
  isVerified: boolean;
  contactPhone?: string;
  silverPrice?: number;
  goldPrice?: number;
  platinumPrice?: number;
  silverItems?: string[];
  goldItems?: string[];
  platinumItems?: string[];
};

const COMMON_CUISINES = [
  "Bengali",
  "North Indian",
  "South Indian",
  "Mughlai",
  "Chinese",
  "Continental",
  "Italian",
  "Thai",
  "Chaat",
  "Desserts"
];

export default function CompareCaterersPage() {
  const searchParams = useSearchParams();
  const [caterers, setCaterers] = useState<Caterer[]>([]);
  const [loading, setLoading] = useState(true);
  const [guestCount, setGuestCount] = useState(100);
  const [selectedPackage, setSelectedPackage] = useState<"silver" | "gold" | "platinum">("gold");
  
  useEffect(() => {
    const catererIds = searchParams.get("ids")?.split(",") || [];
    if (catererIds.length > 0) {
      fetchCaterers(catererIds);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const fetchCaterers = async (ids: string[]) => {
    try {
      setLoading(true);
      const responses = await Promise.all(
        ids.map(id => fetch(`/api/catering/${id}`).then(r => r.json()))
      );
      setCaterers(responses.filter(c => c && !c.error));
    } catch (error) {
      console.error("Failed to fetch caterers:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeCaterer = (id: string) => {
    setCaterers(prev => prev.filter(c => c.id !== id));
  };

  const getPackagePrice = (caterer: Caterer): number => {
    switch (selectedPackage) {
      case "silver": return caterer.silverPrice || caterer.pricePerPlate || 0;
      case "gold": return caterer.goldPrice || caterer.pricePerPlate || 0;
      case "platinum": return caterer.platinumPrice || caterer.pricePerPlate || 0;
      default: return caterer.pricePerPlate || 0;
    }
  };

  const getTotalCost = (caterer: Caterer): number => {
    return getPackagePrice(caterer) * guestCount;
  };

  const hasCuisine = (caterer: Caterer, cuisine: string): boolean => {
    return caterer.cuisines?.some(c => 
      c.toLowerCase().includes(cuisine.toLowerCase())
    ) || false;
  };

  // Find best value (lowest price per plate)
  const prices = caterers.map(c => getPackagePrice(c)).filter(p => p > 0);
  const lowestPrice = Math.min(...prices);
  const highestRating = Math.max(...caterers.map(c => c.rating || 0));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (caterers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <UtensilsCrossed className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Caterers to Compare</h1>
          <p className="text-gray-600 mb-6">Add caterers to compare from the listing page</p>
          <Link 
            href="/catering" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90"
          >
            <ChevronLeft className="h-5 w-5" />
            Browse Caterers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <Link 
              href="/catering"
              className="text-purple-600 hover:underline flex items-center gap-1 text-sm mb-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Caterers
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Compare Caterers</h1>
            <p className="text-gray-600">Comparing {caterers.length} caterers side by side</p>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
            {/* Package Selector */}
            <div className="flex bg-white rounded-xl shadow-sm overflow-hidden">
              {(["silver", "gold", "platinum"] as const).map((pkg) => (
                <button
                  key={pkg}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`px-4 py-2 text-sm font-semibold transition-colors ${
                    selectedPackage === pkg
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {pkg.charAt(0).toUpperCase() + pkg.slice(1)}
                </button>
              ))}
            </div>

            {/* Guest Count Selector */}
            <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm">
              <Users className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-600">Guests:</span>
              <button
                onClick={() => setGuestCount(Math.max(50, guestCount - 50))}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-semibold w-16 text-center">{guestCount}</span>
              <button
                onClick={() => setGuestCount(Math.min(2000, guestCount + 50))}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Header Row with Caterer Cards */}
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left w-48 bg-gray-50 font-semibold text-gray-700">
                    Feature
                  </th>
                  {caterers.map((caterer) => (
                    <th key={caterer.id} className="p-4 min-w-[280px]">
                      <div className="relative">
                        <button
                          onClick={() => removeCaterer(caterer.id)}
                          className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        
                        {/* Caterer Card */}
                        <div className="text-left">
                          {caterer.coverImage && (
                            <img 
                              src={caterer.coverImage} 
                              alt={caterer.name}
                              className="w-full h-32 object-cover rounded-xl mb-3"
                            />
                          )}
                          <Link 
                            href={`/catering/${caterer.slug || caterer.id}`}
                            className="font-bold text-gray-900 hover:text-purple-600 text-lg block"
                          >
                            {caterer.name}
                          </Link>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {caterer.area}, {caterer.city}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {caterer.isPureVeg && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                <Leaf className="h-3 w-3" />
                                Pure Veg
                              </span>
                            )}
                            {caterer.isVerified && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              
              <tbody>
                {/* Price Per Plate */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-700 bg-gray-50">
                    <IndianRupee className="h-4 w-4 inline mr-2" />
                    {selectedPackage.charAt(0).toUpperCase() + selectedPackage.slice(1)} Price/Plate
                  </td>
                  {caterers.map((caterer) => {
                    const price = getPackagePrice(caterer);
                    return (
                      <td key={caterer.id} className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-purple-600">
                            ₹{price.toLocaleString('en-IN')}
                          </span>
                          {price === lowestPrice && lowestPrice > 0 && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                              Best Price
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Total Cost */}
                <tr className="border-b hover:bg-gray-50 bg-purple-50">
                  <td className="p-4 font-medium text-gray-700 bg-gray-50">
                    <IndianRupee className="h-4 w-4 inline mr-2" />
                    Total Cost ({guestCount} guests)
                  </td>
                  {caterers.map((caterer) => (
                    <td key={caterer.id} className="p-4">
                      <span className="text-xl font-bold text-purple-600">
                        ₹{getTotalCost(caterer).toLocaleString('en-IN')}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Guest Capacity */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-700 bg-gray-50">
                    <Users className="h-4 w-4 inline mr-2" />
                    Capacity
                  </td>
                  {caterers.map((caterer) => (
                    <td key={caterer.id} className="p-4 text-gray-700">
                      {caterer.minPlateCount || 50} - {caterer.maxPlateCount || 1000} plates
                      {guestCount > (caterer.maxPlateCount || 1000) && (
                        <span className="ml-2 text-red-500 text-sm">(Exceeds capacity)</span>
                      )}
                      {guestCount < (caterer.minPlateCount || 50) && (
                        <span className="ml-2 text-orange-500 text-sm">(Below minimum)</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Rating */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-700 bg-gray-50">
                    <Star className="h-4 w-4 inline mr-2" />
                    Rating
                  </td>
                  {caterers.map((caterer) => (
                    <td key={caterer.id} className="p-4">
                      {caterer.rating ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">{caterer.rating.toFixed(1)}</span>
                          </div>
                          <span className="text-gray-500 text-sm">
                            ({caterer.reviewCount || 0} reviews)
                          </span>
                          {caterer.rating === highestRating && highestRating > 0 && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                              Top Rated
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">No ratings</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Veg/Non-Veg */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-700 bg-gray-50">
                    <Leaf className="h-4 w-4 inline mr-2" />
                    Food Type
                  </td>
                  {caterers.map((caterer) => (
                    <td key={caterer.id} className="p-4">
                      {caterer.isPureVeg ? (
                        <span className="text-green-600 font-semibold flex items-center gap-1">
                          <Leaf className="h-4 w-4" />
                          Pure Vegetarian
                        </span>
                      ) : (
                        <span className="text-gray-700">Veg & Non-Veg</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Contact */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-700 bg-gray-50">
                    <Phone className="h-4 w-4 inline mr-2" />
                    Contact
                  </td>
                  {caterers.map((caterer) => (
                    <td key={caterer.id} className="p-4">
                      {caterer.contactPhone ? (
                        <a 
                          href={`tel:${caterer.contactPhone}`}
                          className="text-purple-600 hover:underline"
                        >
                          {caterer.contactPhone}
                        </a>
                      ) : (
                        <Link 
                          href={`/catering/${caterer.slug || caterer.id}`}
                          className="text-purple-600 hover:underline"
                        >
                          View Details
                        </Link>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Cuisines Section Header */}
                <tr className="bg-gray-100">
                  <td colSpan={caterers.length + 1} className="p-4 font-semibold text-gray-700">
                    Cuisines Available
                  </td>
                </tr>

                {/* Cuisine Rows */}
                {COMMON_CUISINES.map((cuisine) => (
                  <tr key={cuisine} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-700 bg-gray-50">
                      {cuisine}
                    </td>
                    {caterers.map((caterer) => (
                      <td key={caterer.id} className="p-4 text-center">
                        {hasCuisine(caterer, cuisine) ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4 justify-center flex-wrap">
          {caterers.map((caterer) => (
            <Link
              key={caterer.id}
              href={`/catering/${caterer.slug || caterer.id}`}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Book {caterer.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
