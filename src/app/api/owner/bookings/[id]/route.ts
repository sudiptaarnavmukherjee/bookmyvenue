import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PaymentStatus } from "@prisma/client";

type OwnerAction = "CONFIRM_BOOKING" | "REQUEST_CANCELLATION" | "ADD_DISPUTE_NOTE";

const CANCELLATION_POLICY = {
  30: 100,
  15: 75,
  7: 50,
  3: 25,
  0: 0,
};

function calculateRefundAmount(eventDate: Date, paidAmount: number) {
  const daysBeforeEvent = Math.floor(
    (eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  let refundPercentage = 0;
  if (daysBeforeEvent >= 30) refundPercentage = CANCELLATION_POLICY[30];
  else if (daysBeforeEvent >= 15) refundPercentage = CANCELLATION_POLICY[15];
  else if (daysBeforeEvent >= 7) refundPercentage = CANCELLATION_POLICY[7];
  else if (daysBeforeEvent >= 3) refundPercentage = CANCELLATION_POLICY[3];
  else refundPercentage = CANCELLATION_POLICY[0];

  return {
    daysBeforeEvent,
    refundPercentage,
    refundAmount: Math.round((paidAmount * refundPercentage) / 100),
  };
}

function isOwnerOfBooking(
  booking: {
    venue: { ownerId: string } | null;
    caterer: { ownerId: string } | null;
  },
  userId: string
) {
  return booking.venue?.ownerId === userId || booking.caterer?.ownerId === userId;
}

function appendOwnerTrail(params: {
  existing: string | null;
  ownerName: string;
  action: string;
  note?: string;
}) {
  const stamped = `[${new Date().toISOString()}] ${params.ownerName}: ${params.action}${
    params.note ? ` - ${params.note}` : ""
  }`;
  if (!params.existing || params.existing.trim().length === 0) {
    return stamped;
  }
  return `${params.existing}\n${stamped}`;
}

export async function GET(
  _request: Request,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "VENUE_OWNER" && user.role !== "CATERING_OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const params = await segmentData.params;

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        venue: { select: { id: true, name: true, ownerId: true } },
        caterer: { select: { id: true, name: true, ownerId: true } },
        cancellationRequest: true,
        payments: {
          where: { status: PaymentStatus.COMPLETED },
          select: { amount: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (!isOwnerOfBooking(booking, user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const paidAmount = booking.payments.reduce((sum, p) => sum + p.amount, 0);
    const suggestion = calculateRefundAmount(booking.eventDate, paidAmount);

    return NextResponse.json({
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        eventDate: booking.eventDate,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail,
        totalAmount: booking.totalAmount,
        paidAmount,
        ownerNotes: booking.ownerNotes,
        cancellationRequest: booking.cancellationRequest,
      },
      cancellationGuidance: suggestion,
      canConfirm: booking.status === "PENDING",
      canRequestCancellation: booking.status !== "CANCELLED",
    });
  } catch (error) {
    console.error("Owner booking GET error:", error);
    return NextResponse.json({ error: "Failed to fetch owner booking details" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "VENUE_OWNER" && user.role !== "CATERING_OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const params = await segmentData.params;
    const body = (await request.json()) as {
      action?: OwnerAction;
      reason?: string;
      note?: string;
      ownerNote?: string;
      requestedRefundAmount?: number;
    };

    const action = body.action;
    if (!action) {
      return NextResponse.json({ error: "action is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        venue: { select: { id: true, name: true, ownerId: true } },
        caterer: { select: { id: true, name: true, ownerId: true } },
        cancellationRequest: true,
        payments: {
          where: { status: PaymentStatus.COMPLETED },
          select: { amount: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (!isOwnerOfBooking(booking, user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ownerName = user.name || "Owner";

    if (action === "CONFIRM_BOOKING") {
      if (booking.status !== "PENDING") {
        return NextResponse.json(
          { error: "Only pending bookings can be confirmed" },
          { status: 400 }
        );
      }

      const ownerTrail = appendOwnerTrail({
        existing: booking.ownerNotes,
        ownerName,
        action: "Confirmed booking",
        note: body.ownerNote,
      });

      const updatedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date(),
          ownerNotes: ownerTrail,
        },
      });

      await prisma.auditLog.create({
        data: {
          action: "OWNER_BOOKING_CONFIRMED",
          entityType: "BOOKING",
          entityId: booking.id,
          userId: user.id,
          details: {
            bookingNumber: booking.bookingNumber,
            ownerNote: body.ownerNote || null,
          },
        },
      });

      return NextResponse.json({ success: true, booking: updatedBooking });
    }

    if (action === "ADD_DISPUTE_NOTE") {
      const note = (body.note || "").trim();
      if (note.length < 3) {
        return NextResponse.json({ error: "note must be at least 3 characters" }, { status: 400 });
      }

      const ownerTrail = appendOwnerTrail({
        existing: booking.ownerNotes,
        ownerName,
        action: "Added dispute note",
        note,
      });

      const txOps: any[] = [
        prisma.booking.update({
          where: { id: booking.id },
          data: { ownerNotes: ownerTrail },
        }),
      ];

      if (booking.cancellationRequest) {
        const currentProcessNotes = booking.cancellationRequest.processNotes;
        const updatedProcessNotes = appendOwnerTrail({
          existing: currentProcessNotes,
          ownerName,
          action: "Owner dispute note",
          note,
        });

        txOps.push(
          prisma.cancellationRequest.update({
            where: { id: booking.cancellationRequest.id },
            data: { processNotes: updatedProcessNotes },
          })
        );
      }

      const [updatedBooking] = await prisma.$transaction(txOps);

      await prisma.auditLog.create({
        data: {
          action: "OWNER_DISPUTE_NOTE_ADDED",
          entityType: "BOOKING",
          entityId: booking.id,
          userId: user.id,
          details: {
            bookingNumber: booking.bookingNumber,
            note,
            linkedCancellationId: booking.cancellationRequest?.id || null,
          },
        },
      });

      return NextResponse.json({ success: true, booking: updatedBooking });
    }

    if (action === "REQUEST_CANCELLATION") {
      if (booking.status === "CANCELLED") {
        return NextResponse.json({ error: "Booking already cancelled" }, { status: 400 });
      }

      const reason = (body.reason || "").trim();
      if (reason.length < 8) {
        return NextResponse.json(
          { error: "Cancellation reason must be at least 8 characters" },
          { status: 400 }
        );
      }

      if (booking.cancellationRequest && booking.cancellationRequest.status === "PENDING") {
        return NextResponse.json(
          { error: "A cancellation request is already pending for this booking" },
          { status: 400 }
        );
      }

      const paidAmount = booking.payments.reduce((sum, p) => sum + p.amount, 0);
      const suggestion = calculateRefundAmount(booking.eventDate, paidAmount);
      const requestedRefundAmount =
        typeof body.requestedRefundAmount === "number"
          ? Math.max(0, Math.min(body.requestedRefundAmount, paidAmount || body.requestedRefundAmount))
          : suggestion.refundAmount;

      const ownerTrail = appendOwnerTrail({
        existing: booking.ownerNotes,
        ownerName,
        action: "Requested cancellation",
        note: body.ownerNote || reason,
      });

      const payload = {
        reason,
        requestedBy: "OWNER",
        refundAmount: requestedRefundAmount,
        refundPercentage:
          paidAmount > 0 ? Math.round((requestedRefundAmount / paidAmount) * 100) : 0,
        processNotes: appendOwnerTrail({
          existing: null,
          ownerName,
          action: "Owner cancellation request",
          note: body.ownerNote || "",
        }),
      };

      const txOps: any[] = [
        prisma.booking.update({
          where: { id: booking.id },
          data: { ownerNotes: ownerTrail },
        }),
      ];

      if (booking.cancellationRequest) {
        txOps.push(
          prisma.cancellationRequest.update({
            where: { id: booking.cancellationRequest.id },
            data: {
              ...payload,
              status: "PENDING",
              processedAt: null,
              approvedAt: null,
              processedBy: null,
              refundStatus: "PENDING",
              refundId: null,
              refundedAt: null,
            },
          })
        );
      } else {
        txOps.push(
          prisma.cancellationRequest.create({
            data: {
              bookingId: booking.id,
              status: "PENDING",
              ...payload,
            },
          })
        );
      }

      const [, cancellationResult] = await prisma.$transaction(txOps);

      await prisma.auditLog.create({
        data: {
          action: "OWNER_CANCELLATION_REQUESTED",
          entityType: "CANCELLATION",
          entityId: booking.cancellationRequest?.id || (cancellationResult as { id: string }).id,
          userId: user.id,
          details: {
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
            reason,
            requestedRefundAmount,
            suggestedRefundAmount: suggestion.refundAmount,
            daysBeforeEvent: suggestion.daysBeforeEvent,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: "Cancellation request submitted for admin review",
        cancellationRequest: cancellationResult,
      });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    console.error("Owner booking PATCH error:", error);
    return NextResponse.json({ error: "Failed to process owner booking action" }, { status: 500 });
  }
}
