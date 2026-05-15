import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/owner/inquiries
 * Returns all inquiries across all venues and caterers owned by the requester.
 */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const ownerId = typeof token?.sub === "string" ? token.sub : null;
    if (!ownerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all venue IDs and caterer IDs that belong to this owner
    const [ownerVenues, ownerCaterers] = await Promise.all([
      prisma.venue.findMany({
        where: { ownerId },
        select: { id: true, name: true },
      }),
      prisma.caterer.findMany({
        where: { ownerId },
        select: { id: true, name: true },
      }),
    ]);

    const venueIds = ownerVenues.map((v) => v.id);
    const catererIds = ownerCaterers.map((c) => c.id);

    if (venueIds.length === 0 && catererIds.length === 0) {
      return NextResponse.json({ inquiries: [] });
    }

    const inquiries = await prisma.userInquiry.findMany({
      where: {
        OR: [
          ...(venueIds.length ? [{ venueId: { in: venueIds } }] : []),
          ...(catererIds.length ? [{ catererId: { in: catererIds } }] : []),
        ],
      },
      include: {
        venue: { select: { id: true, name: true } },
        caterer: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ inquiries });
  } catch (error) {
    console.error("Owner inquiries fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch inquiries" }, { status: 500 });
  }
}
