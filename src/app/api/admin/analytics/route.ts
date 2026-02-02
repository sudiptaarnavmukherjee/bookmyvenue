import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "week";

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Get today's start for today's count
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Get week start for weekly count
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    // Top venues by view count
    const topVenues = await prisma.venue.findMany({
      where: { isActive: true },
      orderBy: { viewCount: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        slug: true,
        area: true,
        viewCount: true,
        weeklyViews: true,
      },
    });

    // Top caterers by view count
    const topCaterers = await prisma.caterer.findMany({
      where: { isActive: true },
      orderBy: { viewCount: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        slug: true,
        area: true,
        viewCount: true,
        weeklyViews: true,
      },
    });

    // Top areas by total views
    const topAreas = await prisma.area.findMany({
      where: { isActive: true },
      orderBy: { totalViews: "desc" },
      take: 8,
      select: {
        name: true,
        totalViews: true,
        venueCount: true,
        catererCount: true,
      },
    });

    // Total stats
    const [totalVenueViews, totalCatererViews] = await Promise.all([
      prisma.venue.aggregate({
        _sum: { viewCount: true },
        where: { isActive: true },
      }),
      prisma.caterer.aggregate({
        _sum: { viewCount: true },
        where: { isActive: true },
      }),
    ]);

    // Today's views from ViewAnalytics
    const todayViews = await prisma.viewAnalytics.aggregate({
      _sum: { viewCount: true },
      where: {
        date: { gte: todayStart },
      },
    });

    // Weekly views from ViewAnalytics
    const weeklyViews = await prisma.viewAnalytics.aggregate({
      _sum: { viewCount: true },
      where: {
        date: { gte: weekStart },
      },
    });

    // Recent view records for debugging/detailed view
    const recentViews = await prisma.viewAnalytics.findMany({
      where: {
        date: { gte: startDate },
      },
      orderBy: { date: "desc" },
      take: 20,
      include: {
        venue: {
          select: { name: true, slug: true },
        },
        caterer: {
          select: { name: true, slug: true },
        },
      },
    });

    return NextResponse.json({
      topVenues,
      topCaterers,
      topAreas,
      recentViews: recentViews.map((v) => ({
        id: v.id,
        venueId: v.venueId,
        catererId: v.catererId,
        venueName: v.venue?.name,
        catererName: v.caterer?.name,
        area: v.area,
        date: v.date.toISOString(),
        viewCount: v.viewCount,
      })),
      totalStats: {
        totalVenueViews: totalVenueViews._sum.viewCount || 0,
        totalCatererViews: totalCatererViews._sum.viewCount || 0,
        todayViews: todayViews._sum.viewCount || 0,
        weeklyViews: weeklyViews._sum.viewCount || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
