import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

/**
 * GET /api/owner/metrics
 * Get aggregated engagement metrics for an owner's venues/caterers
 */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const ownerId = typeof token?.sub === "string" ? token.sub : null;
    if (!ownerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get owner metrics
    let metrics = await prisma.ownerMetrics.findUnique({
      where: { ownerId },
    });

    // If no metrics yet, create empty ones
    if (!metrics) {
      metrics = await prisma.ownerMetrics.create({
        data: {
          ownerId,
          totalViews: 0,
          totalInquiries: 0,
          totalBookings: 0,
          totalRevenue: 0,
        },
      });
    }

    // Get all owner properties
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { role: true },
    });

    let properties: Array<{ id: string; name: string; slug: string; city: string; area: string | null }> = [];

    if (owner?.role === "VENUE_OWNER") {
      properties = await prisma.venue.findMany({
        where: { ownerId },
        select: { id: true, name: true, slug: true, city: true, area: true },
      });
    } else if (owner?.role === "CATERING_OWNER") {
      properties = await prisma.caterer.findMany({
        where: { ownerId },
        select: { id: true, name: true, slug: true, city: true, area: true },
      });
    }

    // Calculate conversion rates
    const conversionRate =
      metrics.totalViews > 0
        ? ((metrics.totalInquiries / metrics.totalViews) * 100).toFixed(2)
        : 0;

    const bookingRate =
      metrics.totalInquiries > 0
        ? ((metrics.totalBookings / metrics.totalInquiries) * 100).toFixed(2)
        : 0;

    // Get recent inquiries
    const inquiryWhere =
      owner?.role === "VENUE_OWNER"
        ? { venueId: { in: properties.map((p) => p.id) } }
        : owner?.role === "CATERING_OWNER"
          ? { catererId: { in: properties.map((p) => p.id) } }
          : undefined;

    const recentInquiries = inquiryWhere
      ? await prisma.userInquiry.findMany({
          where: inquiryWhere,
          take: 10,
          orderBy: { createdAt: "desc" },
        })
      : [];

    // Get recent analytics events
    const recentEvents = await prisma.analyticsEvent.findMany({
      where: {
        entityId: {
          in: properties.map((p) => p.id),
        },
      },
      take: 50,
      orderBy: { timestamp: "desc" },
    });

    return NextResponse.json(
      {
        success: true,
        metrics: {
          ...metrics,
          conversionRate: parseFloat(conversionRate as any),
          bookingRate: parseFloat(bookingRate as any),
        },
        properties,
        recentInquiries,
        recentEvents,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Owner metrics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/owner/metrics
 * Manually update owner metrics (admin only or system batch job)
 */
export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const ownerId = typeof token?.sub === "string" ? token.sub : null;
    if (!ownerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const updated = await prisma.ownerMetrics.upsert({
      where: { ownerId },
      update: body,
      create: { ownerId, ...body },
    });

    return NextResponse.json(
      { success: true, metrics: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Metrics update error:", error);
    return NextResponse.json(
      { error: "Failed to update metrics" },
      { status: 500 }
    );
  }
}
