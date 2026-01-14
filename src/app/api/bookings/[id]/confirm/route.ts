import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { venue: true, caterer: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Only owner can confirm
    if (
      (booking.venue && booking.venue.ownerId !== user.id) &&
      (booking.caterer && booking.caterer.ownerId !== user.id)
    ) {
      return NextResponse.json(
        { error: "Only the owner can confirm bookings" },
        { status: 403 }
      );
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: params.id },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
    });

    // TODO: Send confirmation email/SMS to customer

    return NextResponse.json({ booking: updatedBooking });
  } catch (error) {
    console.error("Error confirming booking:", error);
    return NextResponse.json(
      { error: "Failed to confirm booking" },
      { status: 500 }
    );
  }
}
