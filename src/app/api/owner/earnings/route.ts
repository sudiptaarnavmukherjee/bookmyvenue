import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/owner/earnings - Get owner earnings summary
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only owners can access this
    if (!["VENUE_OWNER", "CATERING_OWNER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Only owners can access earnings" },
        { status: 403 }
      );
    }

    const ownerId = session.user.id;
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "all"; // all, month, year
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Calculate date range
    let startDate: Date | undefined;
    const now = new Date();
    
    if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    // Get owner's venues and caterers
    const [venues, caterers] = await Promise.all([
      prisma.venue.findMany({
        where: { ownerId },
        select: { id: true, name: true },
      }),
      prisma.caterer.findMany({
        where: { ownerId },
        select: { id: true, name: true },
      }),
    ]);

    const venueIds = venues.map((v) => v.id);
    const catererIds = caterers.map((c) => c.id);

    // Get completed payments for owner's properties
    const paymentsWhere = {
      status: "COMPLETED",
      booking: {
        OR: [
          { venueId: { in: venueIds } },
          { catererId: { in: catererIds } },
        ],
      },
      ...(startDate && { paidAt: { gte: startDate } }),
    };

    // Get earnings summary
    const [
      totalEarnings,
      pendingPayout,
      completedPayouts,
      recentPayments,
      monthlyStats,
    ] = await Promise.all([
      // Total earnings (owner amount from completed payments)
      prisma.payment.aggregate({
        where: paymentsWhere,
        _sum: { ownerAmount: true },
      }),
      // Pending payout (not yet paid to owner)
      prisma.payment.aggregate({
        where: {
          ...paymentsWhere,
          isOwnerPaid: false,
        },
        _sum: { ownerAmount: true },
      }),
      // Completed payouts
      prisma.payout.aggregate({
        where: {
          ownerId,
          status: "COMPLETED",
          ...(startDate && { processedAt: { gte: startDate } }),
        },
        _sum: { amount: true },
      }),
      // Recent payments
      prisma.payment.findMany({
        where: paymentsWhere,
        orderBy: { paidAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          booking: {
            select: {
              id: true,
              bookingNumber: true,
              customerName: true,
              eventDate: true,
              venue: { select: { name: true } },
              caterer: { select: { name: true } },
            },
          },
        },
      }),
      // Monthly earnings for chart (last 6 months)
      getMonthlyEarnings(ownerId, venueIds, catererIds),
    ]);

    // Total count for pagination
    const totalPayments = await prisma.payment.count({ where: paymentsWhere });

    // Get payout history
    const payouts = await prisma.payout.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      summary: {
        totalEarnings: totalEarnings._sum.ownerAmount || 0,
        pendingPayout: pendingPayout._sum.ownerAmount || 0,
        completedPayouts: completedPayouts._sum.amount || 0,
        platformFeePercent: parseFloat(process.env.PLATFORM_COMMISSION_PERCENT || "5"),
      },
      payments: recentPayments.map((p) => ({
        id: p.id,
        amount: p.amount,
        ownerAmount: p.ownerAmount,
        platformFee: p.platformFee,
        status: p.status,
        paidAt: p.paidAt,
        method: p.method,
        booking: {
          id: p.booking.id,
          bookingNumber: p.booking.bookingNumber,
          customerName: p.booking.customerName,
          eventDate: p.booking.eventDate,
          propertyName: p.booking.venue?.name || p.booking.caterer?.name,
        },
      })),
      pagination: {
        page,
        limit,
        total: totalPayments,
        totalPages: Math.ceil(totalPayments / limit),
      },
      monthlyStats,
      payouts: payouts.map((p) => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        processedAt: p.processedAt,
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        transferMode: p.transferMode,
      })),
      properties: {
        venues: venues.map((v) => ({ id: v.id, name: v.name })),
        caterers: caterers.map((c) => ({ id: c.id, name: c.name })),
      },
    });
  } catch (error) {
    console.error("Error fetching earnings:", error);
    return NextResponse.json(
      { error: "Failed to fetch earnings" },
      { status: 500 }
    );
  }
}

// Helper function to get monthly earnings
async function getMonthlyEarnings(
  ownerId: string,
  venueIds: string[],
  catererIds: string[]
) {
  const months = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

    const earnings = await prisma.payment.aggregate({
      where: {
        status: "COMPLETED",
        paidAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        booking: {
          OR: [
            { venueId: { in: venueIds } },
            { catererId: { in: catererIds } },
          ],
        },
      },
      _sum: { ownerAmount: true },
      _count: true,
    });

    months.push({
      month: startOfMonth.toLocaleDateString("en-IN", { month: "short" }),
      year: startOfMonth.getFullYear(),
      earnings: earnings._sum.ownerAmount || 0,
      bookings: earnings._count,
    });
  }

  return months;
}
