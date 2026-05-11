import Image from "next/image";
import Link from "next/link";
import { MapPin, Users, CheckCircle, Star } from "lucide-react";
import type { VenueCard, CatererCard } from "@/lib/home-data";

const VENUE_FALLBACK =
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&q=70";
const CATERER_FALLBACK =
  "https://images.unsplash.com/photo-1555244162-803834f70033?w=300&q=70";

// ── Price display helper ────────────────────────────────────────
function venuePrice(venue: VenueCard): string {
  const prices = [venue.marriagePrice, venue.birthdayPrice, venue.otherEventPrice].filter(
    Boolean
  ) as number[];
  if (prices.length) {
    const min = Math.min(...prices);
    return `₹${(min / 1000).toFixed(0)}K+`;
  }
  if (venue.priceRange) return venue.priceRange;
  if (venue.price) return `₹${(venue.price / 1000).toFixed(0)}K`;
  return "Call for price";
}

// ============================================================
// Venue Grid Card  —  Airbnb/Booking.com style
// ============================================================
export function VenueCardServer({ venue }: { venue: VenueCard }) {
  const price = venuePrice(venue);
  const href = `/venues/${venue.slug || venue.id}`;

  return (
    <Link href={href} className="block group" prefetch={true}>
      <article className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm group-hover:shadow-lg group-hover:-translate-y-0.5 group-active:scale-[0.98] transition-all duration-200">
        {/* ── Image ── */}
        <div className="relative aspect-[3/2] bg-gray-100 overflow-hidden">
          <Image
            src={venue.image || VENUE_FALLBACK}
            alt={venue.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUH/8QAIhAAAQMEAgMAAAAAAAAAAAAAAQIDBAAFBhExIUFR/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AMriGMZG7fJuLhuBgQpHCiQAAMqCfPkk8u+WD5GH+6IAAAP/2Q=="
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

          {/* Verified badge — top left */}
          {venue.isVerified && (
            <span className="absolute top-2 left-2 flex items-center gap-1 bg-white/95 text-green-700 text-[11px] font-bold px-2 py-1 rounded-full shadow-sm border border-green-100">
              <CheckCircle className="w-3 h-3" /> Verified
            </span>
          )}

          {/* Booking badge — top right */}
          <span
            className={`absolute top-2 right-2 text-[11px] font-bold px-2 py-1 rounded-full ${
              venue.bookingEnabled
                ? "bg-purple-600 text-white"
                : "bg-amber-500 text-white"
            }`}
          >
            {venue.bookingEnabled ? "⚡ Instant" : "📞 Call"}
          </span>

          {/* Price — bottom left (on photo like Airbnb) */}
          <div className="absolute bottom-2.5 left-3">
            <p className="text-white font-extrabold text-base drop-shadow leading-none">
              {price}
            </p>
            <p className="text-white/70 text-[10px] mt-0.5">per event</p>
          </div>

          {/* Capacity chip — bottom right */}
          {venue.capacity && (
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[11px] px-2 py-0.5 rounded-full">
              <Users className="w-3 h-3" />
              {venue.capacity >= 1000
                ? `${(venue.capacity / 1000).toFixed(0)}K`
                : venue.capacity}
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="p-3">
          <h3 className="font-bold text-gray-900 text-[15px] leading-snug line-clamp-1">
            {venue.name}
          </h3>
          <p className="flex items-center gap-1 text-gray-500 text-[13px] mt-1 truncate">
            <MapPin className="w-3 h-3 flex-shrink-0 text-purple-400" />
            {venue.location}
          </p>
        </div>
      </article>
    </Link>
  );
}

// ============================================================
// Horizontal Venue Card  —  "Best in Town" scroll
// ============================================================
export function HorizontalVenueCardServer({ venue }: { venue: VenueCard }) {
  const price = venuePrice(venue);
  const href = `/venues/${venue.slug || venue.id}`;

  return (
    <Link href={href} className="flex-shrink-0 w-52 block group" prefetch={true}>
      <article className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm group-hover:shadow-md group-active:scale-[0.98] transition-all duration-200">
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
          <Image
            src={venue.image || VENUE_FALLBACK}
            alt={venue.name}
            fill
            sizes="208px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {venue.isVerified && (
            <span className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-white/95 text-green-700 text-[8px] font-bold px-1 py-0.5 rounded-full">
              <CheckCircle className="w-2 h-2" /> Verified
            </span>
          )}
          <div className="absolute bottom-2 left-2 right-2">
            <p className="text-white font-bold text-xs drop-shadow leading-tight truncate">
              {venue.name}
            </p>
            <p className="text-white/70 text-[9px] mt-0.5">{price} · per event</p>
          </div>
        </div>
        <div className="px-2.5 py-2">
          <p className="flex items-center gap-0.5 text-gray-400 text-[10px] truncate">
            <MapPin className="w-2 h-2 flex-shrink-0" />
            {venue.location}
          </p>
          {venue.capacity && (
            <p className="flex items-center gap-0.5 text-gray-400 text-[10px] mt-0.5">
              <Users className="w-2 h-2" /> Up to {venue.capacity} guests
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}

// ============================================================
// Caterer List Card  —  Zomato / Swiggy style
// ============================================================
export function CatererCardServer({ caterer }: { caterer: CatererCard }) {
  const href = `/catering/${caterer.slug || caterer.id}`;
  const ratingBg =
    caterer.rating === null || caterer.rating === undefined
      ? ""
      : caterer.rating >= 4.0
      ? "bg-green-600"
      : caterer.rating >= 3.0
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <Link
      href={href}
      className="flex gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 active:scale-[0.99] transition-all duration-200"
      prefetch={true}
    >
      {/* Thumbnail */}
      <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
        <Image
          src={caterer.image || CATERER_FALLBACK}
          alt={caterer.name}
          fill
          sizes="96px"
          className="object-cover"
          loading="lazy"
        />
        {/* FSSAI-style veg / non-veg indicator */}
        <div
          className={`absolute top-1 left-1 w-3.5 h-3.5 border-2 rounded-sm bg-white flex items-center justify-center ${
            caterer.isPureVeg ? "border-green-600" : "border-red-700"
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              caterer.isPureVeg ? "bg-green-600" : "bg-red-700"
            }`}
          />
        </div>
        {/* Rating on image */}
        {caterer.rating !== null &&
          caterer.rating !== undefined &&
          caterer.rating > 0 && (
            <div
              className={`absolute bottom-1.5 left-1.5 flex items-center gap-0.5 text-white text-[9px] font-bold px-1 py-0.5 rounded ${ratingBg}`}
            >
              <Star className="w-2 h-2 fill-current" />
              {caterer.rating.toFixed(1)}
            </div>
          )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1">
            {caterer.name}
          </h3>
          {caterer.isVerified && (
            <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
          )}
        </div>

        {caterer.cuisines && (
          <p className="text-gray-500 text-xs mt-0.5 truncate">{caterer.cuisines}</p>
        )}

        <p className="flex items-center gap-0.5 text-gray-400 text-xs mt-0.5 truncate">
          <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
          {caterer.location}
        </p>

        <div className="flex items-center justify-between mt-2.5">
          <div className="flex items-baseline gap-0.5">
            <span className="text-orange-600 font-extrabold text-base leading-none">
              ₹{caterer.price}
            </span>
            <span className="text-gray-400 text-xs">/plate</span>
          </div>
          <span
            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
              caterer.bookingEnabled
                ? "bg-orange-50 text-orange-700 border-orange-200"
                : "bg-gray-50 text-gray-500 border-gray-200"
            }`}
          >
            {caterer.bookingEnabled ? "⚡ Order Online" : "📞 Call"}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ============================================================
// Horizontal Caterer Card  —  "Top Rated" scroll
// ============================================================
export function HorizontalCatererCardServer({ caterer }: { caterer: CatererCard }) {
  const href = `/catering/${caterer.slug || caterer.id}`;
  const ratingBg =
    caterer.rating === null || caterer.rating === undefined
      ? ""
      : caterer.rating >= 4.0
      ? "bg-green-600"
      : caterer.rating >= 3.0
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <Link href={href} className="flex-shrink-0 w-40 block group" prefetch={true}>
      <article className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm group-hover:shadow-md group-active:scale-[0.98] transition-all duration-200">
        <div className="relative aspect-[1/1] bg-gray-100 overflow-hidden">
          <Image
            src={caterer.image || CATERER_FALLBACK}
            alt={caterer.name}
            fill
            sizes="160px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {/* Veg indicator */}
          <div
            className={`absolute top-1.5 left-1.5 w-3.5 h-3.5 border-2 rounded-sm bg-white flex items-center justify-center ${
              caterer.isPureVeg ? "border-green-600" : "border-red-700"
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                caterer.isPureVeg ? "bg-green-600" : "bg-red-700"
              }`}
            />
          </div>
          {/* Rating badge */}
          {caterer.rating !== null &&
            caterer.rating !== undefined &&
            caterer.rating > 0 && (
              <div
                className={`absolute bottom-1.5 left-1.5 flex items-center gap-0.5 text-white text-[9px] font-bold px-1 py-0.5 rounded ${ratingBg}`}
              >
                <Star className="w-2 h-2 fill-current" />
                {caterer.rating.toFixed(1)}
              </div>
            )}
        </div>
        <div className="p-2">
          <h3 className="font-semibold text-gray-900 text-xs leading-tight line-clamp-1">
            {caterer.name}
          </h3>
          {caterer.cuisines && (
            <p className="text-gray-400 text-[10px] mt-0.5 truncate">{caterer.cuisines}</p>
          )}
          <p className="text-orange-600 font-bold text-xs mt-0.5">
            ₹{caterer.price}/plate
          </p>
        </div>
      </article>
    </Link>
  );
}

// ============================================================
// Section Header
// ============================================================
export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  viewAllHref,
  accentColor = "purple",
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  viewAllHref?: string;
  accentColor?: "purple" | "orange";
}) {
  const accent = accentColor === "orange" ? "text-orange-600" : "text-purple-600";
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className={`w-4 h-4 ${accent}`} />}
        <div>
          <h2 className="font-bold text-gray-900 text-base leading-tight">{title}</h2>
          {subtitle && <p className="text-gray-400 text-xs">{subtitle}</p>}
        </div>
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className={`text-xs font-semibold ${accent}`}
          prefetch={false}
        >
          See all →
        </Link>
      )}
    </div>
  );
}

// ============================================================
// Skeleton loaders
// ============================================================
export function VenueCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="aspect-[3/2] bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded-full w-3/4" />
        <div className="h-3 bg-gray-100 rounded-full w-1/2" />
      </div>
    </div>
  );
}

export function CatererCardSkeleton() {
  return (
    <div className="flex gap-3 p-3 bg-white rounded-2xl border border-gray-100 animate-pulse">
      <div className="w-24 h-24 flex-shrink-0 rounded-xl bg-gray-200" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 bg-gray-200 rounded-full w-3/4" />
        <div className="h-3 bg-gray-100 rounded-full w-2/4" />
        <div className="h-3 bg-gray-100 rounded-full w-1/3" />
        <div className="h-4 bg-gray-200 rounded-full w-1/4 mt-3" />
      </div>
    </div>
  );
}

