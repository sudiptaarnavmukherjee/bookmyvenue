import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// Cache headers for venue detail - cache for 60 seconds
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
    const venue = await prisma.venue.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug },
        ],
        isActive: true,
        deletedAt: null,
      },
      include: {
        owner: {
          select: {
            name: true,
            phone: true,
          },
        },
        // Limit reviews to most recent 10 for performance
        reviews: {
          take: 10,
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
        bookings: {
          where: {
            status: "CONFIRMED",
            eventDate: { gte: new Date() }, // Only future bookings
          },
          select: {
            eventDate: true,
          },
          take: 50,
        },
        _count: {
          select: {
            reviews: true,
            bookings: true,
          },
        },
      },
    });

    if (!venue) {
      return NextResponse.json(
        { error: "Venue not found" },
        { status: 404, headers: CACHE_HEADERS }
      );
    }

    // Increment view count in background - DON'T AWAIT (non-blocking)
    prisma.venue.update({
      where: { id: venue.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {}); // Ignore errors silently

    return NextResponse.json({ venue }, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error("Error fetching venue:", error);
    return NextResponse.json(
      { error: "Failed to fetch venue" },
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
    
    const venue = await prisma.venue.update({
      where: {
        id: params.id,
      },
      data: body,
    });

    return NextResponse.json({ venue });
  } catch (error) {
    console.error("Error updating venue:", error);
    return NextResponse.json(
      { error: "Failed to update venue" },
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
    // Soft delete
    await prisma.venue.update({
      where: {
        id: params.id,
      },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    return NextResponse.json({ message: "Venue deleted successfully" });
  } catch (error) {
    console.error("Error deleting venue:", error);
    return NextResponse.json(
      { error: "Failed to delete venue" },
      { status: 500 }
    );
  }
}
