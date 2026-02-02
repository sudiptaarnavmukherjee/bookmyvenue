import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendCancellationSMS } from "@/lib/sms";
import { sendCancellationEmail } from "@/lib/email-templates";

// Cancellation Policy: Define refund percentages based on days before event
const CANCELLATION_POLICY = {
  30: 100,  // 30+ days: Full refund
  15: 75,   // 15-29 days: 75% refund
  7: 50,    // 7-14 days: 50% refund
  3: 25,    // 3-6 days: 25% refund
  0: 0,     // Less than 3 days: No refund
};

// Calculate refund amount based on cancellation policy
function calculateRefundAmount(
  eventDate: Date,
  paidAmount: number,
  cancellationDate: Date = new Date()
): { refundAmount: number; refundPercentage: number; daysBeforeEvent: number } {
  const daysBeforeEvent = Math.floor(
    (eventDate.getTime() - cancellationDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  let refundPercentage = 0;
  
  if (daysBeforeEvent >= 30) {
    refundPercentage = CANCELLATION_POLICY[30];
  } else if (daysBeforeEvent >= 15) {
    refundPercentage = CANCELLATION_POLICY[15];
  } else if (daysBeforeEvent >= 7) {
    refundPercentage = CANCELLATION_POLICY[7];
  } else if (daysBeforeEvent >= 3) {
    refundPercentage = CANCELLATION_POLICY[3];
  } else {
    refundPercentage = CANCELLATION_POLICY[0];
  }

  const refundAmount = Math.round((paidAmount * refundPercentage) / 100);

  return { refundAmount, refundPercentage, daysBeforeEvent };
}

function getRefundMessage(daysBeforeEvent: number, refundPercentage: number): string {
  if (refundPercentage === 100) {
    return `Full refund available (${daysBeforeEvent} days before event)`;
  } else if (refundPercentage === 0) {
    return `No refund available (less than 3 days before event)`;
  } else {
    return `${refundPercentage}% refund available (${daysBeforeEvent} days before event)`;
  }
}

// GET: Get cancellation details & policy
export async function GET(
  request: Request,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await segmentData.params;

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        venue: { include: { owner: true } },
        caterer: { include: { owner: true } },
        cancellationRequest: true,
        payments: {
          where: { status: "COMPLETED" },
          select: { amount: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Calculate paid amount from completed payments
    const paidAmount = booking.payments.reduce((sum, p) => sum + p.amount, 0) || booking.advanceAmount || 0;

    // Check authorization
    const isOwner = booking.userId === user.id;
    const isVenueOwner = booking.venue?.ownerId === user.id;
    const isCatererOwner = booking.caterer?.ownerId === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isVenueOwner && !isCatererOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if already cancelled
    if (booking.status === "CANCELLED") {
      return NextResponse.json({
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          status: booking.status,
          venueName: booking.venue?.name || booking.caterer?.name,
        },
        canCancel: false,
        message: "Booking is already cancelled",
        cancellationRequest: booking.cancellationRequest,
      });
    }

    // Check if event has passed
    if (new Date(booking.eventDate) < new Date()) {
      return NextResponse.json({
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          status: booking.status,
          venueName: booking.venue?.name || booking.caterer?.name,
        },
        canCancel: false,
        message: "Cannot cancel past events",
      });
    }

    // Calculate refund (using paidAmount calculated above)
    const { refundAmount, refundPercentage, daysBeforeEvent } = calculateRefundAmount(
      booking.eventDate,
      paidAmount
    );

    return NextResponse.json({
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        eventDate: booking.eventDate,
        totalAmount: booking.totalAmount,
        paidAmount: paidAmount,
        status: booking.status,
        venueName: booking.venue?.name || booking.caterer?.name,
      },
      canCancel: true,
      cancellationPolicy: {
        daysBeforeEvent,
        refundPercentage,
        refundAmount,
        paidAmount,
        message: getRefundMessage(daysBeforeEvent, refundPercentage),
      },
      cancellationRequest: booking.cancellationRequest,
    });
  } catch (error) {
    console.error("Get cancellation details error:", error);
    return NextResponse.json(
      { error: "Failed to get cancellation details" },
      { status: 500 }
    );
  }
}

// PATCH: Process cancellation
export async function PATCH(
  request: Request,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reason } = body;

    const params = await segmentData.params;

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        venue: { include: { owner: true } },
        caterer: { include: { owner: true } },
        payments: {
          where: { status: "COMPLETED" },
          select: { amount: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Calculate paid amount from completed payments
    const paidAmount = booking.payments.reduce((sum, p) => sum + p.amount, 0) || booking.advanceAmount || 0;

    // Customer or owner can cancel
    const isOwner = booking.userId === user.id;
    const isVenueOwner = booking.venue?.ownerId === user.id;
    const isCatererOwner = booking.caterer?.ownerId === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isVenueOwner && !isCatererOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Check if already cancelled
    if (booking.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Booking is already cancelled" },
        { status: 400 }
      );
    }

    // Calculate refund (using paidAmount calculated above from payments)
    const { refundAmount, refundPercentage } = calculateRefundAmount(
      booking.eventDate,
      paidAmount
    );

    // Determine who requested
    let requestedBy: "CUSTOMER" | "OWNER" | "ADMIN" = "CUSTOMER";
    if (isAdmin) {
      requestedBy = "ADMIN";
    } else if (isVenueOwner || isCatererOwner) {
      requestedBy = "OWNER";
    }

    // For owner-initiated cancellations, provide full refund
    const finalRefundAmount = requestedBy === "OWNER" ? paidAmount : refundAmount;
    const finalRefundPercentage = requestedBy === "OWNER" ? 100 : refundPercentage;

    // Cancel booking, create cancellation record, and unblock the date
    const [updatedBooking, cancellationRequest] = await prisma.$transaction([
      prisma.booking.update({
        where: { id: params.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: reason || "No reason provided",
        },
      }),
      prisma.cancellationRequest.create({
        data: {
          bookingId: booking.id,
          reason: reason || "Cancelled by customer",
          requestedBy,
          refundAmount: finalRefundAmount,
          refundPercentage: finalRefundPercentage,
          status: "APPROVED",
          processedBy: user.id,
          processedAt: new Date(),
          approvedAt: new Date(),
        },
      }),
      // Remove the blocked date
      prisma.blockedDate.deleteMany({
        where: {
          bookingId: params.id,
          isOnlineBooking: true,
        },
      }),
    ]);

    // Send notifications
    const customerName = booking.user.name || "Customer";
    const bookingNumber = booking.bookingNumber || booking.id.slice(-8).toUpperCase();
    const venueName = booking.venue?.name || booking.caterer?.name || "Venue";

    // Send SMS
    if (booking.user.phone) {
      await sendCancellationSMS({
        bookingId: booking.id,
        customerPhone: booking.user.phone,
        customerName,
        bookingNumber,
        refundAmount: finalRefundAmount > 0 ? finalRefundAmount : undefined,
      });
    }

    // Send Email
    if (booking.user.email) {
      await sendCancellationEmail({
        to: booking.user.email,
        customerName,
        bookingNumber,
        venueName,
        refundAmount: finalRefundAmount > 0 ? finalRefundAmount : undefined,
        cancellationReason: reason,
      });
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      cancellationRequest: {
        id: cancellationRequest.id,
        status: cancellationRequest.status,
        refundAmount: cancellationRequest.refundAmount,
        refundPercentage: cancellationRequest.refundPercentage,
        requestedBy: cancellationRequest.requestedBy,
      },
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json(
      { error: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}
