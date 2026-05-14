import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { PriceMode } from "@prisma/client";
import { normalizeGoogleMapsUrl, parseGoogleMapsUrl } from "@/lib/utils";

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
      },
      orderBy: [
        { isVerified: "asc" }, // Unverified first
        { createdAt: "desc" },
      ],
    });

    // Fetch tagged owners for venues that have taggedToOwnerId
    const taggedOwnerIds = venues
      .filter(v => v.taggedToOwnerId)
      .map(v => v.taggedToOwnerId as string);
    
    const taggedOwners = taggedOwnerIds.length > 0 
      ? await prisma.user.findMany({
          where: { id: { in: taggedOwnerIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
    
    const taggedOwnerMap = new Map(taggedOwners.map(u => [u.id, u]));
    
    const venuesWithTaggedOwner = venues.map(v => ({
      ...v,
      taggedToOwner: v.taggedToOwnerId ? taggedOwnerMap.get(v.taggedToOwnerId) || null : null,
    }));

    return NextResponse.json({ success: true, venues: venuesWithTaggedOwner });
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
      latitude,
      longitude,
      googleMapsUrl,
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

    const normalizedGoogleMapsUrl = normalizeGoogleMapsUrl(googleMapsUrl);
    if (googleMapsUrl && !normalizedGoogleMapsUrl) {
      return NextResponse.json(
        { error: "Invalid maps URL. Use a valid https://maps.google.com, https://maps.app.goo.gl, or https://maps.olacabs.com link." },
        { status: 400 }
      );
    }

    const parsedMinGuests = Number(minGuests);
    const parsedMaxGuests = Number(maxGuests);
    if (!Number.isFinite(parsedMinGuests) || !Number.isFinite(parsedMaxGuests) || parsedMinGuests <= 0 || parsedMaxGuests <= 0 || parsedMinGuests > parsedMaxGuests) {
      return NextResponse.json(
        { error: "Guest capacity is invalid. Ensure min guests is less than or equal to max guests." },
        { status: 400 }
      );
    }

    const parsedEstimatedMinPrice = estimatedMinPrice ? Number(estimatedMinPrice) : null;
    const parsedEstimatedMaxPrice = estimatedMaxPrice ? Number(estimatedMaxPrice) : null;
    if (
      parsedEstimatedMinPrice !== null &&
      parsedEstimatedMaxPrice !== null &&
      parsedEstimatedMinPrice > parsedEstimatedMaxPrice
    ) {
      return NextResponse.json(
        { error: "Estimated price range is invalid. Min estimate must be less than or equal to max estimate." },
        { status: 400 }
      );
    }

    const fallbackCoords = normalizedGoogleMapsUrl ? parseGoogleMapsUrl(normalizedGoogleMapsUrl) : null;
    const parsedLatitude = latitude ? parseFloat(latitude) : fallbackCoords?.latitude ?? null;
    const parsedLongitude = longitude ? parseFloat(longitude) : fallbackCoords?.longitude ?? null;

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
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        minGuests: parsedMinGuests,
        maxGuests: parsedMaxGuests,
        priceMode: (priceMode as PriceMode) || PriceMode.ESTIMATED,
        estimatedMinPrice: parsedEstimatedMinPrice,
        estimatedMaxPrice: parsedEstimatedMaxPrice,
        primeDayPrice: primeDayPrice ? parseFloat(primeDayPrice) : null,
        nonPrimeDayPrice: nonPrimeDayPrice ? parseFloat(nonPrimeDayPrice) : null,
        primeDays: primeDays || "",
        marriagePrice: body.marriagePrice ? parseFloat(body.marriagePrice) : null,
        birthdayPrice: body.birthdayPrice ? parseFloat(body.birthdayPrice) : null,
        otherEventPrice: body.otherEventPrice ? parseFloat(body.otherEventPrice) : null,
        contactName: contactName || "",
        contactNumber: contactNumber || "",
        googleMapsUrl: normalizedGoogleMapsUrl,
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
