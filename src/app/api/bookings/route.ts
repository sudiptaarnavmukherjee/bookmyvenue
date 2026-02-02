import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createBookingSchema, formatZodErrors } from "@/lib/validations";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { PackageTier } from "@prisma/client";

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
    // Rate limiting
    const { success: rateLimitOk, resetTime } = rateLimit(request, { windowMs: 60000, maxRequests: 10 });
    if (!rateLimitOk) {
      return rateLimitResponse(resetTime);
    }

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Zod validation
    const validationResult = createBookingSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: formatZodErrors(validationResult.error) },
        { status: 400 }
      );
    }

    const {
      type,
      venueId,
      catererId,
      eventDate,
      guestCount,
      selectedPackage,
      totalAmount,
      customerName,
      customerEmail,
      customerPhone,
      specialRequests,
    } = validationResult.data;

    const eventType = (body as any).eventType;
    const advanceAmount = (body as any).advanceAmount;

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
      // Note: guestCount and totalAmount are already numbers from Zod validation
      // advanceAmount comes from body directly, so needs parsing if string
      const parsedAdvance = advanceAmount 
        ? (typeof advanceAmount === 'string' ? parseFloat(advanceAmount) : advanceAmount)
        : null;
      const parsedTotal = totalAmount ?? null;
      
      // Validate and cast selectedPackage to PackageTier enum
      const validPackages: PackageTier[] = ['SILVER', 'GOLD', 'DIAMOND', 'PLATINUM'];
      const packageTier: PackageTier | null = selectedPackage && validPackages.includes(selectedPackage as PackageTier) 
        ? (selectedPackage as PackageTier) 
        : null;

      const newBooking = await tx.booking.create({
        data: {
          bookingNumber,
          type,
          userId: user.id,
          venueId: type === "VENUE" ? venueId : null,
          catererId: type === "CATERING" ? catererId : null,
          eventDate: new Date(eventDate),
          eventType,
          guestCount: guestCount ?? null,
          selectedPackage: packageTier,
          totalAmount: parsedTotal,
          advanceAmount: parsedAdvance,
          balanceAmount: parsedTotal && parsedAdvance 
            ? parsedTotal - parsedAdvance
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
