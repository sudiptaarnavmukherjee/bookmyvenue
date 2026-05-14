import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { sendTemplatedEmail } from "@/lib/email-templates";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bookmyvenue-alpha.vercel.app";

async function sendOwnerInquiryNotification(params: {
  ownerEmail: string;
  ownerName?: string | null;
  listingName: string;
  listingType: "VENUE" | "CATERER";
  eventType?: string | null;
  message: string;
  guestCount?: number | null;
  budget?: number | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
}) {
  const sender = params.contactEmail || params.contactPhone || "Anonymous user";
  const fallbackHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
      <h2 style="margin-bottom: 8px;">New Inquiry Received</h2>
      <p style="margin-top: 0; color: #334155;">You have a new inquiry for your ${params.listingType.toLowerCase()} <strong>${params.listingName}</strong>.</p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin: 12px 0;">
        <p><strong>From:</strong> ${sender}</p>
        <p><strong>Event:</strong> ${params.eventType || "Not specified"}</p>
        <p><strong>Guest Count:</strong> ${params.guestCount ?? "Not specified"}</p>
        <p><strong>Budget:</strong> ${typeof params.budget === "number" ? `₹${params.budget.toLocaleString("en-IN")}` : "Not specified"}</p>
        <p><strong>Message:</strong> ${params.message}</p>
      </div>
      <p>Review this lead in your dashboard and respond quickly to improve conversion.</p>
      <p><a href="${APP_URL}/owner" style="display:inline-block;padding:10px 16px;background:#0b5fab;color:#fff;border-radius:6px;text-decoration:none;">Open Owner Dashboard</a></p>
    </div>
  `;

  await sendTemplatedEmail({
    to: params.ownerEmail,
    templateName: "OWNER_NEW_INQUIRY",
    subject: `New Inquiry - ${params.listingName} | Happily Eated`,
    variables: {},
    fallbackHtml,
  });
}

/**
 * POST /api/inquiries
 * Create a new user inquiry for a venue or caterer
 */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const userId = typeof token?.sub === "string" ? token.sub : null;

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
        userId,
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
        select: {
          ownerId: true,
          name: true,
          owner: { select: { email: true, name: true } },
        },
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

        if (venue.owner?.email) {
          await sendOwnerInquiryNotification({
            ownerEmail: venue.owner.email,
            ownerName: venue.owner.name,
            listingName: venue.name,
            listingType: "VENUE",
            eventType,
            message,
            guestCount,
            budget: budget ? parseFloat(budget) : null,
            contactEmail: email || null,
            contactPhone: phoneNumber || null,
          });
        }
      }
    }

    if (catererId) {
      const caterer = await prisma.caterer.findUnique({
        where: { id: catererId },
        select: {
          ownerId: true,
          name: true,
          owner: { select: { email: true, name: true } },
        },
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

        if (caterer.owner?.email) {
          await sendOwnerInquiryNotification({
            ownerEmail: caterer.owner.email,
            ownerName: caterer.owner.name,
            listingName: caterer.name,
            listingType: "CATERER",
            eventType,
            message,
            guestCount,
            budget: budget ? parseFloat(budget) : null,
            contactEmail: email || null,
            contactPhone: phoneNumber || null,
          });
        }
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
    const requesterId = typeof token?.sub === "string" ? token.sub : null;
    if (!requesterId) {
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
      if (venue?.ownerId === requesterId) {
        ownerId = venue.ownerId;
      }
    }

    if (catererId) {
      const caterer = await prisma.caterer.findUnique({
        where: { id: catererId },
        select: { ownerId: true },
      });
      if (caterer?.ownerId === requesterId) {
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
