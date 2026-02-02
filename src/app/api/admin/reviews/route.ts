import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/reviews - Get reviews for moderation
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all"; // all, flagged, pending, approved
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    let where: Record<string, unknown> = {};

    switch (filter) {
      case "flagged":
        where.isFlagged = true;
        break;
      case "pending":
        where.isApproved = false;
        where.isFlagged = false;
        break;
      case "approved":
        where.isApproved = true;
        break;
    }

    const [reviews, total, stats] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          venue: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          caterer: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          booking: {
            select: {
              bookingNumber: true,
              eventDate: true,
            },
          },
        },
      }),
      prisma.review.count({ where }),
      // Get stats
      Promise.all([
        prisma.review.count({ where: { isFlagged: true } }),
        prisma.review.count({ where: { isApproved: false, isFlagged: false } }),
        prisma.review.count({ where: { isApproved: true } }),
        prisma.review.count(),
      ]),
    ]);

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        flagged: stats[0],
        pending: stats[1],
        approved: stats[2],
        total: stats[3],
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
