import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    let bookings;

    // Filter bookings based on user role
    if (user.role === "ADMIN") {
      // Admin sees all bookings
      bookings = await prisma.booking.findMany({
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
          venue: {
            select: {
              name: true,
              city: true,
              coverImage: true,
            },
          },
          caterer: {
            select: {
              name: true,
              city: true,
              coverImage: true,
            },
          },
          payments: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else if (user.role === "VENUE_OWNER") {
      // Venue owner sees bookings for their venues
      const ownerVenues = await prisma.venue.findMany({
        where: { ownerId: user.id },
        select: { id: true },
      });

      const venueIds = ownerVenues.map((v) => v.id);

      bookings = await prisma.booking.findMany({
        where: {
          type: "VENUE",
          venueId: { in: venueIds },
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
          venue: {
            select: {
              name: true,
              city: true,
              coverImage: true,
            },
          },
          payments: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else if (user.role === "CATERING_OWNER") {
      // Catering owner sees bookings for their caterers
      const ownerCaterers = await prisma.caterer.findMany({
        where: { ownerId: user.id },
        select: { id: true },
      });

      const catererIds = ownerCaterers.map((c) => c.id);

      bookings = await prisma.booking.findMany({
        where: {
          type: "CATERING",
          catererId: { in: catererIds },
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
          caterer: {
            select: {
              name: true,
              city: true,
              coverImage: true,
            },
          },
          payments: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      // Regular user sees their own bookings
      bookings = await prisma.booking.findMany({
        where: {
          userId: user.id,
        },
        include: {
          venue: {
            select: {
              name: true,
              city: true,
              coverImage: true,
              address: true,
            },
          },
          caterer: {
            select: {
              name: true,
              city: true,
              coverImage: true,
              address: true,
            },
          },
          payments: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      type,
      venueId,
      catererId,
      eventDate,
      eventType,
      guestCount,
      selectedPackage,
      totalAmount,
      advanceAmount,
      customerName,
      customerEmail,
      customerPhone,
      specialRequests,
    } = body;

    // Validation
    if (!type || !eventDate || !customerName || !customerEmail || !customerPhone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (type === "VENUE" && !venueId) {
      return NextResponse.json(
        { error: "Venue ID is required for venue booking" },
        { status: 400 }
      );
    }

    if (type === "CATERING" && !catererId) {
      return NextResponse.json(
        { error: "Caterer ID is required for catering booking" },
        { status: 400 }
      );
    }

    // Check if date is already blocked or booked
    const blockedDate = await prisma.blockedDate.findFirst({
      where: {
        date: new Date(eventDate),
        ...(type === "VENUE" ? { venueId } : { catererId }),
      },
    });

    if (blockedDate) {
      return NextResponse.json(
        { 
          error: blockedDate.isOnlineBooking 
            ? "This date is already booked" 
            : "This date is not available"
        },
        { status: 400 }
      );
    }

    // Check minimum advance booking (7 days)
    const eventDateObj = new Date(eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() + 7);

    if (eventDateObj < minDate) {
      return NextResponse.json(
        { error: "Minimum 7 days advance booking required" },
        { status: 400 }
      );
    }

    // Generate booking number
    const bookingNumber = `BOOK-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    // Create booking and block the date atomically
    const booking = await prisma.$transaction(async (tx) => {
      // Create the booking
      const newBooking = await tx.booking.create({
        data: {
          bookingNumber,
          type,
          userId: user.id,
          venueId: type === "VENUE" ? venueId : null,
          catererId: type === "CATERING" ? catererId : null,
          eventDate: new Date(eventDate),
          eventType,
          guestCount: guestCount ? parseInt(guestCount) : null,
          selectedPackage,
          totalAmount: totalAmount ? parseFloat(totalAmount) : null,
          advanceAmount: advanceAmount ? parseFloat(advanceAmount) : null,
          balanceAmount: totalAmount && advanceAmount 
            ? parseFloat(totalAmount) - parseFloat(advanceAmount)
            : null,
          customerName,
          customerEmail,
          customerPhone,
          specialRequests,
          status: "PENDING",
          isPaid: false,
        },
        include: {
          venue: true,
          caterer: true,
        },
      });

      // Block the date
      await tx.blockedDate.create({
        data: {
          date: new Date(eventDate),
          isOnlineBooking: true,
          bookingId: newBooking.id,
          reason: `Booking ${newBooking.bookingNumber}`,
          ...(type === "VENUE" ? { venueId } : { catererId }),
        },
      });

      return newBooking;
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
