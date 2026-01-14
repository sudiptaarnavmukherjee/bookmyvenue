import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: Request,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const params = await segmentData.params;
    const idOrSlug = params.id;

    // Try to find by ID first, then by slug
    let venue = await prisma.venue.findUnique({
      where: {
        id: idOrSlug,
      },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
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
          },
          select: {
            eventDate: true,
          },
        },
      },
    });

    // If not found by ID, try by slug
    if (!venue) {
      venue = await prisma.venue.findUnique({
        where: {
          slug: idOrSlug,
        },
        include: {
          owner: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
          reviews: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
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
            },
            select: {
              eventDate: true,
            },
          },
        },
      });
    }

    if (!venue) {
      return NextResponse.json(
        { error: "Venue not found" },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.venue.update({
      where: { id: venue.id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ venue });
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
