import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const area = searchParams.get("area");
    const isPureVeg = searchParams.get("isPureVeg");
    const sortBy = searchParams.get("sortBy") || "newest";
    const limit = searchParams.get("limit");
    const search = searchParams.get("search");

    const where: any = {
      isActive: true,
      // Show both verified caterers AND admin-listed fishbowl caterers
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
            { cuisines: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    if (isPureVeg !== null && isPureVeg !== undefined && isPureVeg !== "") {
      where.isPureVeg = isPureVeg === "true";
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
      take: limit ? parseInt(limit) : undefined,
    });

    // Apply sorting
    let sortedCaterers = [...caterers];
    
    switch (sortBy) {
      case "area":
        sortedCaterers.sort((a, b) => {
          const aPriority = areaPriorityMap.get(a.area?.toLowerCase() || "") || 0;
          const bPriority = areaPriorityMap.get(b.area?.toLowerCase() || "") || 0;
          if (bPriority !== aPriority) return bPriority - aPriority;
          return (b.viewCount || 0) - (a.viewCount || 0);
        });
        break;
      case "price-low":
        sortedCaterers.sort((a, b) => {
          const aPrice = a.silverPrice || a.minPlatePrice || 0;
          const bPrice = b.silverPrice || b.minPlatePrice || 0;
          return aPrice - bPrice;
        });
        break;
      case "price-high":
        sortedCaterers.sort((a, b) => {
          const aPrice = a.platinumPrice || a.minPlatePrice || 0;
          const bPrice = b.platinumPrice || b.minPlatePrice || 0;
          return bPrice - aPrice;
        });
        break;
      case "popular":
        sortedCaterers.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
        break;
      case "rating":
        sortedCaterers.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "newest":
      default:
        sortedCaterers.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return NextResponse.json({ 
      caterers: sortedCaterers, 
      areas,
      total: sortedCaterers.length 
    });
  } catch (error: any) {
    console.error("Error fetching caterers:", error?.message || error);
    return NextResponse.json(
      { 
        error: "Failed to fetch caterers",
        details: error?.message,
        caterers: [],
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
        cuisines: Array.isArray(cuisines) ? cuisines.join(',') : (cuisines || ''),
        images: Array.isArray(images) ? images.join(',') : (images || ''),
        coverImage: coverImage || (Array.isArray(images) ? images[0] : '') || "",
        owner: {
          connect: { id: ownerId }
        },
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
