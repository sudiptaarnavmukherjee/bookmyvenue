import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const minGuests = searchParams.get("minGuests");
    const maxPrice = searchParams.get("maxPrice");

    const where: any = {
      isActive: true,
      isVerified: true,
    };

    if (city) {
      where.city = city;
    }

    if (minGuests) {
      where.maxGuests = {
        gte: parseInt(minGuests),
      };
    }

    if (maxPrice) {
      where.OR = [
        { exactPrice: { lte: parseFloat(maxPrice) } },
        { estimatedMaxPrice: { lte: parseFloat(maxPrice) } },
      ];
    }

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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ venues });
  } catch (error: any) {
    console.error("Error fetching venues:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to fetch venues", details: error?.message },
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
