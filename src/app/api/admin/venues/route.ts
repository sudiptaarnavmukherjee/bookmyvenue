import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { PriceMode } from "@prisma/client";

// GET all venues for admin (including unverified)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const venues = await prisma.venue.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        taggedToOwner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { isVerified: "asc" }, // Unverified first
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ success: true, venues });
  } catch (error) {
    console.error("Error fetching venues for admin:", error);
    return NextResponse.json(
      { error: "Failed to fetch venues" },
      { status: 500 }
    );
  }
}

// POST - Admin creates a fishbowl venue
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      venueType,
      city,
      area,
      address,
      pincode,
      minGuests,
      maxGuests,
      priceMode,
      estimatedMinPrice,
      estimatedMaxPrice,
      primeDayPrice,
      nonPrimeDayPrice,
      primeDays,
      contactName,
      contactNumber,
      images,
      coverImage,
      amenities,
    } = body;

    // Validation
    if (!name || !city || !address || !minGuests || !maxGuests) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate unique slug
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const uniqueSlug = `${baseSlug}-${area?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || city.toLowerCase()}-${Date.now().toString(36)}`;

    // Create the fishbowl venue
    const venue = await prisma.venue.create({
      data: {
        name,
        slug: uniqueSlug,
        description: description || "",
        venueType,
        city,
        area: area || "",
        address,
        pincode: pincode || "",
        minGuests: parseInt(minGuests),
        maxGuests: parseInt(maxGuests),
        priceMode: (priceMode as PriceMode) || PriceMode.ESTIMATED,
        estimatedMinPrice: estimatedMinPrice ? parseFloat(estimatedMinPrice) : null,
        estimatedMaxPrice: estimatedMaxPrice ? parseFloat(estimatedMaxPrice) : null,
        primeDayPrice: primeDayPrice ? parseFloat(primeDayPrice) : null,
        nonPrimeDayPrice: nonPrimeDayPrice ? parseFloat(nonPrimeDayPrice) : null,
        primeDays: primeDays || "",
        contactName: contactName || "",
        contactNumber: contactNumber || "",
        images: images || "",
        coverImage: coverImage || (images ? images.split(",")[0].trim() : ""),
        videos: "",
        amenities: amenities || "",
        offlineBookings: "",
        // Fishbowl flags
        isAdminListed: true,
        bookingEnabled: false,
        isVerified: false,
        isActive: true,
        // Admin is the owner initially (can be tagged to real owner later)
        owner: { connect: { id: session.user.id } },
      },
    });

    return NextResponse.json({ 
      success: true, 
      venue,
      message: "Fishbowl venue created successfully" 
    });
  } catch (error: any) {
    console.error("Error creating fishbowl venue:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create venue" },
      { status: 500 }
    );
  }
}
