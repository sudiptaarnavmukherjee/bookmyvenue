import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const isPureVeg = searchParams.get("isPureVeg");

    const where: any = {
      isActive: true,
      isVerified: true,
    };

    if (city) {
      where.city = city;
    }

    if (isPureVeg !== null) {
      where.isPureVeg = isPureVeg === "true";
    }

    const caterers = await prisma.caterer.findMany({
      where,
      include: {
        owner: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        packages: {
          orderBy: {
            pricePerPlate: "asc",
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
        rating: "desc",
      },
    });

    return NextResponse.json({ caterers });
  } catch (error) {
    console.error("Error fetching caterers:", error);
    return NextResponse.json(
      { error: "Failed to fetch caterers" },
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
      address,
      phone,
      minPlatePrice,
      isPureVeg,
      isMultiCuisine,
      cuisines,
      images,
      coverImage,
      ownerId,
      packages,
    } = body;

    // Validation
    if (!name || !city || !address || !phone || !minPlatePrice || !ownerId) {
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

    const caterer = await prisma.caterer.create({
      data: {
        name,
        slug,
        description: description || "",
        city,
        address,
        phone,
        minPlatePrice: parseFloat(minPlatePrice),
        isPureVeg: isPureVeg || false,
        isMultiCuisine: isMultiCuisine || true,
        cuisines: cuisines || [],
        images: images || [],
        coverImage: coverImage || images?.[0] || "",
        ownerId,
        isVerified: false, // Admin needs to verify
        isActive: true,
        packages: packages
          ? {
              create: packages.map((pkg: any) => ({
                tier: pkg.tier,
                name: pkg.name,
                description: pkg.description,
                pricePerPlate: parseFloat(pkg.pricePerPlate),
                itemCount: parseInt(pkg.itemCount),
                items: pkg.items,
              })),
            }
          : undefined,
      },
      include: {
        packages: true,
      },
    });

    return NextResponse.json({ caterer }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating caterer:", error);
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A caterer with this name already exists in this city" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create caterer" },
      { status: 500 }
    );
  }
}
