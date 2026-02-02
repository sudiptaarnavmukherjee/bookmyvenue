import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaymentStatus, PayoutStatus } from "@prisma/client";

// GET /api/admin/analytics/revenue - Get revenue analytics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month"; // week, month, year, all
    const groupBy = searchParams.get("groupBy") || "day"; // day, week, month

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0);
    }

    // Get completed payments in range
    const payments = await prisma.payment.findMany({
      where: {
        status: PaymentStatus.COMPLETED,
        paidAt: { gte: startDate },
      },
      select: {
        amount: true,
        platformFee: true,
        ownerAmount: true,
        paidAt: true,
        method: true,
      },
      orderBy: { paidAt: "asc" },
    });

    // Aggregate by period
    const revenueByPeriod: Record<string, {
      date: string;
      totalRevenue: number;
      platformFee: number;
      ownerAmount: number;
      transactionCount: number;
    }> = {};

    payments.forEach((payment) => {
      if (!payment.paidAt) return;

      let key: string;
      const date = new Date(payment.paidAt);

      if (groupBy === "day") {
        key = date.toISOString().split("T")[0];
      } else if (groupBy === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }

      if (!revenueByPeriod[key]) {
        revenueByPeriod[key] = {
          date: key,
          totalRevenue: 0,
          platformFee: 0,
          ownerAmount: 0,
          transactionCount: 0,
        };
      }

      revenueByPeriod[key].totalRevenue += payment.amount;
      revenueByPeriod[key].platformFee += payment.platformFee || 0;
      revenueByPeriod[key].ownerAmount += payment.ownerAmount || 0;
      revenueByPeriod[key].transactionCount += 1;
    });

    // Payment method breakdown
    const methodBreakdown: Record<string, { count: number; amount: number }> = {};
    payments.forEach((payment) => {
      const method = payment.method || "unknown";
      if (!methodBreakdown[method]) {
        methodBreakdown[method] = { count: 0, amount: 0 };
      }
      methodBreakdown[method].count += 1;
      methodBreakdown[method].amount += payment.amount;
    });

    // Summary stats
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPlatformFee = payments.reduce((sum, p) => sum + (p.platformFee || 0), 0);
    const totalOwnerAmount = payments.reduce((sum, p) => sum + (p.ownerAmount || 0), 0);

    // Get pending payouts
    const pendingPayouts = await prisma.payout.aggregate({
      where: { status: PayoutStatus.PENDING },
      _sum: { amount: true },
      _count: true,
    });

    // Get booking stats
    const bookingStats = await prisma.booking.groupBy({
      by: ["status"],
      where: {
        createdAt: { gte: startDate },
      },
      _count: true,
      _sum: { totalAmount: true },
    });

    // Recent large transactions
    const largeTransactions = await prisma.payment.findMany({
      where: {
        status: PaymentStatus.COMPLETED,
        paidAt: { gte: startDate },
        amount: { gte: 50000 }, // 50k+
      },
      orderBy: { amount: "desc" },
      take: 10,
      include: {
        booking: {
          select: {
            bookingNumber: true,
            customerName: true,
            venue: { select: { name: true } },
            caterer: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalPlatformFee,
        totalOwnerAmount,
        transactionCount: payments.length,
        averageTransaction: payments.length > 0 ? totalRevenue / payments.length : 0,
        pendingPayouts: pendingPayouts._sum.amount || 0,
        pendingPayoutCount: pendingPayouts._count,
      },
      revenueChart: Object.values(revenueByPeriod).sort((a, b) => 
        a.date.localeCompare(b.date)
      ),
      paymentMethods: Object.entries(methodBreakdown).map(([method, data]) => ({
        method,
        ...data,
        percentage: totalRevenue > 0 ? (data.amount / totalRevenue) * 100 : 0,
      })),
      bookingStats: bookingStats.map((s) => ({
        status: s.status,
        count: s._count,
        amount: s._sum.totalAmount || 0,
      })),
      largeTransactions: largeTransactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        paidAt: t.paidAt,
        method: t.method,
        booking: {
          bookingNumber: t.booking.bookingNumber,
          customerName: t.booking.customerName,
          propertyName: t.booking.venue?.name || t.booking.caterer?.name,
        },
      })),
    });
  } catch (error) {
    console.error("Error fetching revenue analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
