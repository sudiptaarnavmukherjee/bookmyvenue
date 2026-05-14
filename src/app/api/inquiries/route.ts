import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

/**
 * POST /api/inquiries
 * Create a new user inquiry for a venue or caterer
 */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const userId = token?.sub || null;

    const body = await req.json();
    const {
      venueId,
      catererId,
      message,
      eventType,
      eventDate,
      guestCount,
      budget,
      phoneNumber,
      email,
    } = body;

    if (!message || (!venueId && !catererId)) {
      return NextResponse.json(
        { error: "Missing required fields: message and either venueId or catererId" },
        { status: 400 }
      );
    }

    // Create inquiry
    const inquiry = await prisma.userInquiry.create({
      data: {
        userId: userId || email || "ANONYMOUS",
        venueId: venueId || null,
        catererId: catererId || null,
        message,
        eventType: eventType || null,
        eventDate: eventDate ? new Date(eventDate) : null,
        guestCount: guestCount || null,
        budget: budget ? parseFloat(budget) : null,
        phoneNumber: phoneNumber || null,
        email: email || null,
        status: "PENDING",
      },
    });

    // Track inquiry event in analytics
    await prisma.analyticsEvent.create({
      data: {
        eventType: "INQUIRY",
        entityType: venueId ? "VENUE" : "CATERER",
        entityId: venueId || catererId || "",
        userId: userId || null,
        metadata: {
          eventType,
          guestCount,
          budget,
        },
      },
    });

    // Update owner metrics
    if (venueId) {
      const venue = await prisma.venue.findUnique({
        where: { id: venueId },
        select: { ownerId: true },
      });

      if (venue) {
        await prisma.ownerMetrics.upsert({
          where: { ownerId: venue.ownerId },
          update: {
            totalInquiries: { increment: 1 },
            inquiriesThisMonth: { increment: 1 },
            lastInquiryAt: new Date(),
          },
          create: {
            ownerId: venue.ownerId,
            totalInquiries: 1,
            inquiriesThisMonth: 1,
            lastInquiryAt: new Date(),
          },
        });
      }
    }

    if (catererId) {
      const caterer = await prisma.caterer.findUnique({
        where: { id: catererId },
        select: { ownerId: true },
      });

      if (caterer) {
        await prisma.ownerMetrics.upsert({
          where: { ownerId: caterer.ownerId },
          update: {
            totalInquiries: { increment: 1 },
            inquiriesThisMonth: { increment: 1 },
            lastInquiryAt: new Date(),
          },
          create: {
            ownerId: caterer.ownerId,
            totalInquiries: 1,
            inquiriesThisMonth: 1,
            lastInquiryAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json(
      { success: true, inquiry, message: "Inquiry sent successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Inquiry creation error:", error);
    return NextResponse.json(
      { error: "Failed to create inquiry" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/inquiries?venueId=xxx or ?catererId=xxx
 * Get inquiries for a venue/caterer (owner only)
 */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const venueId = searchParams.get("venueId");
    const catererId = searchParams.get("catererId");

    let ownerId: string | null = null;

    if (venueId) {
      const venue = await prisma.venue.findUnique({
        where: { id: venueId },
        select: { ownerId: true },
      });
      if (venue?.ownerId === token.sub) {
        ownerId = venue.ownerId;
      }
    }

    if (catererId) {
      const caterer = await prisma.caterer.findUnique({
        where: { id: catererId },
        select: { ownerId: true },
      });
      if (caterer?.ownerId === token.sub) {
        ownerId = caterer.ownerId;
      }
    }

    if (!ownerId) {
      return NextResponse.json(
        { error: "Not authorized to view these inquiries" },
        { status: 403 }
      );
    }

    const inquiries = await prisma.userInquiry.findMany({
      where: {
        OR: [
          ...(venueId ? [{ venueId }] : []),
          ...(catererId ? [{ catererId }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, inquiries }, { status: 200 });
  } catch (error) {
    console.error("Inquiry fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inquiries" },
      { status: 500 }
    );
  }
}
