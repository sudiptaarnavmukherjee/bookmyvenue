import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";
import {
  createOrder,
  calculateAmounts,
  generateReceiptNumber,
} from "@/lib/razorpay";
import { z } from "zod";
import { createOptionsResponse, withApiSecurity } from "@/lib/security";

// Validation schema
const createOrderSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  paymentType: z.enum(["ADVANCE", "BALANCE", "FULL"]),
  amount: z.number().optional(), // Optional - calculated if not provided
});

// POST /api/payment/create-order - Create Razorpay order
export const POST = withApiSecurity(async (req: Request) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = createOrderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { bookingId, paymentType, amount: customAmount } = validation.data;

    // Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        venue: { select: { name: true, ownerId: true } },
        caterer: { select: { name: true, ownerId: true } },
        payments: { where: { status: PaymentStatus.COMPLETED } },
        user: { select: { id: true, email: true, name: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Verify user owns this booking
    if (booking.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Calculate amounts
    const totalAmount = booking.totalAmount || 0;
    const amounts = calculateAmounts(totalAmount);
    const totalPaid = booking.payments.reduce((sum, p) => sum + p.amount, 0);

    let paymentAmount: number;

    switch (paymentType) {
      case "ADVANCE":
        // Check if advance already paid
        if (totalPaid >= amounts.advanceAmount) {
          return NextResponse.json(
            { error: "Advance payment already completed" },
            { status: 400 }
          );
        }
        paymentAmount = customAmount || amounts.advanceAmount - totalPaid;
        break;
      case "BALANCE":
        // Calculate remaining balance
        const balance = totalAmount - totalPaid;
        if (balance <= 0) {
          return NextResponse.json(
            { error: "No balance remaining" },
            { status: 400 }
          );
        }
        paymentAmount = customAmount || balance;
        break;
      case "FULL":
        // Full payment (if nothing paid yet)
        if (totalPaid > 0) {
          paymentAmount = customAmount || totalAmount - totalPaid;
        } else {
          paymentAmount = customAmount || totalAmount;
        }
        break;
      default:
        paymentAmount = customAmount || totalAmount;
    }

    // Validate payment amount
    if (paymentAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 }
      );
    }

    // Generate receipt number
    const receiptNumber = generateReceiptNumber(booking.bookingNumber, paymentType);

    // Create Razorpay order
    const order = await createOrder({
      amount: paymentAmount,
      receipt: receiptNumber,
      notes: {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        paymentType,
        userId: session.user.id,
        customerEmail: booking.customerEmail,
      },
    });

    // Calculate platform fee and owner amount for this payment
    const platformFeePercent = parseFloat(process.env.PLATFORM_COMMISSION_PERCENT || "5");
    const platformFee = Math.round(paymentAmount * (platformFeePercent / 100));
    const ownerAmount = paymentAmount - platformFee;

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: paymentAmount,
        type: paymentType,
        status: PaymentStatus.PENDING,
        razorpayOrderId: order.id,
        receiptNumber,
        platformFee,
        ownerAmount,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      paymentId: payment.id,
      amount: paymentAmount,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        venueName: booking.venue?.name || booking.caterer?.name,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
      },
      breakdown: {
        totalAmount,
        advanceAmount: amounts.advanceAmount,
        totalPaid,
        thisPayment: paymentAmount,
        remainingAfter: totalAmount - totalPaid - paymentAmount,
      },
    });
  } catch (error) {
    console.error("Error creating payment order:", error);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}, {
  methods: ["POST", "OPTIONS"],
  rateLimitConfig: { windowMs: 5 * 60 * 1000, maxRequests: 8 },
});

export function OPTIONS(request: Request) {
  return createOptionsResponse(request, ["POST", "OPTIONS"]);
}
