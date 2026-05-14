"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  Building,
  Loader2
} from "lucide-react";

type Venue = {
  id: string;
  name: string;
  slug: string;
  area: string;
  city: string;
  coverImage?: string;
  priceMode: string;
  exactPrice?: number;
  estimatedMinPrice?: number;
  estimatedMaxPrice?: number;
  minGuests?: number;
  maxGuests: number;
  venueType: string;
  amenities: string[];
  rating?: number;
  reviewCount?: number;
  isVerified: boolean;
  contactPhone?: string;
};

const COMMON_AMENITIES = [
  "Parking",
  "AC",
  "WiFi",
  "Catering",
  "DJ",
  "Decorations",
  "Projector",
  "Stage",
  "Valet",
  "Lawn",
  "Pool",
  "Bridal Room"
];

function CompareVenuesContent() {
  const searchParams = useSearchParams();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [guestCount, setGuestCount] = useState(100);
  
  useEffect(() => {
    const venueIds = searchParams.get("ids")?.split(",") || [];
    if (venueIds.length > 0) {
      fetchVenues(venueIds);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const fetchVenues = async (ids: string[]) => {
    try {
      setLoading(true);
      const responses = await Promise.all(
        ids.map(id => fetch(`/api/venues/${id}`).then(r => r.json()))
      );
      setVenues(responses.filter(v => v && !v.error));
    } catch (error) {
      console.error("Failed to fetch venues:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeVenue = (id: string) => {
    setVenues(prev => prev.filter(v => v.id !== id));
  };

  const getPrice = (venue: Venue): number => {
    if (venue.priceMode === "EXACT" && venue.exactPrice) {
      return venue.exactPrice;
    }
    return venue.estimatedMinPrice || 0;
  };

  const formatPrice = (venue: Venue): string => {
    if (venue.priceMode === "EXACT" && venue.exactPrice) {
      return `₹${venue.exactPrice.toLocaleString('en-IN')}`;
    }
    if (venue.estimatedMinPrice && venue.estimatedMaxPrice) {
      return `₹${venue.estimatedMinPrice.toLocaleString('en-IN')} - ₹${venue.estimatedMaxPrice.toLocaleString('en-IN')}`;
    }
    return "Price on request";
  };

  const getPerGuestPrice = (venue: Venue): string => {
    const price = getPrice(venue);
    if (!price || !guestCount) return "N/A";
    return `₹${Math.round(price / guestCount).toLocaleString('en-IN')}`;
  };

  const hasAmenity = (venue: Venue, amenity: string): boolean => {
    return venue.amenities?.some(a => 
      a.toLowerCase().includes(amenity.toLowerCase())
    ) || false;
  };

  // Find best value (lowest price)
  const prices = venues.map(v => getPrice(v)).filter(p => p > 0);
  const lowestPrice = Math.min(...prices);
  const highestRating = Math.max(...venues.map(v => v.rating || 0));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-4 border-[#0b5fab] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Venues to Compare</h1>
          <p className="text-gray-600 mb-6">Add venues to compare from the listing page</p>
          <Link 
            href="/venues" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0b5fab] to-[#1f86d9] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90"
          >
            <ChevronLeft className="h-5 w-5" />
            Browse Venues
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link 
              href="/venues"
              className="text-[#0b5fab] hover:underline flex items-center gap-1 text-sm mb-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Venues
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Compare Venues</h1>
            <p className="text-gray-600">Comparing {venues.length} venues side by side</p>
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

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Header Row with Venue Cards */}
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left w-48 bg-gray-50 font-semibold text-gray-700">
                    Feature
                  </th>
                  {venues.map((venue) => (
                    <th key={venue.id} className="p-4 min-w-[280px]">
                      <div className="relative">
                        <button
                          onClick={() => removeVenue(venue.id)}
                          className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        
                        {/* Venue Card */}
                        <div className="text-left">
                          {venue.coverImage && (
                            <div className="relative mb-3 h-32 w-full overflow-hidden rounded-xl">
                              <Image
                                src={venue.coverImage}
                                alt={venue.name}
                                fill
                                sizes="280px"
                                className="object-cover"
                              />
                            </div>
                          )}
                          <Link 
                            href={`/venues/${venue.slug || venue.id}`}
                            className="font-bold text-gray-900 hover:text-[#0b5fab] text-lg block"
                          >
                            {venue.name}
                          </Link>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {venue.area}, {venue.city}
                          </p>
                          {venue.isVerified && (
                            <span className="mt-2 inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              
              <tbody>
                {/* Price */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-700 bg-gray-50">
                    <IndianRupee className="h-4 w-4 inline mr-2" />
                    Starting Price
                  </td>
                  {venues.map((venue) => (
                    <td key={venue.id} className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-[#0b5fab]">
                          {formatPrice(venue)}
                        </span>
                        {getPrice(venue) === lowestPrice && lowestPrice > 0 && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            Best Price
                          </span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Per Guest Price */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-700 bg-gray-50">
                    <Users className="h-4 w-4 inline mr-2" />
                    Per Guest Cost
                  </td>
                  {venues.map((venue) => (
                    <td key={venue.id} className="p-4 text-gray-700">
                      {getPerGuestPrice(venue)}/guest
                    </td>
                  ))}
                </tr>

                {/* Guest Capacity */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-700 bg-gray-50">
                    <Users className="h-4 w-4 inline mr-2" />
                    Guest Capacity
                  </td>
                  {venues.map((venue) => (
                    <td key={venue.id} className="p-4 text-gray-700">
                      {venue.minGuests || 50} - {venue.maxGuests} guests
                      {guestCount > venue.maxGuests && (
                        <span className="ml-2 text-red-500 text-sm">(Too small)</span>
                      )}
                      {guestCount >= (venue.minGuests || 50) && guestCount <= venue.maxGuests && (
                        <span className="ml-2 text-green-500 text-sm">✓ Fits</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Venue Type */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-700 bg-gray-50">
                    <Building className="h-4 w-4 inline mr-2" />
                    Venue Type
                  </td>
                  {venues.map((venue) => (
                    <td key={venue.id} className="p-4 text-gray-700">
                      {venue.venueType}
                    </td>
                  ))}
                </tr>

                {/* Rating */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-700 bg-gray-50">
                    <Star className="h-4 w-4 inline mr-2" />
                    Rating
                  </td>
                  {venues.map((venue) => (
                    <td key={venue.id} className="p-4">
                      {venue.rating ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">{venue.rating.toFixed(1)}</span>
                          </div>
                          <span className="text-gray-500 text-sm">
                            ({venue.reviewCount || 0} reviews)
                          </span>
                          {venue.rating === highestRating && highestRating > 0 && (
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

                {/* Contact */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-700 bg-gray-50">
                    <Phone className="h-4 w-4 inline mr-2" />
                    Contact
                  </td>
                  {venues.map((venue) => (
                    <td key={venue.id} className="p-4">
                      {venue.contactPhone ? (
                        <a 
                          href={`tel:${venue.contactPhone}`}
                          className="text-[#0b5fab] hover:underline"
                        >
                          {venue.contactPhone}
                        </a>
                      ) : (
                        <Link 
                          href={`/venues/${venue.slug || venue.id}`}
                          className="text-[#0b5fab] hover:underline"
                        >
                          View Details
                        </Link>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Amenities Section Header */}
                <tr className="bg-gray-100">
                  <td colSpan={venues.length + 1} className="p-4 font-semibold text-gray-700">
                    Amenities Comparison
                  </td>
                </tr>

                {/* Amenity Rows */}
                {COMMON_AMENITIES.map((amenity) => (
                  <tr key={amenity} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-700 bg-gray-50">
                      {amenity}
                    </td>
                    {venues.map((venue) => (
                      <td key={venue.id} className="p-4 text-center">
                        {hasAmenity(venue, amenity) ? (
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
          {venues.map((venue) => (
            <Link
              key={venue.id}
              href={`/venues/${venue.slug || venue.id}`}
              className="px-6 py-3 bg-gradient-to-r from-[#0b5fab] to-[#1f86d9] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Book {venue.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0b5fab] mx-auto mb-4" />
        <p className="text-gray-600">Loading comparison...</p>
      </div>
    </div>
  );
}

export default function CompareVenuesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CompareVenuesContent />
    </Suspense>
  );
}



