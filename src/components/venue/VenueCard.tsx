"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  MapPin,
  CheckCircle2,
  Heart,
  Phone,
  Calendar,
  GitCompare,
  Star,
  Zap,
} from "lucide-react";
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
  rating?: number;
  reviewCount?: number;
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
  inWishlist = false,
  slug,
  distanceText,
  rating,
  reviewCount,
}: VenueCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { isVenueSelected, addVenue, removeVenue } = useCompare();
  const [isInWishlist, setIsInWishlist] = useState(inWishlist);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const isFishbowl = isAdminListed && !bookingEnabled;
  const isSelected = isVenueSelected(venueId || id);

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const targetId = venueId || id;
    if (isSelected) removeVenue(targetId);
    else addVenue(targetId, name);
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
    setIsInWishlist(!prev);
    setWishlistLoading(true);

    try {
      const { error } = prev
        ? await api.removeFromWishlist(targetId)
        : await api.addToWishlist({ venueId: targetId });

      if (error) {
        setIsInWishlist(prev);
      }
    } catch {
      setIsInWishlist(prev);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleCall = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (contactNumber) window.location.href = `tel:${contactNumber}`;
  };

  const formatPrice = (price: number) => {
    if (price >= 100000) return `Rs ${(price / 100000).toFixed(1)}L`;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    })
      .format(price)
      .replace("₹", "Rs ");
  };

  const normalizedPriceMode = priceMode?.toUpperCase();
  const venueUrl = slug ? `/venues/${slug}` : `/venues/${id}`;

  const startingPrice = (() => {
    const prices = [marriagePrice, birthdayPrice, otherEventPrice, exactPrice, estimatedMinPrice].filter(Boolean) as number[];
    if (prices.length) return Math.min(...prices);
    if (primeDayPrice) return primeDayPrice;
    if (nonPrimeDayPrice) return nonPrimeDayPrice;
    return null;
  })();

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-white transition-all duration-200 group", isSelected ? "border-[#ff7a00] shadow-md ring-2 ring-[#ff7a00]/25" : "border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md")}>
      <Link href={venueUrl} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          <Image src={coverImage || "/placeholder-venue.jpg"} alt={name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

          <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
            <button onClick={handleWishlistToggle} disabled={wishlistLoading} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md transition-colors hover:bg-white disabled:opacity-50">
              <Heart className={cn("h-[18px] w-[18px] transition-colors", isInWishlist ? "fill-rose-500 text-rose-500" : "text-slate-700")} />
            </button>
            <button onClick={handleCompareToggle} className={cn("flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-colors", isSelected ? "bg-[#ff7a00] text-white" : "bg-white/95 text-slate-700 hover:bg-white")} title={isSelected ? "Remove from compare" : "Add to compare"}>
              <GitCompare className="h-4 w-4" />
            </button>
          </div>

          <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
            {isVerified && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow"><CheckCircle2 className="h-2.5 w-2.5" /> Verified</span>}
            {distanceText && <span className="rounded-full bg-[#0b5fab] px-2 py-0.5 text-[10px] font-bold text-white shadow">{distanceText}</span>}
          </div>

          <div className="absolute bottom-3 left-3">
            {bookingEnabled ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#ff7a00] px-2 py-0.5 text-[10px] font-bold text-white shadow"><Zap className="h-2.5 w-2.5" /> Instant Book</span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow"><Phone className="h-2.5 w-2.5" /> Call to Book</span>
            )}
          </div>
        </div>

        <div className="p-3.5">
          <div className="mb-1 flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 flex-1 text-[15px] font-extrabold leading-snug text-slate-900">{name}</h3>
            {rating && rating > 0 ? (
              <span className={cn("flex flex-shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-bold text-white", rating >= 4 ? "bg-emerald-600" : rating >= 3 ? "bg-amber-500" : "bg-rose-500")}>
                <Star className="h-[11px] w-[11px] fill-current" />
                {rating.toFixed(1)}
                {reviewCount ? <span className="ml-0.5 text-[9px] opacity-80">({reviewCount})</span> : null}
              </span>
            ) : null}
          </div>

          <p className="mb-2.5 flex items-center gap-1 truncate text-xs text-slate-500"><MapPin className="h-3 w-3 flex-shrink-0 text-[#0b5fab]" />{area ? `${area}, ${city}` : city}</p>

          <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
            <div className="flex items-center gap-1 text-xs text-slate-500"><Users className="h-3 w-3" /><span>{minGuests}-{maxGuests} guests</span></div>
            <div className="text-right">
              {startingPrice ? (
                <>
                  <p className="text-[10px] leading-none text-slate-400">Starting from</p>
                  <p className="text-base font-extrabold leading-none text-[#0b5fab]">{formatPrice(startingPrice)}</p>
                </>
              ) : normalizedPriceMode === "ESTIMATED" && estimatedMinPrice ? (
                <>
                  <p className="text-[10px] leading-none text-slate-400">Approx.</p>
                  <p className="text-sm font-extrabold leading-none text-[#0b5fab]">{formatPrice(estimatedMinPrice)}-{formatPrice(estimatedMaxPrice || 0)}</p>
                </>
              ) : (
                <p className="text-sm font-semibold text-slate-500">Call for price</p>
              )}
            </div>
          </div>
        </div>
      </Link>

      <div className="px-3.5 pb-3.5">
        {isFishbowl ? (
          <button onClick={handleCall} className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-600"><Phone className="h-[15px] w-[15px]" />Call {contactName || "to Book"}</button>
        ) : bookingEnabled ? (
          <Link href={venueUrl} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff7a00] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#e86f00]"><Calendar className="h-[15px] w-[15px]" />Book Now</Link>
        ) : (
          <Link href={venueUrl} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#0b5fab] py-2.5 text-sm font-bold text-[#0b5fab] transition-colors hover:bg-[#0b5fab]/5">View Details</Link>
        )}
      </div>
    </div>
  );
}

