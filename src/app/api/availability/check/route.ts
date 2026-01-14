import { NextResponse } from "next/server";
import prisma from "@/lib/db";

/**
 * Check availability for a venue or caterer on a specific date
 * GET /api/availability/check?venueId=xxx&date=2024-01-15
 * GET /api/availability/check?catererId=xxx&date=2024-01-15
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get("venueId");
    const catererId = searchParams.get("catererId");
    const dateStr = searchParams.get("date");

    // Validation
    if (!dateStr) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 }
      );
    }

    if (!venueId && !catererId) {
      return NextResponse.json(
        { error: "Either venueId or catererId is required" },
        { status: 400 }
      );
    }

    if (venueId && catererId) {
      return NextResponse.json(
        { error: "Cannot check both venue and caterer at the same time" },
        { status: 400 }
      );
    }

    const date = new Date(dateStr);
    
    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return NextResponse.json({
        available: false,
        reason: "Date is in the past",
      });
    }

    // Check minimum advance booking (7 days)
    const minAdvanceDays = 7;
    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() + minAdvanceDays);
    
    if (date < minDate) {
      return NextResponse.json({
        available: false,
        reason: `Minimum ${minAdvanceDays} days advance booking required`,
      });
    }

    // Check if date is blocked
    const blockedDate = await prisma.blockedDate.findFirst({
      where: {
        date: date,
        ...(venueId ? { venueId } : { catererId }),
      },
    });

    if (blockedDate) {
      return NextResponse.json({
        available: false,
        reason: blockedDate.isOnlineBooking
          ? "Already booked"
          : blockedDate.reason || "Date not available",
        blockedDate: {
          id: blockedDate.id,
          isOnlineBooking: blockedDate.isOnlineBooking,
        },
      });
    }

    // Check buffer dates (1 day before and after)
    const dayBefore = new Date(date);
    dayBefore.setDate(dayBefore.getDate() - 1);
    const dayAfter = new Date(date);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const bufferConflicts = await prisma.blockedDate.findMany({
      where: {
        date: { in: [dayBefore, dayAfter] },
        ...(venueId ? { venueId } : { catererId }),
        isOnlineBooking: true, // Only consider actual bookings for buffer
      },
    });

    if (bufferConflicts.length > 0) {
      return NextResponse.json({
        available: true,
        warning: "Adjacent dates are booked. Consider checking with owner for preparation/cleanup time.",
      });
    }

    return NextResponse.json({
      available: true,
      message: "Date is available for booking",
    });
  } catch (error) {
    console.error("Availability check error:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}
