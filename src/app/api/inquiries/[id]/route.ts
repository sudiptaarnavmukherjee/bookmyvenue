import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["PENDING", "CONTACTED", "INTERESTED", "BOOKED", "REJECTED"] as const;
type InquiryStatus = (typeof VALID_STATUSES)[number];

/**
 * PATCH /api/inquiries/[id]
 * Owner updates the status of an inquiry on their own listing.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getToken({ req });
    const ownerId = typeof token?.sub === "string" ? token.sub : null;
    if (!ownerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const status: InquiryStatus = body.status;

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // Fetch the inquiry and verify the requester owns the related listing
    const inquiry = await prisma.userInquiry.findUnique({
      where: { id },
      include: {
        venue: { select: { ownerId: true } },
        caterer: { select: { ownerId: true } },
      },
    });

    if (!inquiry) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    const listingOwnerId = inquiry.venue?.ownerId ?? inquiry.caterer?.ownerId ?? null;
    if (listingOwnerId !== ownerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.userInquiry.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, inquiry: updated });
  } catch (error) {
    console.error("Inquiry PATCH error:", error);
    return NextResponse.json({ error: "Failed to update inquiry" }, { status: 500 });
  }
}
