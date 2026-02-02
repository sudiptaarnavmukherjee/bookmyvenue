import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initiateRefund } from "@/lib/razorpay";
import { z } from "zod";

// Validation schema
const refundSchema = z.object({
  paymentId: z.string().min(1, "Payment ID is required"),
  amount: z.number().positive().optional(), // Optional for partial refund
  reason: z.string().min(1, "Reason is required"),
});

// POST /api/payment/refund - Initiate refund
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins or venue owners can initiate refunds
    if (!["ADMIN", "VENUE_OWNER", "CATERING_OWNER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Only admins or owners can process refunds" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = refundSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { paymentId, amount, reason } = validation.data;

    // Find payment record
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            venue: { select: { ownerId: true } },
            caterer: { select: { ownerId: true } },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Verify authorization (admin or venue owner)
    const ownerId = payment.booking.venue?.ownerId || payment.booking.caterer?.ownerId;
    if (session.user.role !== "ADMIN" && session.user.id !== ownerId) {
      return NextResponse.json(
        { error: "Not authorized to refund this payment" },
        { status: 403 }
      );
    }

    // Check if payment can be refunded
    if (payment.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Only completed payments can be refunded" },
        { status: 400 }
      );
    }

    if (!payment.razorpayPaymentId) {
      return NextResponse.json(
        { error: "No Razorpay payment ID found" },
        { status: 400 }
      );
    }

    // Calculate refund amount
    const refundAmount = amount || payment.amount;
    const existingRefund = payment.refundAmount || 0;
    const maxRefund = payment.amount - existingRefund;

    if (refundAmount > maxRefund) {
      return NextResponse.json(
        { error: `Maximum refundable amount is ₹${maxRefund}` },
        { status: 400 }
      );
    }

    // Initiate refund with Razorpay
    const refund = await initiateRefund({
      paymentId: payment.razorpayPaymentId,
      amount: refundAmount,
      notes: {
        reason,
        initiatedBy: session.user.id,
        bookingNumber: payment.booking.bookingNumber,
      },
    });

    // Determine new status
    const totalRefunded = existingRefund + refundAmount;
    const newStatus = totalRefunded >= payment.amount ? "REFUNDED" : "PARTIALLY_REFUNDED";

    // Update payment record
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        refundId: refund.id,
        refundAmount: totalRefunded,
        refundReason: reason,
        refundedAt: new Date(),
      },
    });

    // Update booking if full refund
    if (newStatus === "REFUNDED") {
      const booking = await prisma.booking.findUnique({
        where: { id: payment.bookingId },
        include: { payments: { where: { status: "COMPLETED" } } },
      });

      if (booking) {
        const totalPaid = booking.payments.reduce((sum, p) => sum + p.amount, 0);
        const totalRefunds = await prisma.payment.aggregate({
          where: {
            bookingId: booking.id,
            refundAmount: { gt: 0 },
          },
          _sum: { refundAmount: true },
        });

        const netPaid = totalPaid - (totalRefunds._sum.refundAmount || 0);

        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            advanceAmount: netPaid,
            isPaid: netPaid >= (booking.totalAmount || 0),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refundAmount,
        status: newStatus,
        reason,
      },
      payment: {
        id: updatedPayment.id,
        amount: updatedPayment.amount,
        refundAmount: updatedPayment.refundAmount,
        status: updatedPayment.status,
      },
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    return NextResponse.json(
      { error: "Failed to process refund" },
      { status: 500 }
    );
  }
}
