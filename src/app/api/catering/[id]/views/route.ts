import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// POST - Track caterer view
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: catererId } = await params;

    // Update caterer view count
    const caterer = await prisma.caterer.update({
      where: { id: catererId },
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
    if (caterer.area) {
      await prisma.area.updateMany({
        where: { name: caterer.area },
        data: { totalViews: { increment: 1 } },
      });
    }

    // Record in ViewAnalytics for detailed tracking
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingRecord = await prisma.viewAnalytics.findFirst({
      where: {
        catererId,
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
          catererId,
          area: caterer.area,
          city: caterer.city,
          date: today,
          viewCount: 1,
          uniqueViews: 1,
        },
      });
    }

    return NextResponse.json({
      success: true,
      viewCount: caterer.viewCount,
    });
  } catch (error) {
    console.error("Error tracking caterer view:", error);
    return NextResponse.json(
      { error: "Failed to track view" },
      { status: 500 }
    );
  }
}

// GET - Get caterer view stats
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: catererId } = await params;

    const caterer = await prisma.caterer.findUnique({
      where: { id: catererId },
      select: {
        viewCount: true,
        weeklyViews: true,
      },
    });

    if (!caterer) {
      return NextResponse.json(
        { error: "Caterer not found" },
        { status: 404 }
      );
    }

    // Get last 7 days of views
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyViews = await prisma.viewAnalytics.findMany({
      where: {
        catererId,
        date: { gte: sevenDaysAgo },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({
      success: true,
      totalViews: caterer.viewCount,
      weeklyViews: caterer.weeklyViews,
      dailyViews,
    });
  } catch (error) {
    console.error("Error getting caterer views:", error);
    return NextResponse.json(
      { error: "Failed to get views" },
      { status: 500 }
    );
  }
}
