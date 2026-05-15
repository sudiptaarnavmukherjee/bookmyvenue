"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  MapPin,
  Leaf,
  Heart,
  Phone,
  Medal,
  Award,
  Crown,
  CheckCircle2,
  GitCompare,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { useCompare } from "@/components/providers/CompareProvider";
import { getPartnerStatus, getPartnerStatusLabel } from "@/lib/partner-status";
import {
  assessCatererTrust,
  getLastUpdatedLabel,
  getQualityLabel,
  getPriceConfidenceExplanation,
} from "@/lib/listing-trust";
import { optimizeImageUrl } from "@/lib/image";

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
  description?: string;
  imagesCount?: number;
  hasCoordinates?: boolean;
  hasCuisineData?: boolean;
  minGuests?: number;
  hasMenuPackages?: boolean;
  isVerified?: boolean;
  bookingEnabled?: boolean;
  isAdminListed?: boolean;
  taggedToOwnerId?: string;
  updatedAt?: string;
  contactNumber?: string;
  contactName?: string;
  viewCount?: number;
  inWishlist?: boolean;
  slug?: string;
  distanceText?: string;
  bookingCount?: number;
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
  description,
  imagesCount,
  hasCoordinates,
  hasCuisineData,
  minGuests,
  hasMenuPackages,
  isVerified = false,
  bookingEnabled = false,
  isAdminListed = true,
  taggedToOwnerId,
  updatedAt,
  contactNumber,
  contactName,
  viewCount,
  inWishlist = false,
  slug,
  distanceText,
  bookingCount,
}: CatererCardProps) {
  const router = useRouter();
  const { isCatererSelected, addCaterer, removeCaterer } = useCompare();
  const [isInWishlist, setIsInWishlist] = useState(inWishlist);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const isFishbowl = isAdminListed && !bookingEnabled;
  const isSelected = isCatererSelected(catererId || id);
  const partnerStatus = getPartnerStatus({ isVerified, bookingEnabled, isAdminListed, taggedToOwnerId });

  const partnerStatusClass = {
    LISTED: "bg-slate-100 text-slate-700",
    CLAIMED: "bg-blue-100 text-blue-700",
    VERIFIED: "bg-emerald-100 text-emerald-700",
    PREFERRED_PARTNER: "bg-amber-100 text-amber-800",
  }[partnerStatus];

  const trust = assessCatererTrust({
    hasCoverImage: Boolean(coverImage),
    imagesCount: imagesCount ?? (coverImage ? 1 : 0),
    hasDescription: Boolean(description && description.trim().length >= 40),
    hasCity: Boolean(city),
    hasArea: Boolean(area),
    hasCoordinates: Boolean(hasCoordinates),
    hasMinPlatePrice: Boolean(minPlatePrice),
    hasTierCount: [silverPrice, goldPrice, platinumPrice].filter(Boolean).length,
    hasCuisineData: Boolean(hasCuisineData),
    hasMinGuests: Boolean(minGuests),
    hasMenuPackages: Boolean(hasMenuPackages),
    hasContactDetails: Boolean(contactNumber || contactName),
    reviewCount: totalReviews,
    bookingCount,
    viewCount,
    updatedAt,
    isVerified,
  });

  const priceConfidenceClass = {
    HIGH: "bg-emerald-50 text-emerald-700",
    MEDIUM: "bg-amber-50 text-amber-700",
    LOW: "bg-rose-50 text-rose-700",
  }[trust.priceConfidence];

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const targetId = catererId || id;
    if (isSelected) removeCaterer(targetId);
    else addCaterer(targetId, name);
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const targetId = catererId || id;
    if (!targetId || wishlistLoading) return;

    const prev = isInWishlist;
    setIsInWishlist(!prev);
    setWishlistLoading(true);

    try {
      const { error } = prev
        ? await api.removeFromWishlist(undefined, targetId)
        : await api.addToWishlist({ catererId: targetId });

      if (error) {
        setIsInWishlist(prev);
        if (/sign in|signin|unauthor/i.test(error)) {
          router.push("/auth/signin");
        } else {
          console.error("Wishlist error:", error);
        }
      }
    } catch (err) {
      setIsInWishlist(prev);
      console.error("Wishlist error:", err);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleCall = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (contactNumber) window.location.href = `tel:${contactNumber}`;
  };

  const catererUrl = slug ? `/catering/${slug}` : `/catering/${id}`;
  const optimizedCoverImage =
    optimizeImageUrl(coverImage, { width: 900, height: 560, quality: 72 }) ||
    "/placeholder-food.jpg";
  const ratingColor =
    rating >= 4 ? "bg-emerald-600" : rating >= 3 ? "bg-amber-500" : "bg-rose-500";
  const popularityLabel = rating && rating >= 4.3 ? "Popular" : null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-white transition-all duration-200 group",
        isSelected
          ? "border-[#ff7a00] shadow-md ring-2 ring-[#ff7a00]/25"
          : "border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md"
      )}
    >
      <Link href={catererUrl} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          <Image
            src={optimizedCoverImage}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

          <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
            <button
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md transition-colors hover:bg-white disabled:opacity-50"
            >
              <Heart
                className={cn(
                  "h-[18px] w-[18px] transition-colors",
                  isInWishlist ? "fill-rose-500 text-rose-500" : "text-slate-700"
                )}
              />
            </button>
            <button
              onClick={handleCompareToggle}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-colors",
                isSelected ? "bg-[#ff7a00] text-white" : "bg-white/95 text-slate-700 hover:bg-white"
              )}
              title={isSelected ? "Remove from compare" : "Add to compare"}
            >
              <GitCompare className="h-4 w-4" />
            </button>
          </div>

          <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
            {isPureVeg && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                <Leaf className="h-2.5 w-2.5" /> Pure Veg
              </span>
            )}
            {isVerified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#0b5fab] px-2 py-0.5 text-[10px] font-bold text-white shadow">
                <CheckCircle2 className="h-2.5 w-2.5" /> Verified
              </span>
            )}
            {distanceText && (
              <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                {distanceText}
              </span>
            )}
          </div>

          <div className="absolute bottom-3 left-3">
            {bookingEnabled ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#ff7a00] px-2 py-0.5 text-[10px] font-bold text-white shadow">
                <Zap className="h-2.5 w-2.5" /> Order Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                <Phone className="h-2.5 w-2.5" /> Call to Book
              </span>
            )}
          </div>
        </div>

        <div className="p-3.5">
          <div className="mb-1 flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 flex-1 text-[15px] font-extrabold leading-snug text-slate-900">{name}</h3>
            {rating > 0 && (
              <span className={cn("flex flex-shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-bold text-white", ratingColor)}>
                <Star className="h-[11px] w-[11px] fill-current" />
                {rating.toFixed(1)}
                {totalReviews > 0 && <span className="ml-0.5 text-[9px] opacity-80">({totalReviews})</span>}
              </span>
            )}
          </div>

          <p className="mb-2.5 flex items-center gap-1 truncate text-xs text-slate-500">
            <MapPin className="h-3 w-3 flex-shrink-0 text-[#0b5fab]" />
            {area ? `${area}, ${city}` : city}
          </p>

          <div className="mb-2 flex flex-wrap gap-1.5">
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", partnerStatusClass)}>
              {getPartnerStatusLabel(partnerStatus)}
            </span>
            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">
              Quality {trust.qualityScore}/100
            </span>
            <span
              className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold cursor-help", priceConfidenceClass)}
              title={getPriceConfidenceExplanation(trust.priceConfidence, "caterer")}
            >
              Price {trust.priceConfidence}
            </span>
            {distanceText && (
              <span className="rounded-full bg-[#0b5fab]/5 px-2 py-0.5 text-[10px] font-bold text-[#0b5fab]">
                {distanceText}
              </span>
            )}
            {viewCount !== undefined && viewCount > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                {viewCount > 999 ? `${(viewCount / 1000).toFixed(1)}K views` : `${viewCount} views`}
              </span>
            )}
            {popularityLabel && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                {popularityLabel}
              </span>
            )}
          </div>

          <div className="mb-2.5 border-t border-slate-100 pt-2.5">
            <p className="mb-0.5 text-[10px] leading-none text-slate-400">Starting price</p>
            <p className="text-lg font-extrabold leading-none text-[#0b5fab]">
              Rs {minPlatePrice}
              <span className="ml-0.5 text-xs font-normal text-slate-400">/plate</span>
            </p>
          </div>

          {(silverPrice || goldPrice || platinumPrice) && (
            <div className="flex flex-wrap gap-1.5">
              {silverPrice && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-center">
                  <div className="mb-0.5 flex items-center gap-0.5">
                    <Medal className="h-2.5 w-2.5 text-slate-500" />
                    <p className="text-[9px] font-bold text-slate-500">SILVER</p>
                  </div>
                  <p className="text-xs font-bold text-slate-800">Rs {silverPrice}</p>
                </div>
              )}
              {goldPrice && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-center">
                  <div className="mb-0.5 flex items-center gap-0.5">
                    <Award className="h-2.5 w-2.5 text-amber-600" />
                    <p className="text-[9px] font-bold text-amber-700">GOLD</p>
                  </div>
                  <p className="text-xs font-bold text-amber-800">Rs {goldPrice}</p>
                </div>
              )}
              {platinumPrice && (
                <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-center">
                  <div className="mb-0.5 flex items-center gap-0.5">
                    <Crown className="h-2.5 w-2.5 text-indigo-600" />
                    <p className="text-[9px] font-bold text-indigo-700">PLATINUM</p>
                  </div>
                  <p className="text-xs font-bold text-indigo-800">Rs {platinumPrice}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Link>

      <p className="px-3.5 pb-2 text-[11px] text-slate-500">
        {getQualityLabel(trust.qualityScore)} data quality ({trust.completedItems}/{trust.totalItems}) • {getLastUpdatedLabel(updatedAt)}
      </p>

      <div className="px-3.5 pb-3.5">
        {isFishbowl ? (
          <button
            onClick={handleCall}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-600"
          >
            <Phone className="h-[15px] w-[15px]" />
            Call {contactName || "to Book"}
          </button>
        ) : bookingEnabled ? (
          <Link
            href={catererUrl}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff7a00] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#e86f00]"
          >
            View Menu and Book
          </Link>
        ) : (
          <Link
            href={catererUrl}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#0b5fab] py-2.5 text-sm font-bold text-[#0b5fab] transition-colors hover:bg-[#0b5fab]/5"
          >
            View Packages
          </Link>
        )}
      </div>
    </div>
  );
}

