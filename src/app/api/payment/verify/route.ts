import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";
import { verifyPaymentSignature, fetchPayment } from "@/lib/razorpay";
import { sendPaymentConfirmation, sendBookingConfirmation, notifyOwnerNewBooking } from "@/lib/email";
import { z } from "zod";

// Validation schema
const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1, "Order ID is required"),
  razorpayPaymentId: z.string().min(1, "Payment ID is required"),
  razorpaySignature: z.string().min(1, "Signature is required"),
});

// POST /api/payment/verify - Verify payment and update records
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = verifyPaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = validation.data;

    // Verify signature
    const isValid = verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Find payment record
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId },
      include: {
        booking: {
          include: {
            venue: { 
              select: { 
                name: true, 
                ownerId: true,
                owner: { select: { email: true, name: true } }
              } 
            },
            caterer: { 
              select: { 
                name: true, 
                ownerId: true,
                owner: { select: { email: true, name: true } }
              } 
            },
            user: { select: { id: true, email: true, name: true } },
            payments: { where: { status: PaymentStatus.COMPLETED } },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Fetch payment details from Razorpay for additional info
    let paymentDetails;
    try {
      paymentDetails = await fetchPayment(razorpayPaymentId);
    } catch (error) {
      console.error("Error fetching payment details:", error);
    }

    // Update payment record
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId,
        razorpaySignature,
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(),
        method: paymentDetails?.method || null,
        bank: paymentDetails?.bank || null,
        wallet: paymentDetails?.wallet || null,
        vpa: paymentDetails?.vpa || null,
        cardLast4: paymentDetails?.card?.last4 || null,
        cardNetwork: paymentDetails?.card?.network || null,
      },
    });

    // Calculate total paid after this payment
    const totalPaid = 
      payment.booking.payments.reduce((sum, p) => sum + p.amount, 0) + payment.amount;
    const totalAmount = payment.booking.totalAmount || 0;
    const isPaid = totalPaid >= totalAmount;

    // Update booking status
    const bookingUpdateData: Record<string, unknown> = {
      isPaid,
      advanceAmount: totalPaid,
      balanceAmount: Math.max(0, totalAmount - totalPaid),
    };

    // If this is first payment (advance), confirm booking
    if (payment.booking.status === "PENDING" && payment.type === "ADVANCE") {
      bookingUpdateData.status = "CONFIRMED";
      bookingUpdateData.confirmedAt = new Date();
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: payment.bookingId },
      data: bookingUpdateData,
      include: {
        venue: { select: { name: true } },
        caterer: { select: { name: true } },
      },
    });

    // Block the date on the venue/caterer calendar
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
          create: {
            ...blockData,
            venueId: payment.booking.venueId,
          },
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
          create: {
            ...blockData,
            catererId: payment.booking.catererId,
          },
          update: blockData,
        });
      }
    }

    // Send email notifications
    try {
      // Payment confirmation to customer
      await sendPaymentConfirmation(
        payment.booking.customerEmail,
        payment.booking.customerName,
        payment.amount,
        razorpayPaymentId,
        payment.booking.bookingNumber,
        paymentDetails?.method
      );

      // If booking just got confirmed, send confirmation + notify owner
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

        // Notify owner
        const owner = payment.booking.venue?.owner || payment.booking.caterer?.owner;
        if (owner) {
          await notifyOwnerNewBooking(
            owner.email,
            owner.name || "Owner",
            {
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
            }
          );
        }
      }
    } catch (emailError) {
      console.error("Error sending email notifications:", emailError);
      // Don't fail the request if emails fail
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: updatedPayment.id,
        amount: updatedPayment.amount,
        status: updatedPayment.status,
        method: updatedPayment.method,
        paidAt: updatedPayment.paidAt,
        receiptNumber: updatedPayment.receiptNumber,
      },
      booking: {
        id: updatedBooking.id,
        bookingNumber: updatedBooking.bookingNumber,
        status: updatedBooking.status,
        totalAmount: updatedBooking.totalAmount,
        advancePaid: totalPaid,
        balanceDue: Math.max(0, totalAmount - totalPaid),
        isPaid: updatedBooking.isPaid,
        venueName: updatedBooking.venue?.name || updatedBooking.caterer?.name,
      },
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
