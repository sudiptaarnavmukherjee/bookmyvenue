import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createReviewSchema, formatZodErrors } from "@/lib/validations";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

// GET - Fetch reviews for a venue or caterer
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get("venueId");
    const catererId = searchParams.get("catererId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "newest"; // newest, oldest, highest, lowest

    if (!venueId && !catererId) {
      return NextResponse.json(
        { error: "venueId or catererId is required" },
        { status: 400 }
      );
    }

    const where = {
      isApproved: true,
      ...(venueId ? { venueId } : { catererId }),
    };

    // Determine sort order
    let orderBy: any = { createdAt: "desc" };
    switch (sortBy) {
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "highest":
        orderBy = { rating: "desc" };
        break;
      case "lowest":
        orderBy = { rating: "asc" };
        break;
    }

    const [reviews, total, stats] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          booking: {
            select: {
              eventDate: true,
              eventType: true,
            },
          },
        },
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({
        where,
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    // Calculate rating distribution
    const ratingDistribution = await prisma.review.groupBy({
      by: ["rating"],
      where,
      _count: { rating: true },
    });

    const distribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    ratingDistribution.forEach((r) => {
      distribution[r.rating as keyof typeof distribution] = r._count.rating;
    });

    return NextResponse.json({
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count.rating || 0,
        distribution,
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST - Create a new review
export async function POST(request: Request) {
  try {
    // Rate limiting - 5 reviews per hour per user
    const { success: rateLimitOk, resetTime } = rateLimit(request, {
      windowMs: 60 * 60 * 1000,
      maxRequests: 5,
    });
    if (!rateLimitOk) {
      return rateLimitResponse(resetTime);
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validationResult = createReviewSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: formatZodErrors(validationResult.error) },
        { status: 400 }
      );
    }

    const { rating, comment, venueId, catererId, bookingId } = validationResult.data;
    const images = body.images || "";

    // Verify the booking exists and belongs to the user
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { review: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.userId !== user.id) {
      return NextResponse.json(
        { error: "You can only review your own bookings" },
        { status: 403 }
      );
    }

    // Check if booking is completed
    if (booking.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "You can only review completed bookings" },
        { status: 400 }
      );
    }

    // Check if already reviewed
    if (booking.review) {
      return NextResponse.json(
        { error: "You have already reviewed this booking" },
        { status: 400 }
      );
    }

    // Verify the booking matches the venue/caterer
    if (venueId && booking.venueId !== venueId) {
      return NextResponse.json(
        { error: "Booking does not match the venue" },
        { status: 400 }
      );
    }
    if (catererId && booking.catererId !== catererId) {
      return NextResponse.json(
        { error: "Booking does not match the caterer" },
        { status: 400 }
      );
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        images,
        venueId,
        catererId,
        bookingId,
        userId: user.id,
        isVerified: true, // Verified purchase
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Update venue/caterer rating
    if (venueId) {
      const venueStats = await prisma.review.aggregate({
        where: { venueId, isApproved: true },
        _avg: { rating: true },
        _count: { rating: true },
      });
      await prisma.venue.update({
        where: { id: venueId },
        data: {
          // Assuming venue has rating fields - add if not
        },
      });
    }

    if (catererId) {
      const catererStats = await prisma.review.aggregate({
        where: { catererId, isApproved: true },
        _avg: { rating: true },
        _count: { rating: true },
      });
      await prisma.caterer.update({
        where: { id: catererId },
        data: {
          rating: catererStats._avg.rating || 0,
          totalReviews: catererStats._count.rating || 0,
        },
      });
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
