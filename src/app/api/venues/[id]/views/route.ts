import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// POST - Track venue view
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: venueId } = await params;

    // Update venue view count
    const venue = await prisma.venue.update({
      where: { id: venueId },
      data: {
        viewCount: { increment: 1 },
        weeklyViews: { increment: 1 },
      },
      select: {
        id: true,
        viewCount: true,
        area: true,
        city: true,
      },
    });

    // Also update area view count if area exists
    if (venue.area) {
      await prisma.area.updateMany({
        where: { name: venue.area },
        data: { totalViews: { increment: 1 } },
      });
    }

    // Record in ViewAnalytics for detailed tracking
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingRecord = await prisma.viewAnalytics.findFirst({
      where: {
        venueId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (existingRecord) {
      await prisma.viewAnalytics.update({
        where: { id: existingRecord.id },
        data: { viewCount: { increment: 1 } },
      });
    } else {
      await prisma.viewAnalytics.create({
        data: {
          venueId,
          area: venue.area,
          city: venue.city,
          date: today,
          viewCount: 1,
          uniqueViews: 1,
        },
      });
    }

    return NextResponse.json({
      success: true,
      viewCount: venue.viewCount,
    });
  } catch (error) {
    console.error("Error tracking venue view:", error);
    return NextResponse.json(
      { error: "Failed to track view" },
      { status: 500 }
    );
  }
}

// GET - Get venue view stats
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: venueId } = await params;

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: {
        viewCount: true,
        weeklyViews: true,
      },
    });

    if (!venue) {
      return NextResponse.json(
        { error: "Venue not found" },
        { status: 404 }
      );
    }

    // Get last 7 days of views
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyViews = await prisma.viewAnalytics.findMany({
      where: {
        venueId,
        date: { gte: sevenDaysAgo },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({
      success: true,
      totalViews: venue.viewCount,
      weeklyViews: venue.weeklyViews,
      dailyViews,
    });
  } catch (error) {
    console.error("Error getting venue views:", error);
    return NextResponse.json(
      { error: "Failed to get views" },
      { status: 500 }
    );
  }
}
