import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
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

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Customer or owner can cancel
    if (booking.userId !== user.id && user.role !== "ADMIN") {
      const venue = booking.venueId
        ? await prisma.venue.findUnique({ where: { id: booking.venueId } })
        : null;
      const caterer = booking.catererId
        ? await prisma.caterer.findUnique({ where: { id: booking.catererId } })
        : null;

      if (
        (venue && venue.ownerId !== user.id) &&
        (caterer && caterer.ownerId !== user.id)
      ) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    // Cancel booking and unblock the date
    const [updatedBooking] = await prisma.$transaction([
      prisma.booking.update({
        where: { id: params.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: reason || "No reason provided",
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

    // TODO: Process refund if applicable
    // TODO: Send cancellation email/SMS

    return NextResponse.json({ booking: updatedBooking });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json(
      { error: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}
