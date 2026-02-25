import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// Cache headers for caterer detail
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
};

export async function GET(
  request: Request,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const params = await segmentData.params;
    const idOrSlug = params.id;

    // Use findFirst with OR condition - single query instead of two
    const caterer = await prisma.caterer.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug },
        ],
        isActive: true,
      },
      include: {
        owner: {
          select: {
            name: true,
            phone: true,
          },
        },
        packages: {
          orderBy: {
            pricePerPlate: "asc",
          },
          take: 10, // Limit packages
        },
        reviews: {
          take: 10, // Limit reviews
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            reviews: true,
            bookings: true,
          },
        },
      },
    });

    if (!caterer) {
      return NextResponse.json(
        { error: "Caterer not found" },
        { status: 404, headers: CACHE_HEADERS }
      );
    }

    // Increment view count in background - non-blocking
    prisma.caterer.update({
      where: { id: caterer.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    return NextResponse.json({ caterer }, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error("Error fetching caterer:", error);
    return NextResponse.json(
      { error: "Failed to fetch caterer" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const params = await segmentData.params;
    const body = await request.json();
    
    const caterer = await prisma.caterer.update({
      where: {
        id: params.id,
      },
      data: body,
    });

    return NextResponse.json({ caterer });
  } catch (error) {
    console.error("Error updating caterer:", error);
    return NextResponse.json(
      { error: "Failed to update caterer" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const params = await segmentData.params;

    await prisma.caterer.update({
      where: {
        id: params.id,
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({ message: "Caterer deleted successfully" });
  } catch (error) {
    console.error("Error deleting caterer:", error);
    return NextResponse.json(
      { error: "Failed to delete caterer" },
      { status: 500 }
    );
  }
}
