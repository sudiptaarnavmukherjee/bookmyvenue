import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * Get blocked dates for a venue or caterer
 * GET /api/availability/blocked-dates?venueId=xxx
 * GET /api/availability/blocked-dates?catererId=xxx
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get("venueId");
    const catererId = searchParams.get("catererId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!venueId && !catererId) {
      return NextResponse.json(
        { error: "Either venueId or catererId is required" },
        { status: 400 }
      );
    }

    const whereClause: any = {
      ...(venueId ? { venueId } : { catererId }),
    };

    // Filter by date range if provided
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const blockedDates = await prisma.blockedDate.findMany({
      where: whereClause,
      orderBy: { date: "asc" },
      select: {
        id: true,
        date: true,
        reason: true,
        isOnlineBooking: true,
        bookingId: true,
      },
    });

    return NextResponse.json({ blockedDates });
  } catch (error) {
    console.error("Get blocked dates error:", error);
    return NextResponse.json(
      { error: "Failed to fetch blocked dates" },
      { status: 500 }
    );
  }
}

/**
 * Block a date (owner only)
 * POST /api/availability/blocked-dates
 * Body: { venueId?: string, catererId?: string, date: string, reason?: string }
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "VENUE_OWNER" && user.role !== "CATERING_OWNER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { venueId, catererId, date, reason } = body;

    // Validation
    if (!venueId && !catererId) {
      return NextResponse.json(
        { error: "Either venueId or catererId is required" },
        { status: 400 }
      );
    }

    if (venueId && catererId) {
      return NextResponse.json(
        { error: "Cannot block both venue and caterer at the same time" },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    if (venueId) {
      const venue = await prisma.venue.findUnique({
        where: { id: venueId },
      });

      if (!venue) {
        return NextResponse.json(
          { error: "Venue not found" },
          { status: 404 }
        );
      }

      if (venue.ownerId !== user.id && user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (catererId) {
      const caterer = await prisma.caterer.findUnique({
        where: { id: catererId },
      });

      if (!caterer) {
        return NextResponse.json(
          { error: "Caterer not found" },
          { status: 404 }
        );
      }

      if (caterer.ownerId !== user.id && user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Check if already blocked
    const existing = await prisma.blockedDate.findFirst({
      where: {
        date: new Date(date),
        ...(venueId ? { venueId } : { catererId }),
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Date is already blocked" },
        { status: 409 }
      );
    }

    // Create blocked date
    const blockedDate = await prisma.blockedDate.create({
      data: {
        date: new Date(date),
        reason: reason || "Blocked by owner",
        isOnlineBooking: false,
        blockedBy: user.id,
        ...(venueId ? { venueId } : { catererId }),
      },
    });

    return NextResponse.json({ blockedDate }, { status: 201 });
  } catch (error) {
    console.error("Block date error:", error);
    return NextResponse.json(
      { error: "Failed to block date" },
      { status: 500 }
    );
  }
}

/**
 * Unblock a date (owner only)
 * DELETE /api/availability/blocked-dates?id=xxx
 */
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "VENUE_OWNER" && user.role !== "CATERING_OWNER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Blocked date ID is required" },
        { status: 400 }
      );
    }

    const blockedDate = await prisma.blockedDate.findUnique({
      where: { id },
      include: {
        venue: true,
        caterer: true,
      },
    });

    if (!blockedDate) {
      return NextResponse.json(
        { error: "Blocked date not found" },
        { status: 404 }
      );
    }

    // Can't delete dates that are from online bookings
    if (blockedDate.isOnlineBooking) {
      return NextResponse.json(
        { error: "Cannot unblock dates from confirmed bookings. Cancel the booking instead." },
        { status: 400 }
      );
    }

    // Verify ownership
    const isOwner =
      (blockedDate.venue && blockedDate.venue.ownerId === user.id) ||
      (blockedDate.caterer && blockedDate.caterer.ownerId === user.id);

    if (!isOwner && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.blockedDate.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Date unblocked successfully" });
  } catch (error) {
    console.error("Unblock date error:", error);
    return NextResponse.json(
      { error: "Failed to unblock date" },
      { status: 500 }
    );
  }
}
