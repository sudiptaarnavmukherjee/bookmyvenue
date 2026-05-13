"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, MapPin, CheckCircle2, Heart, Phone, Calendar, Eye, GitCompare } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { useSession } from "next-auth/react";
import { useCompare } from "@/components/providers/CompareProvider";

interface VenueCardProps {
  id: string;
  venueId?: string;
  name: string;
  city: string;
  area?: string;
  priceMode?: "exact" | "estimated" | "EXACT" | "ESTIMATED";
  exactPrice?: number;
  estimatedMinPrice?: number;
  estimatedMaxPrice?: number;
  primeDayPrice?: number;
  nonPrimeDayPrice?: number;
  marriagePrice?: number;
  birthdayPrice?: number;
  otherEventPrice?: number;
  minGuests?: number;
  maxGuests?: number;
  coverImage: string;
  isVerified?: boolean;
  bookingEnabled?: boolean;
  isAdminListed?: boolean;
  contactNumber?: string;
  contactName?: string;
  viewCount?: number;
  inWishlist?: boolean;
  slug?: string;
  distanceText?: string;
}

export function VenueCard({
  id,
  venueId,
  name,
  city,
  area,
  priceMode = "ESTIMATED",
  exactPrice,
  estimatedMinPrice,
  estimatedMaxPrice,
  primeDayPrice,
  nonPrimeDayPrice,
  marriagePrice,
  birthdayPrice,
  otherEventPrice,
  minGuests = 50,
  maxGuests = 500,
  coverImage,
  isVerified = false,
  bookingEnabled = false,
  isAdminListed = true,
  contactNumber,
  contactName,
  viewCount,
  inWishlist = false,
  slug,
  distanceText,
}: VenueCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { isVenueSelected, addVenue, removeVenue } = useCompare();
  const [isInWishlist, setIsInWishlist] = useState(inWishlist);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Determine if this is a fishbowl listing (admin added, no online booking)
  const isFishbowl = isAdminListed && !bookingEnabled;
  const isSelected = isVenueSelected(venueId || id);

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const targetId = venueId || id;
    if (isSelected) {
      removeVenue(targetId);
    } else {
      addVenue(targetId, name);
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    const targetId = venueId || id;
    if (!targetId || wishlistLoading) return;

    const prev = isInWishlist;
    setIsInWishlist(!prev); // optimistic update
    setWishlistLoading(true);

    try {
      const { error } = prev
        ? await api.removeFromWishlist(targetId)
        : await api.addToWishlist({ venueId: targetId });

      if (error) {
        setIsInWishlist(prev); // revert on error
        console.error("Wishlist error:", error);
      }
    } catch (err) {
      setIsInWishlist(prev); // revert on exception
      console.error("Wishlist error:", err);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleCall = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (contactNumber) {
      window.location.href = `tel:${contactNumber}`;
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)}L`;
    }
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const normalizedPriceMode = priceMode?.toUpperCase();
  const venueUrl = slug ? `/venues/${slug}` : `/venues/${id}`;

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden border border-gray-100">
      <Link href={venueUrl}>
        {/* Image Section */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={coverImage || "/placeholder-venue.jpg"}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 hover:scale-105"
          />
          
          {/* Top Left - Wishlist & Compare */}
          <div className="absolute left-3 top-3 flex flex-col gap-2 z-10">
            <button
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
              className="rounded-full bg-white/95 p-2 shadow-lg hover:bg-white transition-all disabled:opacity-50"
            >
              <Heart
                className={cn(
                  "h-5 w-5 transition-colors",
                  isInWishlist ? "fill-rose-500 text-rose-500" : "text-gray-600"
                )}
              />
            </button>
            <button
              onClick={handleCompareToggle}
              className={cn(
                "rounded-full p-2 shadow-lg transition-all",
                isSelected 
                  ? "bg-purple-600 text-white" 
                  : "bg-white/95 text-gray-600 hover:bg-white"
              )}
              title={isSelected ? "Remove from compare" : "Add to compare"}
            >
              <GitCompare className="h-5 w-5" />
            </button>
          </div>
          
          {/* Top Right - Badges */}
          <div className="absolute right-3 top-3 flex flex-col gap-2 z-10">
            {isVerified && bookingEnabled ? (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-green-500 text-white text-xs font-semibold rounded-full shadow-lg">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Verified
              </div>
            ) : isFishbowl ? (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full shadow-lg">
                <Phone className="h-3.5 w-3.5" />
                Call to Book
              </div>
            ) : null}
          </div>

          {/* Bottom - Price Badges */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
            {marriagePrice || birthdayPrice || otherEventPrice ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                {marriagePrice && (
                  <div className="bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-center">
                    <p className="text-[9px] text-rose-500 font-bold uppercase">💍 Marriage</p>
                    <p className="text-sm font-bold text-gray-900">{formatPrice(marriagePrice)}</p>
                  </div>
                )}
                {birthdayPrice && (
                  <div className="bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-center">
                    <p className="text-[9px] text-yellow-600 font-bold uppercase">🎂 Birthday</p>
                    <p className="text-sm font-bold text-gray-900">{formatPrice(birthdayPrice)}</p>
                  </div>
                )}
                {otherEventPrice && (
                  <div className="bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-center">
                    <p className="text-[9px] text-purple-600 font-bold uppercase">🙏 Others</p>
                    <p className="text-sm font-bold text-gray-900">{formatPrice(otherEventPrice)}</p>
                  </div>
                )}
              </div>
            ) : primeDayPrice && nonPrimeDayPrice ? (
              <div className="flex items-center gap-3">
                <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                  <p className="text-[10px] text-gray-500 font-medium">PRIME</p>
                  <p className="text-sm font-bold text-rose-600">{formatPrice(primeDayPrice)}</p>
                </div>
                <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                  <p className="text-[10px] text-gray-500 font-medium">REGULAR</p>
                  <p className="text-sm font-bold text-gray-800">{formatPrice(nonPrimeDayPrice)}</p>
                </div>
              </div>
            ) : normalizedPriceMode === "EXACT" && exactPrice ? (
              <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg inline-block">
                <p className="text-lg font-bold text-gray-900">{formatPrice(exactPrice)}</p>
              </div>
            ) : (
              <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg inline-block">
                <p className="text-[10px] text-gray-500 font-medium">APPROX.</p>
                <p className="text-sm font-bold text-gray-800">
                  {formatPrice(estimatedMinPrice || 0)} - {formatPrice(estimatedMaxPrice || 0)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-1.5 line-clamp-1">{name}</h3>

          <div className="flex items-center justify-between gap-2 text-gray-600 mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="h-4 w-4 text-rose-500 flex-shrink-0" />
              <span className="text-sm font-medium truncate">
                {area ? `${area}, ${city}` : city}
              </span>
            </div>
            {distanceText && (
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                {distanceText}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5 text-gray-600">
              <Users className="h-4 w-4 text-purple-500" />
              <span className="text-sm">{minGuests}-{maxGuests} guests</span>
            </div>
            {viewCount !== undefined && viewCount > 0 && (
              <div className="flex items-center gap-1 text-gray-400 text-xs">
                <Eye className="h-3.5 w-3.5" />
                <span>{viewCount > 100 ? `${Math.floor(viewCount/100)*100}+` : viewCount} views</span>
              </div>
            )}
          </div>

          {/* CTA Button */}
          {isFishbowl ? (
            <button
              onClick={handleCall}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              <Phone className="h-4 w-4" />
              Call {contactName || "to Book"}
            </button>
          ) : bookingEnabled ? (
            <button className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
              <Calendar className="h-4 w-4" />
              Book Online
            </button>
          ) : (
            <button className="w-full flex items-center justify-center gap-2 py-3 border-2 border-rose-500 text-rose-600 rounded-xl font-semibold hover:bg-rose-50 transition-all">
              View Details
            </button>
          )}
        </div>
      </Link>
    </div>
  );
}

