// Admin Cancellation Requests Management API
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendCancellationSMS } from "@/lib/sms";
import { sendCancellationEmail } from "@/lib/email-templates";

// GET /api/admin/cancellations - List all cancellation requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // PENDING, APPROVED, REJECTED
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const [cancellations, total] = await Promise.all([
      prisma.cancellationRequest.findMany({
        where,
        include: {
          booking: {
            include: {
              user: {
                select: { id: true, name: true, email: true, phone: true },
              },
              venue: {
                select: { id: true, name: true, owner: { select: { name: true, email: true } } },
              },
              caterer: {
                select: { id: true, name: true, owner: { select: { name: true, email: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.cancellationRequest.count({ where }),
    ]);

    // Format for response
    const formatted = cancellations.map((c) => ({
      id: c.id,
      bookingId: c.bookingId,
      bookingNumber: c.booking.bookingNumber,
      customerName: c.booking.user.name,
      customerEmail: c.booking.user.email,
      customerPhone: c.booking.user.phone,
      entityName: c.booking.venue?.name || c.booking.caterer?.name,
      entityType: c.booking.venue ? "VENUE" : "CATERER",
      ownerName: c.booking.venue?.owner.name || c.booking.caterer?.owner.name,
      ownerEmail: c.booking.venue?.owner.email || c.booking.caterer?.owner.email,
      eventDate: c.booking.eventDate,
      totalAmount: c.booking.totalAmount,
      paidAmount: c.booking.advanceAmount || 0,
      refundAmount: c.refundAmount,
      refundPercentage: c.refundPercentage,
      reason: c.reason,
      requestedBy: c.requestedBy,
      status: c.status,
      createdAt: c.createdAt,
      approvedAt: c.approvedAt,
      refundedAt: c.refundedAt,
    }));

    return NextResponse.json({
      cancellations: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get cancellation requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cancellation requests" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/cancellations - Approve/Reject cancellation
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { id, action, reason, adjustedRefundAmount } = body;

    if (!id || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be APPROVE or REJECT" },
        { status: 400 }
      );
    }

    // Get cancellation request
    const cancellation = await prisma.cancellationRequest.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            user: true,
            venue: true,
            caterer: true,
          },
        },
      },
    });

    if (!cancellation) {
      return NextResponse.json(
        { error: "Cancellation request not found" },
        { status: 404 }
      );
    }

    if (cancellation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Cancellation request already processed" },
        { status: 400 }
      );
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";
    const finalRefundAmount = adjustedRefundAmount ?? cancellation.refundAmount;

    // Update cancellation request
    const updatedCancellation = await prisma.cancellationRequest.update({
      where: { id },
      data: {
        status: newStatus,
        processedBy: session.user.id,
        approvedAt: new Date(),
        processedAt: new Date(),
        refundAmount: finalRefundAmount,
        processNotes: reason,
      },
    });

    // If approved, update booking status and send notifications
    if (action === "APPROVE") {
      await prisma.$transaction([
        prisma.booking.update({
          where: { id: cancellation.bookingId },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
          },
        }),
        // Remove blocked date
        prisma.blockedDate.deleteMany({
          where: {
            bookingId: cancellation.bookingId,
            isOnlineBooking: true,
          },
        }),
      ]);

      // Send notifications
      const customer = cancellation.booking.user;
      const bookingNumber = cancellation.booking.bookingNumber || 
        cancellation.booking.id.slice(-8).toUpperCase();
      const venueName = cancellation.booking.venue?.name || 
        cancellation.booking.caterer?.name || "Venue";

      if (customer.phone) {
        await sendCancellationSMS({
          bookingId: cancellation.bookingId,
          customerPhone: customer.phone,
          customerName: customer.name || "Customer",
          bookingNumber,
          refundAmount: finalRefundAmount > 0 ? finalRefundAmount : undefined,
        });
      }

      if (customer.email) {
        await sendCancellationEmail({
          to: customer.email,
          customerName: customer.name || "Customer",
          bookingNumber,
          venueName,
          refundAmount: finalRefundAmount > 0 ? finalRefundAmount : undefined,
          cancellationReason: cancellation.reason,
        });
      }
    }

    return NextResponse.json({
      success: true,
      cancellation: updatedCancellation,
      message: action === "APPROVE" 
        ? "Cancellation approved and customer notified"
        : "Cancellation request rejected",
    });
  } catch (error) {
    console.error("Process cancellation error:", error);
    return NextResponse.json(
      { error: "Failed to process cancellation" },
      { status: 500 }
    );
  }
}
