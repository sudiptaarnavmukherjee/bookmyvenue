import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Users,
  CheckCircle,
  Star,
  ArrowRight,
  Zap,
  Phone,
} from "lucide-react";
import type { VenueCard, CatererCard } from "@/lib/home-data";

const VENUE_FALLBACK =
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=70";
const CATERER_FALLBACK =
  "https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=70";

function venuePrice(venue: VenueCard): string {
  const prices = [venue.marriagePrice, venue.birthdayPrice, venue.otherEventPrice].filter(
    Boolean
  ) as number[];

  if (prices.length) {
    const min = Math.min(...prices);
    return `Rs ${(min / 1000).toFixed(0)}K`;
  }
  if (venue.priceRange) return venue.priceRange;
  if (venue.price) return `Rs ${(venue.price / 1000).toFixed(0)}K`;
  return "Call";
}

export function VenueCardServer({ venue }: { venue: VenueCard }) {
  const price = venuePrice(venue);
  const href = `/venues/${venue.slug || venue.id}`;

  return (
    <Link href={href} className="block group" prefetch={true}>
      <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md group-active:scale-[0.985]">
        <div className="relative aspect-[16/11] overflow-hidden bg-slate-100">
          <Image
            src={venue.image || VENUE_FALLBACK}
            alt={venue.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

          {venue.isVerified && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              <CheckCircle className="h-2.5 w-2.5" /> Verified
            </span>
          )}

          <span
            className={`absolute right-2 top-2 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${
              venue.bookingEnabled ? "bg-[#ff7a00]" : "bg-amber-500"
            }`}
          >
            {venue.bookingEnabled ? (
              <>
                <Zap className="h-2.5 w-2.5" /> Instant
              </>
            ) : (
              <>
                <Phone className="h-2.5 w-2.5" /> Call
              </>
            )}
          </span>
        </div>

        <div className="p-3">
          <h3 className="mb-1 line-clamp-1 text-[13px] font-bold leading-snug text-slate-900">{venue.name}</h3>
          <p className="mb-2 flex items-center gap-0.5 truncate text-[11px] text-slate-500">
            <MapPin className="h-2.5 w-2.5 flex-shrink-0 text-[#0b5fab]" />
            {venue.location}
          </p>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-base font-extrabold leading-none text-[#0b5fab]">{price}</span>
              <span className="ml-1 text-[9px] text-slate-400">/ event</span>
            </div>
            {venue.capacity && (
              <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
                <Users className="h-2.5 w-2.5" />
                {venue.capacity >= 1000 ? `${(venue.capacity / 1000).toFixed(0)}K` : venue.capacity}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

export function HorizontalVenueCardServer({ venue }: { venue: VenueCard }) {
  const price = venuePrice(venue);
  const href = `/venues/${venue.slug || venue.id}`;

  return (
    <Link href={href} className="block w-56 flex-shrink-0 group" prefetch={true}>
      <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 group-hover:shadow-md group-active:scale-[0.985]">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <Image
            src={venue.image || VENUE_FALLBACK}
            alt={venue.name}
            fill
            sizes="224px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="line-clamp-1 text-xs font-bold text-white">{venue.name}</p>
          </div>
        </div>
        <div className="px-3 py-2.5">
          <p className="mb-1.5 flex items-center gap-0.5 truncate text-[11px] text-slate-500">
            <MapPin className="h-2.5 w-2.5 flex-shrink-0 text-[#0b5fab]" />
            {venue.location}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold text-[#0b5fab]">
              {price}
              <span className="ml-0.5 text-[9px] font-normal text-slate-400">/ event</span>
            </span>
            {venue.capacity && (
              <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
                <Users className="h-2.5 w-2.5" /> {venue.capacity}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

export function CatererCardServer({ caterer }: { caterer: CatererCard }) {
  const href = `/catering/${caterer.slug || caterer.id}`;

  return (
    <Link
      href={href}
      className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 hover:border-[#0b5fab]/30 hover:shadow-md active:scale-[0.99]"
      prefetch={true}
    >
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
        <Image
          src={caterer.image || CATERER_FALLBACK}
          alt={caterer.name}
          fill
          sizes="96px"
          className="object-cover"
          loading="lazy"
        />

        {caterer.rating !== null && caterer.rating !== undefined && caterer.rating > 0 && (
          <div
            className={`absolute bottom-0 left-0 right-0 flex items-center justify-center gap-0.5 py-0.5 text-[9px] font-bold text-white ${
              caterer.rating >= 4
                ? "bg-emerald-600"
                : caterer.rating >= 3
                ? "bg-amber-500"
                : "bg-rose-500"
            }`}
          >
            <Star className="h-2 w-2 fill-current" />
            {caterer.rating.toFixed(1)}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        <div className="mb-0.5 flex items-start justify-between gap-1">
          <h3 className="line-clamp-1 text-sm font-bold leading-tight text-slate-900">{caterer.name}</h3>
          {caterer.isVerified && <CheckCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />}
        </div>

        {caterer.cuisines && <p className="truncate text-xs text-slate-500">{caterer.cuisines}</p>}

        <p className="mt-0.5 flex items-center gap-0.5 truncate text-xs text-slate-400">
          <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
          {caterer.location}
        </p>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-baseline gap-0.5">
            <span className="text-base font-extrabold leading-none text-[#0b5fab]">Rs {caterer.price}</span>
            <span className="text-xs text-slate-400">/plate</span>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              caterer.bookingEnabled ? "bg-[#ff7a00]/15 text-[#ff7a00]" : "bg-slate-100 text-slate-500"
            }`}
          >
            {caterer.bookingEnabled ? "Book" : "Call"}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function HorizontalCatererCardServer({ caterer }: { caterer: CatererCard }) {
  const href = `/catering/${caterer.slug || caterer.id}`;

  return (
    <Link href={href} className="block w-40 flex-shrink-0 group" prefetch={true}>
      <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 group-hover:shadow-md group-active:scale-[0.985]">
        <div className="relative aspect-square overflow-hidden bg-slate-100">
          <Image
            src={caterer.image || CATERER_FALLBACK}
            alt={caterer.name}
            fill
            sizes="160px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {caterer.rating !== null && caterer.rating !== undefined && caterer.rating > 0 && (
            <div
              className={`absolute bottom-1.5 left-1.5 flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-bold text-white ${
                caterer.rating >= 4
                  ? "bg-emerald-600"
                  : caterer.rating >= 3
                  ? "bg-amber-500"
                  : "bg-rose-500"
              }`}
            >
              <Star className="h-2 w-2 fill-current" />
              {caterer.rating.toFixed(1)}
            </div>
          )}
        </div>
        <div className="p-2">
          <h3 className="line-clamp-1 text-xs font-bold leading-tight text-slate-900">{caterer.name}</h3>
          {caterer.cuisines && <p className="mt-0.5 truncate text-[10px] text-slate-400">{caterer.cuisines}</p>}
          <p className="mt-0.5 text-xs font-extrabold text-[#0b5fab]">
            Rs {caterer.price}
            <span className="font-normal text-slate-400">/plate</span>
          </p>
        </div>
      </article>
    </Link>
  );
}

export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  viewAllHref,
  accentColor = "blue",
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  viewAllHref?: string;
  accentColor?: "blue" | "orange";
}) {
  const accent = accentColor === "orange" ? "text-[#ff7a00]" : "text-[#0b5fab]";

  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {Icon && <Icon className={`h-4 w-4 ${accent}`} />}
        <div>
          <h2 className="text-base font-extrabold leading-tight text-slate-900">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {viewAllHref && (
        <Link href={viewAllHref} className={`flex items-center gap-1 text-xs font-bold ${accent}`} prefetch={false}>
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

export function VenueCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white animate-pulse">
      <div className="aspect-[16/11] bg-slate-200" />
      <div className="space-y-2 p-3">
        <div className="h-3.5 w-3/4 rounded-full bg-slate-200" />
        <div className="h-3 w-1/2 rounded-full bg-slate-100" />
        <div className="mt-1 h-4 w-1/4 rounded-full bg-slate-200" />
      </div>
    </div>
  );
}

export function CatererCardSkeleton() {
  return (
    <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 animate-pulse">
      <div className="h-24 w-24 flex-shrink-0 rounded-xl bg-slate-200" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 w-3/4 rounded-full bg-slate-200" />
        <div className="h-3 w-2/4 rounded-full bg-slate-100" />
        <div className="h-3 w-1/3 rounded-full bg-slate-100" />
        <div className="mt-3 h-4 w-1/4 rounded-full bg-slate-200" />
      </div>
    </div>
  );
}

