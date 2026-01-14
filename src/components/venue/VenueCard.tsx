"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, MapPin, CheckCircle2, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { useSession } from "next-auth/react";

interface VenueCardProps {
  id: string;
  venueId?: string;
  name: string;
  city: string;
  priceMode: "exact" | "estimated";
  exactPrice?: number;
  estimatedMinPrice?: number;
  estimatedMaxPrice?: number;
  minGuests: number;
  maxGuests: number;
  coverImage: string;
  isVerified: boolean;
  inWishlist?: boolean;
}

export function VenueCard({
  id,
  venueId,
  name,
  city,
  priceMode,
  exactPrice,
  estimatedMinPrice,
  estimatedMaxPrice,
  minGuests,
  maxGuests,
  coverImage,
  isVerified,
  inWishlist = false,
}: VenueCardProps) {
  const { data: session } = useSession();
  const [isInWishlist, setIsInWishlist] = useState(inWishlist);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!session) {
      alert("Please sign in to add to wishlist");
      return;
    }

    if (!venueId) return;

    try {
      setWishlistLoading(true);
      if (isInWishlist) {
        await api.removeFromWishlist(venueId);
        setIsInWishlist(false);
      } else {
        await api.addToWishlist({ venueId });
        setIsInWishlist(true);
      }
    } catch (err) {
      console.error("Wishlist error:", err);
    } finally {
      setWishlistLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="card-elite hover-scale overflow-hidden"
    >
      <Link href={`/venues/${id}`}>
        <div className="relative aspect-[4/3] overflow-hidden image-overlay">
          <Image
            src={coverImage}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 hover:scale-110"
          />
          <button
            onClick={handleWishlistToggle}
            disabled={wishlistLoading}
            className="absolute left-4 top-4 rounded-full bg-white/90 p-2.5 shadow-lg hover:bg-white transition-all disabled:opacity-50 z-10"
          >
            <Heart
              className={cn(
                "h-5 w-5 transition-colors",
                isInWishlist ? "fill-red-500 text-red-500" : "text-gray-600"
              )}
            />
          </button>
          {isVerified && (
            <div className="badge-verified absolute right-4 top-4">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Verified
            </div>
          )}
        </div>

        <div className="p-6">
          <h3 className="mb-3 text-xl font-bold text-gray-900">{name}</h3>

          <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-purple-600" />
            <span className="font-medium">{city}</span>
          </div>

          <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4 text-purple-600" />
            <span className="font-medium">
              {minGuests} - {maxGuests} guests
            </span>
          </div>

          <div className="divider-elegant mb-4" />

          <div className="mb-6">
            {priceMode === "exact" ? (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Starting from</p>
                <p className="text-3xl font-bold text-gradient bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {formatPrice(exactPrice!)}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Estimated Range</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatPrice(estimatedMinPrice!)} - {formatPrice(estimatedMaxPrice!)}
                </p>
              </div>
            )}
          </div>

          <button
            className={cn(
              "w-full rounded-xl py-3 font-semibold transition-colors",
              isVerified
                ? "bg-rose-600 text-white hover:bg-rose-700"
                : "border-2 border-rose-600 text-rose-600 hover:bg-rose-50"
            )}
          >
            {isVerified ? "Book Now" : "Get Quote"}
          </button>
        </div>
      </Link>
    </motion.div>
  );
}
