import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/analytics/events
 * Track user interactions: views, searches, inquiries, bookings
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, entityType, entityId, userId, metadata } = body;

    if (!eventType || !entityType || !entityId) {
      return NextResponse.json(
        { error: "Missing required fields: eventType, entityType, entityId" },
        { status: 400 }
      );
    }

    const event = await prisma.analyticsEvent.create({
      data: {
        eventType, // "VIEW", "SEARCH", "INQUIRY", "BOOKING", "SHARE"
        entityType, // "VENUE", "CATERER", "BOOKING"
        entityId,
        userId: userId || null,
        metadata: metadata || {},
        timestamp: new Date(),
      },
    });

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error) {
    console.error("Analytics event error:", error);
    return NextResponse.json(
      { error: "Failed to log analytics event" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/stats?entityType=VENUE&entityId=xxx
 * Get aggregated stats for a venue/caterer
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "Missing entityType and entityId" },
        { status: 400 }
      );
    }

    // Aggregate events for this entity
    const stats = await prisma.analyticsEvent.groupBy({
      by: ["eventType"],
      where: {
        entityType,
        entityId,
      },
      _count: true,
    });

    // Also get time-series data (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentEvents = await prisma.analyticsEvent.findMany({
      where: {
        entityType,
        entityId,
        timestamp: { gte: thirtyDaysAgo },
      },
      select: {
        eventType: true,
        timestamp: true,
      },
      orderBy: { timestamp: "desc" },
    });

    const aggregated = {
      views: stats.find((s) => s.eventType === "VIEW")?._count || 0,
      searches: stats.find((s) => s.eventType === "SEARCH")?._count || 0,
      inquiries: stats.find((s) => s.eventType === "INQUIRY")?._count || 0,
      bookings: stats.find((s) => s.eventType === "BOOKING")?._count || 0,
      shares: stats.find((s) => s.eventType === "SHARE")?._count || 0,
      recentTrend: recentEvents,
    };

    return NextResponse.json({ success: true, stats: aggregated }, { status: 200 });
  } catch (error) {
    console.error("Analytics stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
