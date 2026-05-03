import Image from "next/image";
import Link from "next/link";
import { MapPin, Users, CheckCircle, ChevronRight, Star, Leaf } from "lucide-react";
import type { VenueCard, CatererCard } from "@/lib/home-data";

// ============================================
// Venue Card - Server Component with next/image
// ============================================
export function VenueCardServer({ venue }: { venue: VenueCard }) {
  const fallbackImage = "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&q=70";
  
  return (
    <Link 
      href={`/venues/${venue.slug || venue.id}`}
      className="block bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-md transition-shadow"
      prefetch={true}
    >
      <div className="relative h-40 bg-gray-100">
        <Image
          src={venue.image || fallbackImage}
          alt={venue.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover"
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgEDAwUBAAAAAAAAAAAAAQIDAAQFBhESEyEiMUH/xAAVAQEBAAAAAAAAAAAAAAAAAAAAAf/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEEA8g8f/2Q=="
        />
        
        {venue.isVerified && (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <CheckCircle className="w-2.5 h-2.5" />
            Verified
          </span>
        )}

        <span className={`absolute top-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
          venue.bookingEnabled 
            ? "bg-purple-600 text-white" 
            : "bg-amber-500 text-white"
        }`}>
          {venue.bookingEnabled ? "Book Online" : "Call to Book"}
        </span>
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm truncate">{venue.name}</h3>
        
        <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{venue.location}</span>
        </div>

        {venue.capacity && (
          <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
            <Users className="w-3 h-3" />
            <span>Up to {venue.capacity} guests</span>
          </div>
        )}

        <div className="mt-2 flex items-center justify-between">
          <div>
            {venue.marriagePrice || venue.birthdayPrice || venue.otherEventPrice ? (
              <div className="flex gap-1 flex-wrap">
                {venue.marriagePrice && (
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">💍 ₹{(venue.marriagePrice/1000).toFixed(0)}K</span>
                )}
                {venue.birthdayPrice && (
                  <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">🎂 ₹{(venue.birthdayPrice/1000).toFixed(0)}K</span>
                )}
                {venue.otherEventPrice && (
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">🙏 ₹{(venue.otherEventPrice/1000).toFixed(0)}K</span>
                )}
              </div>
            ) : (
              <div>
                <span className="text-purple-600 font-bold text-base">
                  {venue.priceRange || `₹${(venue.price/1000).toFixed(0)}K`}
                </span>
                <span className="text-gray-400 text-[10px] ml-1">per function</span>
              </div>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </Link>
  );
}

// ============================================
// Horizontal Venue Card
// ============================================
export function HorizontalVenueCardServer({ venue }: { venue: VenueCard }) {
  const fallbackImage = "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=300&q=70";
  
  return (
    <Link 
      href={`/venues/${venue.slug || venue.id}`}
      className="flex-shrink-0 w-64 bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow"
      prefetch={true}
    >
      <div className="relative h-32 bg-gray-100">
        <Image
          src={venue.image || fallbackImage}
          alt={venue.name}
          fill
          sizes="256px"
          className="object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-2.5">
        <h3 className="font-semibold text-gray-900 text-sm truncate">{venue.name}</h3>
        <p className="text-gray-500 text-xs truncate">{venue.location}</p>
        {venue.marriagePrice || venue.birthdayPrice || venue.otherEventPrice ? (
          <div className="flex gap-1 flex-wrap mt-1">
            {venue.marriagePrice && <span className="text-[9px] font-bold text-rose-600">💍 ₹{(venue.marriagePrice/1000).toFixed(0)}K</span>}
            {venue.birthdayPrice && <span className="text-[9px] font-bold text-yellow-600">🎂 ₹{(venue.birthdayPrice/1000).toFixed(0)}K</span>}
            {venue.otherEventPrice && <span className="text-[9px] font-bold text-purple-600">🙏 ₹{(venue.otherEventPrice/1000).toFixed(0)}K</span>}
          </div>
        ) : (
          <p className="text-purple-600 font-bold text-sm mt-1">
            {venue.priceRange || `₹${(venue.price/1000).toFixed(0)}K`}
          </p>
        )}
      </div>
    </Link>
  );
}

// ============================================
// Caterer Card - Zomato Style
// ============================================
export function CatererCardServer({ caterer }: { caterer: CatererCard }) {
  const fallbackImage = "https://images.unsplash.com/photo-1555244162-803834f70033?w=200&q=70";
  
  return (
    <Link 
      href={`/catering/${caterer.slug || caterer.id}`}
      className="flex gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-shadow"
      prefetch={true}
    >
      <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
        <Image
          src={caterer.image || fallbackImage}
          alt={caterer.name}
          fill
          sizes="96px"
          className="object-cover"
          loading="lazy"
        />
        {caterer.isPureVeg && (
          <div className="absolute top-1 left-1 bg-green-500 p-0.5 rounded">
            <Leaf className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 text-sm truncate">{caterer.name}</h3>
          {caterer.rating && caterer.rating > 0 && (
            <div className="flex items-center gap-0.5 bg-green-600 text-white px-1.5 py-0.5 rounded text-xs flex-shrink-0">
              <Star className="w-2.5 h-2.5 fill-current" />
              <span>{caterer.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <p className="text-gray-500 text-xs truncate mt-0.5">
          {caterer.cuisines || "Multi-cuisine"}
        </p>

        <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
          <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
          <span className="truncate">{caterer.location}</span>
        </div>

        <div className="flex items-center justify-between mt-1.5">
          <p className="text-orange-600 font-bold text-sm">
            ₹{caterer.price}<span className="text-gray-400 font-normal text-xs">/plate</span>
          </p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
            caterer.bookingEnabled 
              ? "bg-orange-100 text-orange-700" 
              : "bg-gray-100 text-gray-600"
          }`}>
            {caterer.bookingEnabled ? "Order Online" : "Call"}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ============================================
// Horizontal Caterer Card
// ============================================
export function HorizontalCatererCardServer({ caterer }: { caterer: CatererCard }) {
  const fallbackImage = "https://images.unsplash.com/photo-1555244162-803834f70033?w=200&q=70";
  
  return (
    <Link 
      href={`/catering/${caterer.slug || caterer.id}`}
      className="flex-shrink-0 w-44 bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow"
      prefetch={true}
    >
      <div className="relative h-28 bg-gray-100">
        <Image
          src={caterer.image || fallbackImage}
          alt={caterer.name}
          fill
          sizes="176px"
          className="object-cover"
          loading="lazy"
        />
        {caterer.isPureVeg && (
          <div className="absolute top-2 left-2 bg-green-500 p-0.5 rounded">
            <Leaf className="w-2.5 h-2.5 text-white" />
          </div>
        )}
        {caterer.rating && caterer.rating > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-0.5 bg-green-600 text-white px-1 py-0.5 rounded text-[10px]">
            <Star className="w-2.5 h-2.5 fill-current" />
            {caterer.rating.toFixed(1)}
          </div>
        )}
      </div>
      <div className="p-2">
        <h3 className="font-semibold text-gray-900 text-xs truncate">{caterer.name}</h3>
        <p className="text-gray-400 text-[10px] truncate">{caterer.cuisines || "Multi-cuisine"}</p>
        <p className="text-orange-600 font-bold text-xs mt-0.5">₹{caterer.price}/plate</p>
      </div>
    </Link>
  );
}

// ============================================
// Section Header
// ============================================
export function SectionHeader({ 
  title, 
  subtitle, 
  icon: Icon, 
  viewAllHref,
  accentColor = "purple"
}: { 
  title: string; 
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  viewAllHref?: string;
  accentColor?: "purple" | "orange";
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            accentColor === "purple" ? "bg-purple-100" : "bg-orange-100"
          }`}>
            <Icon className={`w-4 h-4 ${accentColor === "purple" ? "text-purple-600" : "text-orange-600"}`} />
          </div>
        )}
        <div>
          <h2 className="font-bold text-gray-900 text-base">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {viewAllHref && (
        <Link href={viewAllHref} className={`text-sm font-medium flex items-center gap-0.5 ${
          accentColor === "purple" ? "text-purple-600" : "text-orange-600"
        }`} prefetch={true}>
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

// ============================================
// Skeleton Loaders
// ============================================
export function VenueCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="h-40 bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-5 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );
}

export function CatererCardSkeleton() {
  return (
    <div className="flex gap-3 p-3 bg-white rounded-xl border border-gray-100 animate-pulse">
      <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-1/4" />
      </div>
    </div>
  );
}
