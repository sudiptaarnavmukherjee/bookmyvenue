import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";
import { sendPaymentConfirmation, sendBookingConfirmation, notifyOwnerNewBooking } from "@/lib/email";

// Razorpay webhook events
interface RazorpayWebhookPayload {
  event: string;
  payload: {
    payment?: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        currency: string;
        status: string;
        method: string;
        bank?: string;
        wallet?: string;
        vpa?: string;
        card?: {
          last4: string;
          network: string;
        };
        error_code?: string;
        error_description?: string;
        notes?: Record<string, string>;
      };
    };
    refund?: {
      entity: {
        id: string;
        payment_id: string;
        amount: number;
        status: string;
        notes?: Record<string, string>;
      };
    };
    order?: {
      entity: {
        id: string;
        status: string;
      };
    };
  };
}

// Verify webhook signature
function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return expectedSignature === signature;
}

// POST /api/webhooks/razorpay - Handle Razorpay webhooks
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    // Verify signature
    if (!signature || !process.env.RAZORPAY_WEBHOOK_SECRET) {
      console.error("Missing webhook signature or secret");
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const isValid = verifyWebhookSignature(
      body,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET
    );

    if (!isValid) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const payload: RazorpayWebhookPayload = JSON.parse(body);
    console.log("Razorpay webhook received:", payload.event);

    switch (payload.event) {
      case "payment.captured":
        await handlePaymentCaptured(payload);
        break;
      case "payment.failed":
        await handlePaymentFailed(payload);
        break;
      case "refund.created":
      case "refund.processed":
        await handleRefund(payload);
        break;
      default:
        console.log("Unhandled webhook event:", payload.event);
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Handle successful payment
async function handlePaymentCaptured(payload: RazorpayWebhookPayload) {
  const paymentEntity = payload.payload.payment?.entity;
  if (!paymentEntity) return;

  const { id: razorpayPaymentId, order_id: razorpayOrderId, method, bank, wallet, vpa, card } = paymentEntity;

  // Find payment record
  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId },
    include: {
      booking: {
        include: {
          venue: {
            select: {
              name: true,
              owner: { select: { email: true, name: true } },
            },
          },
          caterer: {
            select: {
              name: true,
              owner: { select: { email: true, name: true } },
            },
          },
          payments: { where: { status: PaymentStatus.COMPLETED } },
        },
      },
    },
  });

  if (!payment || payment.status === "COMPLETED") {
    return; // Already processed or not found
  }

  // Update payment
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      razorpayPaymentId,
      status: PaymentStatus.COMPLETED,
      paidAt: new Date(),
      method,
      bank,
      wallet,
      vpa,
      cardLast4: card?.last4,
      cardNetwork: card?.network,
    },
  });

  // Calculate totals
  const totalPaid = payment.booking.payments.reduce((sum, p) => sum + p.amount, 0) + payment.amount;
  const totalAmount = payment.booking.totalAmount || 0;

  // Update booking
  const bookingUpdate: Record<string, unknown> = {
    advanceAmount: totalPaid,
    balanceAmount: Math.max(0, totalAmount - totalPaid),
    isPaid: totalPaid >= totalAmount,
  };

  if (payment.booking.status === "PENDING" && payment.type === "ADVANCE") {
    bookingUpdate.status = "CONFIRMED";
    bookingUpdate.confirmedAt = new Date();
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: payment.bookingId },
    data: bookingUpdate,
  });

  // Block date if advance payment
  if (payment.type === "ADVANCE" && payment.booking.status === "PENDING") {
    const blockData = {
      date: payment.booking.eventDate,
      reason: `Booked - ${payment.booking.bookingNumber}`,
      isOnlineBooking: true,
      bookingId: payment.booking.id,
    };

    if (payment.booking.venueId) {
      await prisma.blockedDate.upsert({
        where: {
          venueId_date: {
            venueId: payment.booking.venueId,
            date: payment.booking.eventDate,
          },
        },
        create: { ...blockData, venueId: payment.booking.venueId },
        update: blockData,
      });
    }

    if (payment.booking.catererId) {
      await prisma.blockedDate.upsert({
        where: {
          catererId_date: {
            catererId: payment.booking.catererId,
            date: payment.booking.eventDate,
          },
        },
        create: { ...blockData, catererId: payment.booking.catererId },
        update: blockData,
      });
    }
  }

  // Send notifications
  try {
    await sendPaymentConfirmation(
      payment.booking.customerEmail,
      payment.booking.customerName,
      payment.amount,
      razorpayPaymentId,
      payment.booking.bookingNumber,
      method
    );

    if (payment.booking.status === "PENDING" && updatedBooking.status === "CONFIRMED") {
      await sendBookingConfirmation({
        id: payment.booking.id,
        bookingNumber: payment.booking.bookingNumber,
        customerName: payment.booking.customerName,
        customerEmail: payment.booking.customerEmail,
        eventDate: payment.booking.eventDate,
        guestCount: payment.booking.guestCount,
        totalAmount: payment.booking.totalAmount,
        advanceAmount: totalPaid,
        venue: payment.booking.venue,
        caterer: payment.booking.caterer,
      });

      const owner = payment.booking.venue?.owner || payment.booking.caterer?.owner;
      if (owner) {
        await notifyOwnerNewBooking(owner.email, owner.name || "Owner", {
          id: payment.booking.id,
          bookingNumber: payment.booking.bookingNumber,
          customerName: payment.booking.customerName,
          customerPhone: payment.booking.customerPhone,
          eventDate: payment.booking.eventDate,
          guestCount: payment.booking.guestCount,
          eventType: payment.booking.eventType,
          totalAmount: payment.booking.totalAmount,
          specialRequests: payment.booking.specialRequests,
          venue: payment.booking.venue,
          caterer: payment.booking.caterer,
        });
      }
    }
  } catch (emailError) {
    console.error("Webhook email notification error:", emailError);
  }
}

// Handle failed payment
async function handlePaymentFailed(payload: RazorpayWebhookPayload) {
  const paymentEntity = payload.payload.payment?.entity;
  if (!paymentEntity) return;

  const { order_id: razorpayOrderId, error_code, error_description } = paymentEntity;

  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId },
  });

  if (!payment || payment.status === "COMPLETED") return;

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.FAILED,
      failedAt: new Date(),
      failureReason: error_description || error_code || "Payment failed",
    },
  });
}

// Handle refund
async function handleRefund(payload: RazorpayWebhookPayload) {
  const refundEntity = payload.payload.refund?.entity;
  if (!refundEntity) return;

  const { id: refundId, payment_id, amount, status } = refundEntity;

  // Find payment by razorpay payment ID
  const payment = await prisma.payment.findFirst({
    where: { razorpayPaymentId: payment_id },
  });

  if (!payment) return;

  const refundAmount = amount / 100; // Convert from paise
  const totalRefund = (payment.refundAmount || 0) + refundAmount;
  const newStatus = totalRefund >= payment.amount ? "REFUNDED" : "PARTIALLY_REFUNDED";

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: newStatus,
      refundId,
      refundAmount: totalRefund,
      refundedAt: new Date(),
    },
  });

  // Update booking totals
  const booking = await prisma.booking.findUnique({
    where: { id: payment.bookingId },
    include: { payments: true },
  });

  if (booking) {
    const totalPaid = booking.payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0);
    
    const totalRefunds = booking.payments
      .reduce((sum, p) => sum + (p.refundAmount || 0), 0);

    const netPaid = totalPaid - totalRefunds;

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        advanceAmount: netPaid,
        isPaid: netPaid >= (booking.totalAmount || 0),
      },
    });
  }
}
