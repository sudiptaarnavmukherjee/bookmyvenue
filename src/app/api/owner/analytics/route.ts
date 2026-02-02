import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/owner/analytics - Get comprehensive analytics for venue/catering owners
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "30d"; // 7d, 30d, 90d, 1y, all
    const entityType = searchParams.get("type"); // venue, catering, all

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case "all":
        startDate = new Date(0);
        break;
    }

    // Get owner's venues and caterers
    const [venues, caterers] = await Promise.all([
      prisma.venue.findMany({
        where: { ownerId: userId },
        select: { id: true, name: true, viewCount: true, inquiryCount: true, weeklyViews: true },
      }),
      prisma.caterer.findMany({
        where: { ownerId: userId },
        select: { id: true, name: true, viewCount: true, inquiryCount: true, weeklyViews: true },
      }),
    ]);

    const venueIds = venues.map(v => v.id);
    const catererIds = caterers.map(c => c.id);

    // Build booking filters
    const bookingWhere: any = {
      createdAt: { gte: startDate },
      OR: [],
    };

    if (entityType !== "catering" && venueIds.length > 0) {
      bookingWhere.OR.push({ venueId: { in: venueIds } });
    }
    if (entityType !== "venue" && catererIds.length > 0) {
      bookingWhere.OR.push({ catererId: { in: catererIds } });
    }

    if (bookingWhere.OR.length === 0) {
      // No venues or caterers
      return NextResponse.json({
        summary: {
          totalRevenue: 0,
          totalBookings: 0,
          confirmedBookings: 0,
          pendingBookings: 0,
          cancelledBookings: 0,
          totalViews: 0,
          totalInquiries: 0,
          conversionRate: 0,
          avgBookingValue: 0,
        },
        venues: [],
        caterers: [],
        revenueChart: [],
        bookingsByStatus: {},
        topPerformers: [],
        recentBookings: [],
        upcomingEvents: [],
      });
    }

    // Get bookings
    const bookings = await prisma.booking.findMany({
      where: bookingWhere,
      include: {
        venue: { select: { id: true, name: true } },
        caterer: { select: { id: true, name: true } },
        payments: { where: { status: "COMPLETED" } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate summary metrics
    const confirmedBookings = bookings.filter(b => b.status === "CONFIRMED" || b.status === "COMPLETED");
    const pendingBookings = bookings.filter(b => b.status === "PENDING");
    const cancelledBookings = bookings.filter(b => b.status === "CANCELLED");

    const totalRevenue = bookings
      .filter(b => b.status !== "CANCELLED")
      .reduce((sum, b) => {
        const paid = b.payments.reduce((s, p) => s + p.amount, 0);
        return sum + paid;
      }, 0);

    const totalViews = venues.reduce((sum, v) => sum + v.viewCount, 0) +
                       caterers.reduce((sum, c) => sum + c.viewCount, 0);
    
    const totalInquiries = venues.reduce((sum, v) => sum + v.inquiryCount, 0) +
                           caterers.reduce((sum, c) => sum + c.inquiryCount, 0);

    const avgBookingValue = confirmedBookings.length > 0
      ? totalRevenue / confirmedBookings.length
      : 0;

    const conversionRate = totalViews > 0
      ? (confirmedBookings.length / totalViews) * 100
      : 0;

    // Revenue chart data (group by day/week/month based on period)
    const revenueChart = generateRevenueChart(bookings, period);

    // Bookings by status
    const bookingsByStatus = {
      confirmed: confirmedBookings.length,
      pending: pendingBookings.length,
      cancelled: cancelledBookings.length,
      completed: bookings.filter(b => b.status === "COMPLETED").length,
    };

    // Top performers (venues/caterers by revenue)
    const venueRevenue = new Map<string, { name: string; revenue: number; bookings: number }>();
    const catererRevenue = new Map<string, { name: string; revenue: number; bookings: number }>();

    bookings.forEach(b => {
      if (b.venue && b.status !== "CANCELLED") {
        const existing = venueRevenue.get(b.venue.id) || { name: b.venue.name, revenue: 0, bookings: 0 };
        const paid = b.payments.reduce((s, p) => s + p.amount, 0);
        venueRevenue.set(b.venue.id, {
          name: b.venue.name,
          revenue: existing.revenue + paid,
          bookings: existing.bookings + 1,
        });
      }
      if (b.caterer && b.status !== "CANCELLED") {
        const existing = catererRevenue.get(b.caterer.id) || { name: b.caterer.name, revenue: 0, bookings: 0 };
        const paid = b.payments.reduce((s, p) => s + p.amount, 0);
        catererRevenue.set(b.caterer.id, {
          name: b.caterer.name,
          revenue: existing.revenue + paid,
          bookings: existing.bookings + 1,
        });
      }
    });

    const topPerformers = [
      ...Array.from(venueRevenue.entries()).map(([id, data]) => ({ id, type: "venue", ...data })),
      ...Array.from(catererRevenue.entries()).map(([id, data]) => ({ id, type: "caterer", ...data })),
    ].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Recent bookings
    const recentBookings = bookings.slice(0, 10).map(b => ({
      id: b.id,
      bookingNumber: b.bookingNumber,
      type: b.type,
      status: b.status,
      customerName: b.customerName,
      eventDate: b.eventDate,
      totalAmount: b.totalAmount,
      entityName: b.venue?.name || b.caterer?.name,
      createdAt: b.createdAt,
    }));

    // Upcoming events (next 30 days)
    const upcomingEvents = bookings
      .filter(b => {
        const eventDate = new Date(b.eventDate);
        return eventDate >= now && eventDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) &&
               b.status === "CONFIRMED";
      })
      .map(b => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        customerName: b.customerName,
        eventDate: b.eventDate,
        guestCount: b.guestCount,
        entityName: b.venue?.name || b.caterer?.name,
      }))
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
      .slice(0, 10);

    // Get pending payouts
    const pendingPayouts = await prisma.payout.aggregate({
      where: {
        ownerId: userId,
        status: { in: ["PENDING", "PROCESSING"] },
      },
      _sum: { amount: true },
      _count: true,
    });

    // Get completed payouts this period
    const completedPayouts = await prisma.payout.aggregate({
      where: {
        ownerId: userId,
        status: "COMPLETED",
        processedAt: { gte: startDate },
      },
      _sum: { amount: true },
    });

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalBookings: bookings.length,
        confirmedBookings: confirmedBookings.length,
        pendingBookings: pendingBookings.length,
        cancelledBookings: cancelledBookings.length,
        totalViews,
        totalInquiries,
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgBookingValue: Math.round(avgBookingValue),
        pendingPayoutAmount: pendingPayouts._sum.amount || 0,
        pendingPayoutCount: pendingPayouts._count,
        completedPayoutAmount: completedPayouts._sum.amount || 0,
      },
      venues: venues.map(v => ({
        ...v,
        revenue: venueRevenue.get(v.id)?.revenue || 0,
        bookings: venueRevenue.get(v.id)?.bookings || 0,
      })),
      caterers: caterers.map(c => ({
        ...c,
        revenue: catererRevenue.get(c.id)?.revenue || 0,
        bookings: catererRevenue.get(c.id)?.bookings || 0,
      })),
      revenueChart,
      bookingsByStatus,
      topPerformers,
      recentBookings,
      upcomingEvents,
    });
  } catch (error) {
    console.error("Error fetching owner analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

// Helper function to generate revenue chart data
function generateRevenueChart(bookings: any[], period: string) {
  const chart: { date: string; revenue: number; bookings: number }[] = [];
  const dataMap = new Map<string, { revenue: number; bookings: number }>();

  // Determine grouping
  const groupBy = period === "7d" ? "day" : period === "30d" ? "day" : period === "90d" ? "week" : "month";

  bookings
    .filter(b => b.status !== "CANCELLED")
    .forEach(b => {
      const date = new Date(b.createdAt);
      let key: string;

      if (groupBy === "day") {
        key = date.toISOString().split("T")[0];
      } else if (groupBy === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }

      const existing = dataMap.get(key) || { revenue: 0, bookings: 0 };
      const paid = b.payments?.reduce((s: number, p: any) => s + p.amount, 0) || 0;
      dataMap.set(key, {
        revenue: existing.revenue + paid,
        bookings: existing.bookings + 1,
      });
    });

  // Convert to array and sort
  return Array.from(dataMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
