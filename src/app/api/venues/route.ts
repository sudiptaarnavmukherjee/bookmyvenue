import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// Cache headers - 30 second cache with stale-while-revalidate
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
};

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const area = searchParams.get("area");
    const minGuests = searchParams.get("minGuests");
    const maxPrice = searchParams.get("maxPrice");
    const sortBy = searchParams.get("sortBy") || searchParams.get("sort") || "newest";
    const limit = searchParams.get("limit");
    const search = searchParams.get("search");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const date = searchParams.get("date");

    const where: any = {
      isActive: true,
      deletedAt: null,
      // Show both verified venues AND admin-listed fishbowl venues
      OR: [
        { isVerified: true },
        { isAdminListed: true },
      ],
    };

    if (city) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { city: { contains: city, mode: "insensitive" } },
            { area: { contains: city, mode: "insensitive" } },
          ],
        },
      ];
    }

    if (area) {
      where.area = {
        contains: area,
        mode: "insensitive",
      };
    }

    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
            { area: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    if (minGuests) {
      where.maxGuests = {
        gte: parseInt(minGuests),
      };
    }

    if (maxPrice) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { exactPrice: { lte: parseFloat(maxPrice) } },
            { estimatedMaxPrice: { lte: parseFloat(maxPrice) } },
            { primeDayPrice: { lte: parseFloat(maxPrice) } },
          ],
        },
      ];
    }

    // Fetch areas for sorting
    let areas: any[] = [];
    try {
      areas = await prisma.area.findMany({
        select: { name: true, priority: true },
        orderBy: { priority: "desc" },
      });
    } catch {
      // Area table might not exist, continue without it
    }
    const areaPriorityMap = new Map(areas.map(a => [a.name.toLowerCase(), a.priority]));

    const venues = await prisma.venue.findMany({
      where,
      include: {
        owner: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            bookings: true,
          },
        },
      },
      take: limit ? parseInt(limit) : undefined,
    });

    // Apply sorting
    let sortedVenues = [...venues];
    const userLat = lat ? parseFloat(lat) : null;
    const userLng = lng ? parseFloat(lng) : null;
    
    // Calculate distances if lat/lng provided
    const venuesWithDistance = sortedVenues.map(venue => {
      let distanceKm: number | null = null;
      let distanceText: string | null = null;
      
      if (userLat && userLng && venue.latitude && venue.longitude) {
        distanceKm = calculateDistance(userLat, userLng, venue.latitude, venue.longitude);
        distanceText = formatDistance(distanceKm);
      }
      
      return {
        ...venue,
        distanceKm,
        distanceText,
      };
    });
    
    switch (sortBy) {
      case "nearby":
        // Sort by distance (closest first)
        venuesWithDistance.sort((a, b) => {
          if (a.distanceKm === null && b.distanceKm === null) return 0;
          if (a.distanceKm === null) return 1;
          if (b.distanceKm === null) return -1;
          return a.distanceKm - b.distanceKm;
        });
        break;
      case "area":
        venuesWithDistance.sort((a, b) => {
          const aPriority = areaPriorityMap.get(a.area?.toLowerCase() || "") || 0;
          const bPriority = areaPriorityMap.get(b.area?.toLowerCase() || "") || 0;
          if (bPriority !== aPriority) return bPriority - aPriority;
          return (b.viewCount || 0) - (a.viewCount || 0);
        });
        break;
      case "price-low":
        venuesWithDistance.sort((a, b) => {
          const aPrice = a.exactPrice || a.estimatedMinPrice || a.nonPrimeDayPrice || 0;
          const bPrice = b.exactPrice || b.estimatedMinPrice || b.nonPrimeDayPrice || 0;
          return aPrice - bPrice;
        });
        break;
      case "price-high":
        venuesWithDistance.sort((a, b) => {
          const aPrice = a.exactPrice || a.estimatedMaxPrice || a.primeDayPrice || 0;
          const bPrice = b.exactPrice || b.estimatedMaxPrice || b.primeDayPrice || 0;
          return bPrice - aPrice;
        });
        break;
      case "popular":
        venuesWithDistance.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
        break;
      case "newest":
      default:
        venuesWithDistance.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return NextResponse.json({ 
      venues: venuesWithDistance, 
      areas,
      total: sortedVenues.length 
    }, { headers: CACHE_HEADERS });
  } catch (error: any) {
    console.error("Error fetching venues:", error?.message || error);
    return NextResponse.json(
      { 
        error: "Failed to fetch venues", 
        details: error?.message,
        venues: [],
        areas: []
      },
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      city,
      area,
      address,
      pincode,
      priceMode,
      exactPrice,
      estimatedMinPrice,
      estimatedMaxPrice,
      minGuests,
      maxGuests,
      images,
      coverImage,
      amenities,
      venueType,
      ownerId,
    } = body;

    // Validation
    if (!name || !city || !address || !minGuests || !maxGuests || !ownerId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + "-" + city.toLowerCase();

    const venue = await prisma.venue.create({
      data: {
        name,
        slug,
        description: description || "",
        city,
        area,
        address,
        pincode,
        priceMode,
        exactPrice: exactPrice ? parseFloat(exactPrice) : null,
        estimatedMinPrice: estimatedMinPrice ? parseFloat(estimatedMinPrice) : null,
        estimatedMaxPrice: estimatedMaxPrice ? parseFloat(estimatedMaxPrice) : null,
        minGuests: parseInt(minGuests),
        maxGuests: parseInt(maxGuests),
        images: Array.isArray(images) ? images.join(',') : (images || ''),
        videos: '',
        offlineBookings: '',
        coverImage: coverImage || (Array.isArray(images) ? images[0] : '') || "",
        amenities: Array.isArray(amenities) ? amenities.join(',') : (amenities || ''),
        venueType,
        owner: {
          connect: { id: ownerId }
        },
        isVerified: false, // Admin needs to verify
        isActive: true,
      },
    });

    return NextResponse.json({ venue }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating venue:", error);
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A venue with this name already exists in this city" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create venue" },
      { status: 500 }
    );
  }
}
