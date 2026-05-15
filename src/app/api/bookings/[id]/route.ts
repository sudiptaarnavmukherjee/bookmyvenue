import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendTemplatedEmail } from "@/lib/email-templates";

export async function GET(
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

    const params = await segmentData.params;

    const booking = await prisma.booking.findUnique({
      where: {
        id: params.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        venue: true,
        caterer: {
          include: {
            packages: true,
          },
        },
        payments: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Authorization check
    if (
      user.role !== "ADMIN" &&
      booking.userId !== user.id &&
      (booking.venue && booking.venue.ownerId !== user.id) &&
      (booking.caterer && booking.caterer.ownerId !== user.id)
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

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

    const params = await segmentData.params;
    const body = await request.json();

    // Fetch existing booking to determine what fields to read for emails
    const existingBooking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        venue: { select: { name: true } },
        caterer: { select: { name: true } },
      },
    });

    const booking = await prisma.booking.update({
      where: {
        id: params.id,
      },
      data: body,
    });

    // Send status-change emails when status transitions to CONFIRMED or CANCELLED
    const newStatus: string | undefined = body.status;
    if (
      existingBooking &&
      existingBooking.customerEmail &&
      (newStatus === "CONFIRMED" || newStatus === "CANCELLED")
    ) {
      const listingName =
        existingBooking.venue?.name ?? existingBooking.caterer?.name ?? "your booking";
      const formattedDate = new Date(existingBooking.eventDate).toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (newStatus === "CONFIRMED") {
        sendTemplatedEmail({
          to: existingBooking.customerEmail,
          templateName: "booking_confirmed_customer",
          subject: `Booking Confirmed – ${listingName} on ${formattedDate}`,
          variables: {
            customerName: existingBooking.customerName,
            bookingNumber: existingBooking.bookingNumber,
            listingName,
            eventDate: formattedDate,
          },
          fallbackHtml: `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
              <h2 style="color:#16a34a">Your Booking is Confirmed!</h2>
              <p>Hi ${existingBooking.customerName},</p>
              <p>Great news! The owner has confirmed your booking for <strong>${listingName}</strong> on <strong>${formattedDate}</strong>.</p>
              <p><strong>Booking #:</strong> ${existingBooking.bookingNumber}</p>
              <p style="margin-top:16px">We look forward to making your event special!</p>
              <p style="color:#6b7280;font-size:13px">Questions? Contact us at support@shubhspace.com</p>
            </div>
          `,
        }).catch((e) => console.error("Booking confirmed email error:", e));
      } else if (newStatus === "CANCELLED") {
        sendTemplatedEmail({
          to: existingBooking.customerEmail,
          templateName: "booking_cancelled_customer",
          subject: `Booking Cancelled – ${listingName} on ${formattedDate}`,
          variables: {
            customerName: existingBooking.customerName,
            bookingNumber: existingBooking.bookingNumber,
            listingName,
            eventDate: formattedDate,
          },
          fallbackHtml: `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
              <h2 style="color:#dc2626">Booking Cancelled</h2>
              <p>Hi ${existingBooking.customerName},</p>
              <p>Your booking for <strong>${listingName}</strong> on <strong>${formattedDate}</strong> has been cancelled.</p>
              <p><strong>Booking #:</strong> ${existingBooking.bookingNumber}</p>
              <p style="margin-top:16px">If you believe this is an error or would like to rebook, please contact us at support@shubhspace.com</p>
            </div>
          `,
        }).catch((e) => console.error("Booking cancelled email error:", e));
      }
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
