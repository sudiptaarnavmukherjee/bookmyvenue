"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, MapPin, Users, Star, X, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api-client";

type WishlistItem = {
  id: string;
  venueId?: string;
  catererId?: string;
  venue?: {
    id: string;
    slug: string;
    name: string;
    city: string;
    area: string;
    exactPrice?: number;
    estimatedMinPrice?: number;
    estimatedMaxPrice?: number;
    coverImage?: string;
    images: string[];
    maxGuests: number;
    isVerified: boolean;
    _count?: {
      reviews: number;
    };
  };
  caterer?: {
    id: string;
    slug: string;
    name: string;
    city: string;
    area: string;
    pricePerPlate: number;
    coverImage?: string;
    images: string[];
    isPureVeg: boolean;
    minGuests: number;
    _count?: {
      reviews: number;
    };
  };
};

export default function WishlistPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status === "authenticated") {
      fetchWishlist();
    }
  }, [status, router]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await api.getWishlist();
      
      if (err) {
        setError(err);
      } else {
        setWishlist((data as any)?.wishlist || []);
      }
    } catch (err) {
      setError("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (item: WishlistItem) => {
    try {
      setRemoving(item.id);
      const { error: err } = await api.removeFromWishlist(
        item.venueId,
        item.catererId
      );
      
      if (err) {
        alert(`Failed to remove: ${err}`);
      } else {
        setWishlist(wishlist.filter(i => i.id !== item.id));
      }
    } catch (err) {
      alert("Failed to remove from wishlist");
    } finally {
      setRemoving(null);
    }
  };

  const handleBookNow = (item: WishlistItem) => {
    if (item.venue) {
      router.push(`/venues/${item.venue.slug}`);
    } else if (item.caterer) {
      router.push(`/catering/${item.caterer.slug}`);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="glass-card rounded-3xl p-8 flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-gray-600">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="glass-card rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <h2 className="text-2xl font-bold text-gradient">{error}</h2>
          </div>
          <button
            onClick={fetchWishlist}
            className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2 font-semibold text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-24 pt-8">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gradient mb-2">My Wishlist</h1>
          <p className="text-gray-600">Your saved venues and caterers</p>
        </motion.div>

        {wishlist.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card rounded-3xl p-12 text-center"
          >
            <Heart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-600 mb-6">Start adding venues and caterers you love!</p>
            <button
              onClick={() => router.push("/")}
              className="mx-auto rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 font-semibold text-white shadow-lg hover:shadow-xl transition-all"
            >
              Browse Listings
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {wishlist.map((item, index) => {
              const isVenue = !!item.venue;
              const data = item.venue || item.caterer;
              const rawImages = data?.images as string | string[] | null | undefined;
              const images = typeof rawImages === 'string' 
                ? (rawImages ? rawImages.split(',').filter(Boolean) : [])
                : (Array.isArray(rawImages) ? rawImages : []);
              const image = data?.coverImage || (images.length > 0 ? images[0] : "") || "https://images.unsplash.com/photo-1519167758481-83f29da8c456?w=800";
              const name = data?.name || "";
              const location = `${data?.area || ""}, ${data?.city || ""}`.replace(/^, /, "");
              const price = isVenue 
                ? (data as any)?.exactPrice || (data as any)?.estimatedMinPrice || 0
                : (data as any)?.minPlatePrice || (data as any)?.pricePerPlate || 0;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card overflow-hidden rounded-3xl hover-lift relative group"
                >
                  <button
                    onClick={() => removeFromWishlist(item)}
                    disabled={removing === item.id}
                    className="absolute top-3 right-3 z-10 rounded-full bg-white/90 p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 disabled:opacity-50"
                  >
                    {removing === item.id ? (
                      <Loader2 className="h-4 w-4 text-red-600 animate-spin" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                  </button>

                  <div className="relative h-48">
                    <img
                      src={image}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold text-white">
                        {isVenue ? "VENUE" : "CATERING"}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{name}</h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 text-purple-600" />
                        <span>{location}</span>
                      </div>
                      {data?._count && data._count.reviews > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">({data._count.reviews} reviews)</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-end justify-between border-t border-gray-200 pt-4">
                      <div>
                        <span className="text-xs text-gray-600">Starting from</span>
                        <p className="text-xl font-bold text-gradient">
                          ₹{price.toLocaleString('en-IN')}
                          {!isVenue && "/plate"}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleBookNow(item)}
                        className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
