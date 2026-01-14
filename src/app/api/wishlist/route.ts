import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/wishlist - Get user's wishlist
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const wishlistItems = await prisma.wishlist.findMany({
      where: { userId: user.id },
      include: {
        venue: {
          select: {
            id: true,
            slug: true,
            name: true,
            city: true,
            area: true,
            exactPrice: true,
            estimatedMinPrice: true,
            estimatedMaxPrice: true,
            coverImage: true,
            images: true,
            maxGuests: true,
            isVerified: true,
            _count: {
              select: {
                reviews: true,
              },
            },
          },
        },
        caterer: {
          select: {
            id: true,
            slug: true,
            name: true,
            city: true,
            minPlatePrice: true,
            coverImage: true,
            images: true,
            isPureVeg: true,
            isMultiCuisine: true,
            cuisines: true,
            _count: {
              select: {
                reviews: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ wishlist: wishlistItems });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}

// POST /api/wishlist - Add to wishlist
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { venueId, catererId } = body;

    // Validate that exactly one is provided
    if ((!venueId && !catererId) || (venueId && catererId)) {
      return NextResponse.json(
        { error: "Provide either venueId or catererId, not both" },
        { status: 400 }
      );
    }

    // Check if already in wishlist
    const existing = await prisma.wishlist.findFirst({
      where: {
        userId: user.id,
        ...(venueId ? { venueId } : { catererId }),
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already in wishlist" },
        { status: 409 }
      );
    }

    // Add to wishlist
    const wishlistItem = await prisma.wishlist.create({
      data: {
        userId: user.id,
        ...(venueId ? { venueId } : { catererId }),
      },
      include: {
        venue: {
          select: {
            id: true,
            slug: true,
            name: true,
            city: true,
          },
        },
        caterer: {
          select: {
            id: true,
            slug: true,
            name: true,
            city: true,
          },
        },
      },
    });

    return NextResponse.json({ 
      message: "Added to wishlist",
      wishlistItem 
    });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return NextResponse.json(
      { error: "Failed to add to wishlist" },
      { status: 500 }
    );
  }
}

// DELETE /api/wishlist - Remove from wishlist
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get("venueId");
    const catererId = searchParams.get("catererId");

    // Validate that exactly one is provided
    if ((!venueId && !catererId) || (venueId && catererId)) {
      return NextResponse.json(
        { error: "Provide either venueId or catererId, not both" },
        { status: 400 }
      );
    }

    // Remove from wishlist
    await prisma.wishlist.deleteMany({
      where: {
        userId: user.id,
        ...(venueId ? { venueId } : { catererId }),
      },
    });

    return NextResponse.json({ 
      message: "Removed from wishlist" 
    });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return NextResponse.json(
      { error: "Failed to remove from wishlist" },
      { status: 500 }
    );
  }
}
