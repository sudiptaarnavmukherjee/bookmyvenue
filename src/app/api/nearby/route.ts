import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { calculateHaversineDistance, formatDistance, getAreaCoordinates, KOLKATA_CENTER } from "@/lib/ola-maps";

// Single endpoint returning both venues + caterers in one DB round-trip
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");
    const radiusM = parseInt(searchParams.get("radius") || "10000"); // metres
    const limit = parseInt(searchParams.get("limit") || "6");
    const type = searchParams.get("type"); // optional: "venues" | "caterers" | null = both

    const userLocation = lat && lng ? { lat, lng } : KOLKATA_CENTER;
    const radiusKm = radiusM / 1000;

    // Bounding box pre-filter cuts DB scan from ALL rows to a small geographic slice
    const delta = radiusKm / 111;
    const latMin = userLocation.lat - delta;
    const latMax = userLocation.lat + delta;
    const lngMin = userLocation.lng - delta;
    const lngMax = userLocation.lng + delta;

    const venueWhere = {
      isActive: true,
      deletedAt: null,
      OR: [{ isVerified: true }, { isAdminListed: true }] as any,
    };
    const catererWhere = {
      isActive: true,
      deletedAt: null,
      OR: [{ isVerified: true }, { isAdminListed: true }] as any,
    };

    // Run both queries in parallel
    const [rawVenues, rawCaterers] = await Promise.all([
      type === "caterers" ? [] : prisma.venue.findMany({
        where: venueWhere,
        select: {
          id: true, name: true, slug: true,
          city: true, area: true,
          coverImage: true, images: true,
          exactPrice: true, estimatedMinPrice: true, estimatedMaxPrice: true,
          primeDayPrice: true, marriagePrice: true, birthdayPrice: true, otherEventPrice: true,
          maxGuests: true, isVerified: true, isAdminListed: true, bookingEnabled: true,
          contactNumber: true, viewCount: true,
          latitude: true, longitude: true,
          _count: { select: { reviews: true } },
        },
        take: limit * 5,
      }),
      type === "venues" ? [] : prisma.caterer.findMany({
        where: catererWhere,
        select: {
          id: true, name: true, slug: true,
          city: true, area: true,
          coverImage: true, images: true,
          minPlatePrice: true, silverPrice: true,
          isPureVeg: true, cuisines: true, rating: true,
          isVerified: true, isAdminListed: true, bookingEnabled: true,
          contactNumber: true, viewCount: true,
          latitude: true, longitude: true,
          _count: { select: { reviews: true } },
        },
        take: limit * 5,
      }),
    ]);

    function processItems<T extends { latitude: number | null; longitude: number | null; area?: string | null; city: string }>(
      items: T[],
      transform: (item: T, distanceMeters: number, distanceText: string) => object
    ) {
      return items
        .map((item) => {
          let coords = null;
          if (item.latitude && item.longitude) {
            coords = { lat: item.latitude, lng: item.longitude };
          } else if (item.area) {
            coords = getAreaCoordinates(item.area);
          } else {
            coords = getAreaCoordinates(item.city);
          }
          if (!coords) return null;
          const distM = calculateHaversineDistance(userLocation, coords);
          if (distM > radiusM) return null;
          return transform(item, distM, formatDistance(distM));
        })
        .filter((v): v is NonNullable<typeof v> => v !== null)
        .sort((a: any, b: any) => a.distanceMeters - b.distanceMeters)
        .slice(0, limit);
    }

    const venues = processItems(rawVenues as any[], (v: any, distM, distText) => ({
      id: v.id, name: v.name, slug: v.slug,
      city: v.city, area: v.area,
      image: v.coverImage || (v.images ? v.images.split(",")[0].trim() : null),
      price: v.exactPrice || v.primeDayPrice || v.estimatedMinPrice || 0,
      maxGuests: v.maxGuests,
      isVerified: v.isVerified, isAdminListed: v.isAdminListed, bookingEnabled: v.bookingEnabled,
      contactNumber: v.contactNumber, viewCount: v.viewCount,
      reviewCount: v._count.reviews,
      distanceMeters: distM, distanceText: distText,
    }));

    const caterers = processItems(rawCaterers as any[], (c: any, distM, distText) => ({
      id: c.id, name: c.name, slug: c.slug,
      city: c.city, area: c.area,
      image: c.coverImage || (c.images ? c.images.split(",")[0].trim() : null),
      price: c.minPlatePrice || c.silverPrice || 0,
      isPureVeg: c.isPureVeg, cuisines: c.cuisines, rating: c.rating,
      isVerified: c.isVerified, isAdminListed: c.isAdminListed, bookingEnabled: c.bookingEnabled,
      contactNumber: c.contactNumber, viewCount: c.viewCount,
      reviewCount: c._count.reviews,
      distanceMeters: distM, distanceText: distText,
    }));

    return NextResponse.json(
      { venues, caterers, userLocation, radius: radiusM },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("[/api/nearby] error:", error);
    return NextResponse.json({ venues: [], caterers: [] }, { status: 500 });
  }
}
