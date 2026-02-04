import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// GET all caterers for admin (including unverified)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caterers = await prisma.caterer.findMany({
      where: {
        isActive: true,
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

    // Fetch tagged owners for caterers that have taggedToOwnerId
    const taggedOwnerIds = caterers
      .filter(c => c.taggedToOwnerId)
      .map(c => c.taggedToOwnerId as string);
    
    const taggedOwners = taggedOwnerIds.length > 0 
      ? await prisma.user.findMany({
          where: { id: { in: taggedOwnerIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
    
    const taggedOwnerMap = new Map(taggedOwners.map(u => [u.id, u]));
    
    const caterersWithTaggedOwner = caterers.map(c => ({
      ...c,
      taggedToOwner: c.taggedToOwnerId ? taggedOwnerMap.get(c.taggedToOwnerId) || null : null,
    }));

    return NextResponse.json({ success: true, caterers: caterersWithTaggedOwner });
  } catch (error) {
    console.error("Error fetching caterers for admin:", error);
    return NextResponse.json(
      { error: "Failed to fetch caterers" },
      { status: 500 }
    );
  }
}

// POST - Admin creates a fishbowl caterer
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
      city,
      area,
      address,
      latitude,
      longitude,
      silverPrice,
      goldPrice,
      platinumPrice,
      minPlatePrice,
      isPureVeg,
      cuisines,
      minGuests,
      contactName,
      contactNumber,
      phone,
      images,
      coverImage,
    } = body;

    // Validation - only name and city are truly required
    if (!name || !city) {
      return NextResponse.json(
        { error: "Missing required fields: name and city" },
        { status: 400 }
      );
    }

    // Generate unique slug
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const uniqueSlug = `${baseSlug}-${area?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || city.toLowerCase()}-${Date.now().toString(36)}`;

    // Create the fishbowl caterer
    const caterer = await prisma.caterer.create({
      data: {
        name,
        slug: uniqueSlug,
        description: description || "",
        city,
        area: area || "",
        address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        phone: phone || contactNumber || "",
        minPlatePrice: parseFloat(minPlatePrice || silverPrice) || 0,
        silverPrice: silverPrice ? parseFloat(silverPrice) : null,
        goldPrice: goldPrice ? parseFloat(goldPrice) : null,
        platinumPrice: platinumPrice ? parseFloat(platinumPrice) : null,
        isPureVeg: isPureVeg || false,
        isMultiCuisine: true,
        cuisines: cuisines || "",
        minGuests: parseInt(minGuests) || 100,
        contactName: contactName || "",
        contactNumber: contactNumber || "",
        images: images || "",
        coverImage: coverImage || (images ? images.split(",")[0].trim() : ""),
        // Fishbowl flags
        isAdminListed: true,
        bookingEnabled: false,
        isVerified: false,
        isActive: true,
        // Admin is the owner initially
        owner: { connect: { id: session.user.id } },
      },
    });

    return NextResponse.json({ 
      success: true, 
      caterer,
      message: "Fishbowl caterer created successfully" 
    });
  } catch (error: any) {
    console.error("Error creating fishbowl caterer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create caterer" },
      { status: 500 }
    );
  }
}
