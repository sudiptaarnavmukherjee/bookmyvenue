import prisma from "@/lib/db";
import { unstable_cache } from "next/cache";

// ============================================
// Types
// ============================================
export interface VenueCard {
  id: string;
  name: string;
  slug: string | null;
  location: string;
  price: number;
  priceRange: string | null;
  image: string | null;
  capacity: number | null;
  isVerified: boolean;
  bookingEnabled: boolean;
}

export interface CatererCard {
  id: string;
  name: string;
  slug: string | null;
  location: string;
  price: number;
  image: string | null;
  isPureVeg: boolean;
  cuisines: string | null;
  rating: number | null;
  isVerified: boolean;
  bookingEnabled: boolean;
}

export interface HomeStats {
  totalVenues: number;
  totalCaterers: number;
  completedBookings: number;
}

// ============================================
// Cached Data Fetchers (ISR with 5 min revalidation)
// ============================================

/**
 * Fetch featured venues - cached for 5 minutes
 */
export const getFeaturedVenues = unstable_cache(
  async (limit: number = 12): Promise<VenueCard[]> => {
    const venues = await prisma.venue.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [{ isVerified: true }, { isAdminListed: true }],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        area: true,
        coverImage: true,
        images: true,
        exactPrice: true,
        primeDayPrice: true,
        estimatedMinPrice: true,
        estimatedMaxPrice: true,
        maxGuests: true,
        isVerified: true,
        bookingEnabled: true,
      },
      orderBy: [{ viewCount: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    return venues.map((v) => ({
      id: v.id,
      name: v.name,
      slug: v.slug,
      location: v.area || v.city || "Kolkata",
      price: v.exactPrice || v.primeDayPrice || v.estimatedMinPrice || 0,
      priceRange:
        v.estimatedMinPrice && v.estimatedMaxPrice
          ? `₹${(v.estimatedMinPrice / 1000).toFixed(0)}K - ₹${(v.estimatedMaxPrice / 1000).toFixed(0)}K`
          : null,
      image: v.coverImage || (v.images ? v.images.split(",")[0].trim() : null),
      capacity: v.maxGuests,
      isVerified: v.isVerified || false,
      bookingEnabled: v.bookingEnabled || false,
    }));
  },
  ["featured-venues"],
  { revalidate: 300, tags: ["venues"] } // 5 minutes
);

/**
 * Fetch featured caterers - cached for 5 minutes
 */
export const getFeaturedCaterers = unstable_cache(
  async (limit: number = 12): Promise<CatererCard[]> => {
    const caterers = await prisma.caterer.findMany({
      where: {
        isActive: true,
        OR: [{ isVerified: true }, { isAdminListed: true }],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        area: true,
        coverImage: true,
        images: true,
        minPlatePrice: true,
        silverPrice: true,
        isPureVeg: true,
        cuisines: true,
        rating: true,
        isVerified: true,
        bookingEnabled: true,
      },
      orderBy: [{ viewCount: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    return caterers.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      location: c.area || c.city || "Kolkata",
      price: c.minPlatePrice || c.silverPrice || 0,
      image: c.coverImage || (c.images ? c.images.split(",")[0].trim() : null),
      isPureVeg: c.isPureVeg || false,
      cuisines: c.cuisines,
      rating: c.rating,
      isVerified: c.isVerified || false,
      bookingEnabled: c.bookingEnabled || false,
    }));
  },
  ["featured-caterers"],
  { revalidate: 300, tags: ["caterers"] } // 5 minutes
);

/**
 * Fetch homepage stats - cached for 1 hour
 */
export const getHomeStats = unstable_cache(
  async (): Promise<HomeStats> => {
    const [totalVenues, totalCaterers, completedBookings] = await Promise.all([
      prisma.venue.count({ where: { isActive: true, deletedAt: null } }),
      prisma.caterer.count({ where: { isActive: true } }),
      prisma.booking.count({ where: { status: "COMPLETED" } }),
    ]);

    return { totalVenues, totalCaterers, completedBookings };
  },
  ["home-stats"],
  { revalidate: 3600, tags: ["stats"] } // 1 hour
);
