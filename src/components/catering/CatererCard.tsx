"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, Leaf, Heart, Phone, Medal, Award, Crown, CheckCircle2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { useSession } from "next-auth/react";

interface CatererCardProps {
  id: string;
  catererId?: string;
  name: string;
  city: string;
  area?: string;
  minPlatePrice: number;
  silverPrice?: number;
  goldPrice?: number;
  platinumPrice?: number;
  rating?: number;
  totalReviews?: number;
  isPureVeg?: boolean;
  coverImage: string;
  isVerified?: boolean;
  bookingEnabled?: boolean;
  isAdminListed?: boolean;
  contactNumber?: string;
  contactName?: string;
  viewCount?: number;
  inWishlist?: boolean;
  slug?: string;
}

export function CatererCard({
  id,
  catererId,
  name,
  city,
  area,
  minPlatePrice,
  silverPrice,
  goldPrice,
  platinumPrice,
  rating = 0,
  totalReviews = 0,
  isPureVeg = false,
  coverImage,
  isVerified = false,
  bookingEnabled = false,
  isAdminListed = true,
  contactNumber,
  contactName,
  viewCount,
  inWishlist = false,
  slug,
}: CatererCardProps) {
  const { data: session } = useSession();
  const [isInWishlist, setIsInWishlist] = useState(inWishlist);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Determine if this is a fishbowl listing
  const isFishbowl = isAdminListed && !bookingEnabled;

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!session) {
      alert("Please sign in to add to wishlist");
      return;
    }

    const targetId = catererId || id;
    if (!targetId) return;

    try {
      setWishlistLoading(true);
      if (isInWishlist) {
        await api.removeFromWishlist(undefined, targetId);
        setIsInWishlist(false);
      } else {
        await api.addToWishlist({ catererId: targetId });
        setIsInWishlist(true);
      }
    } catch (err) {
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
    return `₹${price}`;
  };

  const catererUrl = slug ? `/catering/${slug}` : `/catering/${id}`;

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden border border-gray-100">
      <Link href={catererUrl}>
        {/* Image Section */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={coverImage || "/placeholder-food.jpg"}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 hover:scale-105"
          />
          
          {/* Top Left - Wishlist */}
          <button
            onClick={handleWishlistToggle}
            disabled={wishlistLoading}
            className="absolute left-3 top-3 rounded-full bg-white/95 p-2 shadow-lg hover:bg-white transition-all disabled:opacity-50 z-10"
          >
            <Heart
              className={cn(
                "h-5 w-5 transition-colors",
                isInWishlist ? "fill-rose-500 text-rose-500" : "text-gray-600"
              )}
            />
          </button>
          
          {/* Top Right - Badges */}
          <div className="absolute right-3 top-3 flex flex-col gap-2 z-10">
            {isPureVeg && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-green-500 text-white text-xs font-semibold rounded-full shadow-lg">
                <Leaf className="h-3.5 w-3.5" />
                Pure Veg
              </div>
            )}
            {isVerified && bookingEnabled && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full shadow-lg">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Verified
              </div>
            )}
          </div>

          {/* Bottom - Tier Pricing */}
          {(silverPrice || goldPrice || platinumPrice) && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
              <div className="flex items-center justify-center gap-2">
                {silverPrice && (
                  <div className="bg-gray-100 px-2.5 py-1 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Medal className="h-3 w-3 text-gray-500" />
                      <span className="text-[10px] text-gray-500 font-medium">SILVER</span>
                    </div>
                    <p className="text-sm font-bold text-gray-800">{formatPrice(silverPrice)}</p>
                  </div>
                )}
                {goldPrice && (
                  <div className="bg-yellow-100 px-2.5 py-1 rounded-lg text-center border border-yellow-300">
                    <div className="flex items-center justify-center gap-1">
                      <Award className="h-3 w-3 text-yellow-600" />
                      <span className="text-[10px] text-yellow-700 font-medium">GOLD</span>
                    </div>
                    <p className="text-sm font-bold text-yellow-800">{formatPrice(goldPrice)}</p>
                  </div>
                )}
                {platinumPrice && (
                  <div className="bg-purple-100 px-2.5 py-1 rounded-lg text-center border border-purple-300">
                    <div className="flex items-center justify-center gap-1">
                      <Crown className="h-3 w-3 text-purple-600" />
                      <span className="text-[10px] text-purple-700 font-medium">PLATINUM</span>
                    </div>
                    <p className="text-sm font-bold text-purple-800">{formatPrice(platinumPrice)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-1.5 line-clamp-1">{name}</h3>

          <div className="flex items-center gap-1.5 text-gray-600 mb-2">
            <MapPin className="h-4 w-4 text-orange-500 flex-shrink-0" />
            <span className="text-sm font-medium truncate">
              {area ? `${area}, ${city}` : city}
            </span>
          </div>

          <div className="flex items-center justify-between mb-3">
            {rating > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-green-600 px-2 py-0.5 rounded-md">
                  <Star className="h-3.5 w-3.5 fill-white text-white" />
                  <span className="text-sm font-bold text-white">{rating.toFixed(1)}</span>
                </div>
                {totalReviews > 0 && (
                  <span className="text-xs text-gray-500">({totalReviews} reviews)</span>
                )}
              </div>
            )}
            {viewCount !== undefined && viewCount > 0 && (
              <div className="flex items-center gap-1 text-gray-400 text-xs">
                <Eye className="h-3.5 w-3.5" />
                <span>{viewCount > 100 ? `${Math.floor(viewCount/100)*100}+` : viewCount}</span>
              </div>
            )}
          </div>

          {/* Starting Price (if no tier prices) */}
          {!silverPrice && !goldPrice && !platinumPrice && (
            <div className="mb-3 p-2 bg-orange-50 rounded-lg">
              <p className="text-xs text-gray-500">Starting from</p>
              <p className="text-xl font-bold text-orange-600">
                {formatPrice(minPlatePrice)}<span className="text-sm font-normal text-gray-500">/plate</span>
              </p>
            </div>
          )}

          {/* CTA Button */}
          {isFishbowl ? (
            <button
              onClick={handleCall}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              <Phone className="h-4 w-4" />
              Call {contactName || "to Book"}
            </button>
          ) : bookingEnabled ? (
            <button className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
              View Menu & Book
            </button>
          ) : (
            <button className="w-full flex items-center justify-center gap-2 py-3 border-2 border-orange-500 text-orange-600 rounded-xl font-semibold hover:bg-orange-50 transition-all">
              View Packages
            </button>
          )}
        </div>
      </Link>
    </div>
  );
}

