import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// PATCH /api/owner/venues/[id]/pricing
// Venue owners can update event-type pricing for their own venues
export async function PATCH(
  request: Request,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await segmentData.params;

    // Verify the venue belongs to this owner
    const venue = await prisma.venue.findFirst({
      where: { id, ownerId: session.user.id, deletedAt: null },
      select: { id: true },
    });

    if (!venue) {
      return NextResponse.json({ error: "Venue not found or access denied" }, { status: 404 });
    }

    const body = await request.json();

    // Only allow specific pricing fields — never allow ownerId, isVerified, isActive, etc.
    const allowedFields = [
      "marriagePrice",
      "birthdayPrice",
      "otherEventPrice",
      "primeDayPrice",
      "nonPrimeDayPrice",
      "primeDays",
      "priceMode",
      "exactPrice",
      "estimatedMinPrice",
      "estimatedMaxPrice",
    ];

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        const value = body[field];
        if (field === "primeDays" || field === "priceMode") {
          data[field] = value === "" ? null : String(value);
        } else {
          // Numeric price fields
          const num = value === "" || value === null ? null : parseFloat(value);
          data[field] = num !== null && isNaN(num) ? null : num;
        }
      }
    }

    const updated = await prisma.venue.update({
      where: { id },
      data,
      select: {
        id: true,
        priceMode: true,
        exactPrice: true,
        estimatedMinPrice: true,
        estimatedMaxPrice: true,
        marriagePrice: true,
        birthdayPrice: true,
        otherEventPrice: true,
        primeDayPrice: true,
        nonPrimeDayPrice: true,
        primeDays: true,
      },
    });

    return NextResponse.json({ venue: updated });
  } catch (error) {
    console.error("Error updating venue pricing:", error);
    return NextResponse.json({ error: "Failed to update pricing" }, { status: 500 });
  }
}

// GET /api/owner/venues/[id]/pricing — return current pricing for a venue
export async function GET(
  _request: Request,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await segmentData.params;

    const venue = await prisma.venue.findFirst({
      where: { id, ownerId: session.user.id, deletedAt: null },
      select: {
        id: true,
        name: true,
        priceMode: true,
        exactPrice: true,
        estimatedMinPrice: true,
        estimatedMaxPrice: true,
        marriagePrice: true,
        birthdayPrice: true,
        otherEventPrice: true,
        primeDayPrice: true,
        nonPrimeDayPrice: true,
        primeDays: true,
      },
    });

    if (!venue) {
      return NextResponse.json({ error: "Venue not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({ venue });
  } catch (error) {
    console.error("Error fetching venue pricing:", error);
    return NextResponse.json({ error: "Failed to fetch pricing" }, { status: 500 });
  }
}
