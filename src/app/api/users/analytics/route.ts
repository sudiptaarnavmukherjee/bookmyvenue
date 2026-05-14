import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      bookings,
      wishlistCount,
      inquiryCount,
      inquiryStatusGroups,
      eventTypeGroups,
      userEvents,
    ] = await Promise.all([
      prisma.booking.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          bookingNumber: true,
          status: true,
          type: true,
          eventDate: true,
          createdAt: true,
          totalAmount: true,
          venue: { select: { name: true, city: true } },
          caterer: { select: { name: true, city: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.wishlist.count({ where: { userId: user.id } }),
      prisma.userInquiry.count({ where: { userId: user.id } }),
      prisma.userInquiry.groupBy({
        by: ["status"],
        where: { userId: user.id },
        _count: true,
      }),
      prisma.booking.groupBy({
        by: ["eventType"],
        where: { userId: user.id, eventType: { not: null } },
        _count: true,
      }),
      prisma.analyticsEvent.groupBy({
        by: ["eventType"],
        where: { userId: user.id },
        _count: true,
      }),
    ]);

    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter((b) => b.status === "CONFIRMED").length;
    const completedBookings = bookings.filter((b) => b.status === "COMPLETED").length;
    const pendingBookings = bookings.filter((b) => b.status === "PENDING").length;
    const cancelledBookings = bookings.filter((b) => b.status === "CANCELLED").length;

    const upcomingBookings = bookings.filter((b) => {
      const d = new Date(b.eventDate);
      return d >= now && (b.status === "PENDING" || b.status === "CONFIRMED");
    }).length;

    const totalSpend = bookings
      .filter((b) => b.status !== "CANCELLED")
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const monthlyMap = new Map<string, { bookings: number; spend: number }>();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap.set(key, { bookings: 0, spend: 0 });
    }

    bookings.forEach((b) => {
      if (b.createdAt < sixMonthsAgo) return;
      const d = new Date(b.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const prev = monthlyMap.get(key);
      if (prev) {
        prev.bookings += 1;
        prev.spend += b.totalAmount || 0;
      }
    });

    const monthlyTrend = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([month, value]) => ({ month, ...value }));

    const inquiryByStatus = inquiryStatusGroups.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = row._count;
      return acc;
    }, {});

    const eventTypePreference = eventTypeGroups
      .map((g) => ({ eventType: g.eventType || "OTHER", count: g._count }))
      .sort((a, b) => b.count - a.count);

    const engagement = userEvents.reduce<Record<string, number>>((acc, row) => {
      acc[row.eventType] = row._count;
      return acc;
    }, {});

    return NextResponse.json({
      stats: {
        totalBookings,
        upcomingBookings,
        completedBookings,
        confirmedBookings,
        pendingBookings,
        cancelledBookings,
        totalSpend,
        wishlistCount,
        inquiryCount,
      },
      monthlyTrend,
      inquiryByStatus,
      eventTypePreference,
      engagement,
      recentBookings: bookings.slice(0, 8),
    });
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
