import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const area = searchParams.get("area");
    const minGuests = searchParams.get("minGuests");
    const maxPrice = searchParams.get("maxPrice");
    const sortBy = searchParams.get("sortBy") || "newest";
    const limit = searchParams.get("limit");
    const search = searchParams.get("search");

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
    
    switch (sortBy) {
      case "area":
        sortedVenues.sort((a, b) => {
          const aPriority = areaPriorityMap.get(a.area?.toLowerCase() || "") || 0;
          const bPriority = areaPriorityMap.get(b.area?.toLowerCase() || "") || 0;
          if (bPriority !== aPriority) return bPriority - aPriority;
          return (b.viewCount || 0) - (a.viewCount || 0);
        });
        break;
      case "price-low":
        sortedVenues.sort((a, b) => {
          const aPrice = a.exactPrice || a.estimatedMinPrice || a.nonPrimeDayPrice || 0;
          const bPrice = b.exactPrice || b.estimatedMinPrice || b.nonPrimeDayPrice || 0;
          return aPrice - bPrice;
        });
        break;
      case "price-high":
        sortedVenues.sort((a, b) => {
          const aPrice = a.exactPrice || a.estimatedMaxPrice || a.primeDayPrice || 0;
          const bPrice = b.exactPrice || b.estimatedMaxPrice || b.primeDayPrice || 0;
          return bPrice - aPrice;
        });
        break;
      case "popular":
        sortedVenues.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
        break;
      case "newest":
      default:
        sortedVenues.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return NextResponse.json({ 
      venues: sortedVenues, 
      areas,
      total: sortedVenues.length 
    });
  } catch (error: any) {
    console.error("Error fetching venues:", error?.message || error);
    return NextResponse.json(
      { 
        error: "Failed to fetch venues", 
        details: error?.message,
        venues: [],
        areas: []
      },
      { status: 500 }
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
