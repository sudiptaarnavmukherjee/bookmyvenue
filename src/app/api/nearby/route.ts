import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { 
  calculateHaversineDistance, 
  formatDistance, 
  getAreaCoordinates,
  KOLKATA_CENTER,
  type Coordinates 
} from "@/lib/ola-maps";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");
    const radius = parseInt(searchParams.get("radius") || "50000"); // Default 50km
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type") || "venues"; // venues or caterers

    // Validate coordinates
    const userLocation: Coordinates = (lat && lng) 
      ? { lat, lng } 
      : KOLKATA_CENTER;

    if (type === "venues") {
      // Fetch all active venues
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
          address: true,
          latitude: true,
          longitude: true,
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
          contactNumber: true,
          viewCount: true,
          _count: {
            select: { reviews: true },
          },
        },
      });

      // Calculate distances and sort by proximity
      const venuesWithDistance = venues
        .map((venue) => {
          // Use venue coordinates if available, otherwise estimate from area
          let coords: Coordinates | null = null;
          
          if (venue.latitude && venue.longitude) {
            coords = { lat: venue.latitude, lng: venue.longitude };
          } else if (venue.area) {
            coords = getAreaCoordinates(venue.area);
          } else if (venue.city) {
            coords = getAreaCoordinates(venue.city);
          }

          if (!coords) {
            return null;
          }

          const distanceMeters = calculateHaversineDistance(userLocation, coords);
          
          // Filter by radius
          if (distanceMeters > radius) {
            return null;
          }

          return {
            id: venue.id,
            name: venue.name,
            slug: venue.slug,
            location: venue.area || venue.city,
            city: venue.city,
            area: venue.area,
            address: venue.address,
            price: venue.exactPrice || venue.primeDayPrice || venue.estimatedMinPrice || 0,
            priceRange: venue.estimatedMinPrice && venue.estimatedMaxPrice
              ? `₹${(venue.estimatedMinPrice/1000).toFixed(0)}K - ₹${(venue.estimatedMaxPrice/1000).toFixed(0)}K`
              : null,
            image: venue.coverImage || (venue.images ? venue.images.split(",")[0].trim() : null),
            capacity: venue.maxGuests,
            isVerified: venue.isVerified,
            isAdminListed: venue.isAdminListed,
            bookingEnabled: venue.bookingEnabled,
            contactNumber: venue.contactNumber,
            viewCount: venue.viewCount,
            reviewCount: venue._count.reviews,
            coordinates: coords,
            distanceMeters,
            distanceText: formatDistance(distanceMeters),
          };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null)
        .sort((a, b) => a.distanceMeters - b.distanceMeters)
        .slice(0, limit);

      return NextResponse.json({
        venues: venuesWithDistance,
        userLocation,
        radius,
        total: venuesWithDistance.length,
      });
    } else {
      // Fetch all active caterers
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
          address: true,
          images: true,
          coverImage: true,
          minPlatePrice: true,
          silverPrice: true,
          isPureVeg: true,
          cuisines: true,
          rating: true,
          isVerified: true,
          isAdminListed: true,
          bookingEnabled: true,
          contactNumber: true,
          viewCount: true,
          _count: {
            select: { reviews: true },
          },
        },
      });

      // Calculate distances and sort by proximity
      const caterersWithDistance = caterers
        .map((caterer) => {
          // Estimate coordinates from area
          let coords: Coordinates | null = null;
          
          if (caterer.area) {
            coords = getAreaCoordinates(caterer.area);
          } else if (caterer.city) {
            coords = getAreaCoordinates(caterer.city);
          }

          if (!coords) {
            return null;
          }

          const distanceMeters = calculateHaversineDistance(userLocation, coords);
          
          // Filter by radius
          if (distanceMeters > radius) {
            return null;
          }

          return {
            id: caterer.id,
            name: caterer.name,
            slug: caterer.slug,
            location: caterer.area || caterer.city,
            city: caterer.city,
            area: caterer.area,
            price: caterer.minPlatePrice || caterer.silverPrice || 0,
            image: caterer.coverImage || (caterer.images ? caterer.images.split(",")[0].trim() : null),
            isPureVeg: caterer.isPureVeg,
            cuisines: caterer.cuisines,
            rating: caterer.rating,
            isVerified: caterer.isVerified,
            isAdminListed: caterer.isAdminListed,
            bookingEnabled: caterer.bookingEnabled,
            contactNumber: caterer.contactNumber,
            viewCount: caterer.viewCount,
            reviewCount: caterer._count.reviews,
            coordinates: coords,
            distanceMeters,
            distanceText: formatDistance(distanceMeters),
          };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null)
        .sort((a, b) => a.distanceMeters - b.distanceMeters)
        .slice(0, limit);

      return NextResponse.json({
        caterers: caterersWithDistance,
        userLocation,
        radius,
        total: caterersWithDistance.length,
      });
    }
  } catch (error: any) {
    console.error("Nearby API Error:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to fetch nearby locations" },
      { status: 500 }
    );
  }
}
