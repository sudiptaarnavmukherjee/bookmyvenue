import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { optimizeImageUrl } from "@/lib/image";

// Optimized single API to fetch both venues and caterers for homepage
// Reduces multiple API calls to just ONE

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const venueLimit = parseInt(searchParams.get("venueLimit") || "6");
    const catererLimit = parseInt(searchParams.get("catererLimit") || "3");

    // Fetch venues and caterers in PARALLEL for performance
    const [venues, caterers, stats] = await Promise.all([
      // Featured Venues - optimized select
      prisma.venue.findMany({
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
          images: true,
          coverImage: true,
          exactPrice: true,
          primeDayPrice: true,
          nonPrimeDayPrice: true,
          estimatedMinPrice: true,
          estimatedMaxPrice: true,
          maxGuests: true,
          isVerified: true,
          isAdminListed: true,
          bookingEnabled: true,
          viewCount: true,
          _count: {
            select: { reviews: true, bookings: true },
          },
        },
        orderBy: [
          { viewCount: "desc" },
          { createdAt: "desc" },
        ],
        take: venueLimit,
      }),

      // Featured Caterers - optimized select
      prisma.caterer.findMany({
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
          images: true,
          coverImage: true,
          minPlatePrice: true,
          silverPrice: true,
          goldPrice: true,
          isPureVeg: true,
          cuisines: true,
          isVerified: true,
          isAdminListed: true,
          bookingEnabled: true,
          viewCount: true,
          rating: true,
          _count: {
            select: { reviews: true, bookings: true },
          },
        },
        orderBy: [
          { viewCount: "desc" },
          { createdAt: "desc" },
        ],
        take: catererLimit,
      }),

      // Quick stats for homepage - single query
      Promise.all([
        prisma.venue.count({ where: { isActive: true, deletedAt: null } }),
        prisma.caterer.count({ where: { isActive: true } }),
        prisma.booking.count({ where: { status: "COMPLETED" } }),
      ]),
    ]);

    // Transform venues for frontend
    const transformedVenues = venues.map((v) => ({
      id: v.id,
      name: v.name,
      slug: v.slug,
      location: v.area || v.city,
      city: v.city,
      area: v.area,
      price: v.exactPrice || v.primeDayPrice || v.estimatedMinPrice || 0,
      priceRange: v.estimatedMinPrice && v.estimatedMaxPrice 
        ? `₹${(v.estimatedMinPrice/1000).toFixed(0)}K - ₹${(v.estimatedMaxPrice/1000).toFixed(0)}K`
        : null,
      image: optimizeImageUrl(
        v.coverImage || (v.images ? v.images.split(",")[0].trim() : null),
        { width: 900, height: 560, quality: 72 }
      ),
      capacity: v.maxGuests,
      isVerified: v.isVerified,
      isAdminListed: v.isAdminListed,
      bookingEnabled: v.bookingEnabled,
      viewCount: v.viewCount,
      reviewCount: v._count.reviews,
      bookingCount: v._count.bookings,
    }));

    // Transform caterers for frontend  
    const transformedCaterers = caterers.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      location: c.area || c.city,
      city: c.city,
      area: c.area,
      price: c.minPlatePrice || c.silverPrice || 0,
      image: optimizeImageUrl(
        c.coverImage || (c.images ? c.images.split(",")[0].trim() : null),
        { width: 900, height: 560, quality: 72 }
      ),
      isPureVeg: c.isPureVeg,
      cuisines: c.cuisines,
      rating: c.rating,
      isVerified: c.isVerified,
      isAdminListed: c.isAdminListed,
      bookingEnabled: c.bookingEnabled,
      viewCount: c.viewCount,
      reviewCount: c._count.reviews,
    }));

    return NextResponse.json({
      venues: transformedVenues,
      caterers: transformedCaterers,
      stats: {
        totalVenues: stats[0],
        totalCaterers: stats[1],
        completedBookings: stats[2],
      },
    }, {
      headers: {
        // Cache for 5 minutes on CDN, 1 minute stale-while-revalidate
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (error: any) {
    console.error("Featured API Error:", error?.message || error);
    return NextResponse.json(
      { 
        error: "Failed to fetch featured data",
        venues: [],
        caterers: [],
        stats: { totalVenues: 0, totalCaterers: 0, completedBookings: 0 },
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  }
}
