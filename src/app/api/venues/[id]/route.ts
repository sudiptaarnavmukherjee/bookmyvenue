import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const venue = await prisma.venue.findUnique({
      where: {
        id: params.id,
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

    if (!venue) {
      return NextResponse.json(
        { error: "Venue not found" },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.venue.update({
      where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  try {
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
  { params }: { params: { id: string } }
) {
  try {
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
