import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createBookingSchema, formatZodErrors } from "@/lib/validations";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { PackageTier, BookingStatus } from "@prisma/client";
import { sendTemplatedEmail } from "@/lib/email-templates";

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
          cancellationRequest: true,
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
          cancellationRequest: true,
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
          customerPhone: customerPhone || "",
          specialRequests,
          status: BookingStatus.PENDING,
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

    // Send notification emails (non-blocking — failure must not reject the booking)
    const listingName =
      booking.venue?.name ?? booking.caterer?.name ?? "your listed venue";
    const formattedDate = new Date(booking.eventDate).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // 1. Customer confirmation email
    sendTemplatedEmail({
      to: customerEmail,
      templateName: "booking_confirmation_customer",
      subject: `Booking Confirmed – ${listingName} on ${formattedDate}`,
      variables: {
        customerName,
        bookingNumber: booking.bookingNumber,
        listingName,
        eventDate: formattedDate,
        guestCount: guestCount ?? 0,
        totalAmount: booking.totalAmount ? `₹${booking.totalAmount.toLocaleString("en-IN")}` : "TBD",
        advanceAmount: booking.advanceAmount ? `₹${booking.advanceAmount.toLocaleString("en-IN")}` : "TBD",
        specialRequests: specialRequests || "None",
      },
      fallbackHtml: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
          <h2 style="color:#7c3aed">Booking Received – ${listingName}</h2>
          <p>Hi ${customerName},</p>
          <p>We've received your booking request. Here are the details:</p>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px;font-weight:600">Booking #</td><td style="padding:8px">${booking.bookingNumber}</td></tr>
            <tr><td style="padding:8px;font-weight:600">Venue / Caterer</td><td style="padding:8px">${listingName}</td></tr>
            <tr><td style="padding:8px;font-weight:600">Event Date</td><td style="padding:8px">${formattedDate}</td></tr>
            <tr><td style="padding:8px;font-weight:600">Guests</td><td style="padding:8px">${guestCount ?? "—"}</td></tr>
            <tr><td style="padding:8px;font-weight:600">Total Amount</td><td style="padding:8px">${booking.totalAmount ? `₹${booking.totalAmount.toLocaleString("en-IN")}` : "TBD"}</td></tr>
          </table>
          <p style="margin-top:16px">Your booking is currently <strong>PENDING</strong> and will be confirmed by the owner shortly.</p>
          <p style="color:#6b7280;font-size:13px">If you have questions, reply to this email or contact us at support@shubhspace.com</p>
        </div>
      `,
    }).catch((e) => console.error("Customer booking email error:", e));

    // 2. Owner new-booking alert
    try {
      let ownerEmail: string | null = null;
      if (type === "VENUE" && booking.venue) {
        const venueOwner = await prisma.venue.findUnique({
          where: { id: booking.venue.id },
          select: { owner: { select: { email: true } } },
        });
        ownerEmail = venueOwner?.owner?.email ?? null;
      } else if (type === "CATERING" && booking.caterer) {
        const catererOwner = await prisma.caterer.findUnique({
          where: { id: booking.caterer.id },
          select: { owner: { select: { email: true } } },
        });
        ownerEmail = catererOwner?.owner?.email ?? null;
      }

      if (ownerEmail) {
        sendTemplatedEmail({
          to: ownerEmail,
          templateName: "booking_alert_owner",
          subject: `New Booking – ${listingName} on ${formattedDate}`,
          variables: {
            bookingNumber: booking.bookingNumber,
            listingName,
            customerName,
            customerEmail,
            customerPhone: customerPhone ?? "",
            eventDate: formattedDate,
            guestCount: guestCount ?? 0,
            totalAmount: booking.totalAmount ? `₹${booking.totalAmount.toLocaleString("en-IN")}` : "TBD",
            specialRequests: specialRequests || "None",
          },
          fallbackHtml: `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
              <h2 style="color:#7c3aed">New Booking for ${listingName}</h2>
              <p>You have a new booking request:</p>
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:8px;font-weight:600">Booking #</td><td style="padding:8px">${booking.bookingNumber}</td></tr>
                <tr><td style="padding:8px;font-weight:600">Customer</td><td style="padding:8px">${customerName} (${customerEmail})</td></tr>
                <tr><td style="padding:8px;font-weight:600">Phone</td><td style="padding:8px">${customerPhone ?? "—"}</td></tr>
                <tr><td style="padding:8px;font-weight:600">Event Date</td><td style="padding:8px">${formattedDate}</td></tr>
                <tr><td style="padding:8px;font-weight:600">Guests</td><td style="padding:8px">${guestCount ?? "—"}</td></tr>
                <tr><td style="padding:8px;font-weight:600">Total</td><td style="padding:8px">${booking.totalAmount ? `₹${booking.totalAmount.toLocaleString("en-IN")}` : "TBD"}</td></tr>
                <tr><td style="padding:8px;font-weight:600">Special Requests</td><td style="padding:8px">${specialRequests || "None"}</td></tr>
              </table>
              <p style="margin-top:16px">Please log in to your owner dashboard to confirm or discuss this booking.</p>
            </div>
          `,
        }).catch((e) => console.error("Owner booking alert email error:", e));
      }
    } catch (ownerEmailErr) {
      console.error("Owner email lookup error:", ownerEmailErr);
    }

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
