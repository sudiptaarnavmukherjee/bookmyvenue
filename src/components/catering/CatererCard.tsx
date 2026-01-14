"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, MapPin, Leaf, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { useSession } from "next-auth/react";

interface CatererCardProps {
  id: string;
  catererId?: string;
  name: string;
  city: string;
  minPlatePrice: number;
  rating: number;
  totalReviews: number;
  isPureVeg: boolean;
  coverImage: string;
  inWishlist?: boolean;
}

export function CatererCard({
  id,
  catererId,
  name,
  city,
  minPlatePrice,
  rating,
  totalReviews,
  isPureVeg,
  coverImage,
  inWishlist = false,
}: CatererCardProps) {
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

    if (!catererId) return;

    try {
      setWishlistLoading(true);
      if (isInWishlist) {
        await api.removeFromWishlist(undefined, catererId);
        setIsInWishlist(false);
      } else {
        await api.addToWishlist({ catererId });
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
      <Link href={`/catering/${id}`}>
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
          {isPureVeg && (
            <div className="badge-verified absolute right-4 top-4 bg-gradient-to-r from-emerald-500 to-teal-500">
              <Leaf className="h-3.5 w-3.5" />
              Pure Veg
            </div>
          )}
        </div>

        <div className="p-6">
          <h3 className="mb-3 text-xl font-bold text-gray-900">{name}</h3>

          <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-purple-600" />
            <span className="font-medium">{city}</span>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-amber-400 to-orange-400 px-3 py-1.5 shadow-md">
              <Star className="h-4 w-4 fill-white text-white" />
              <span className="text-sm font-bold text-white">{rating}</span>
            </div>
            <span className="text-sm text-gray-600 font-medium">
              ({totalReviews.toLocaleString()} reviews)
            </span>
          </div>

          <div className="divider-elegant mb-4" />

          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Starting from</p>
            <p className="text-3xl font-bold text-gradient bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {formatPrice(minPlatePrice)}
              <span className="text-base font-normal text-gray-600">/plate</span>
            </p>
          </div>

          <button className="btn-wedding-primary w-full">
            View Packages
          </button>
        </div>
      </Link>
    </motion.div>
  );
}
