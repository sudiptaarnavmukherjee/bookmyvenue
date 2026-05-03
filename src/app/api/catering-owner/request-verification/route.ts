import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// POST - Caterer owner requests verification for one of their caterers
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "CATERING_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { catererId } = body;

    if (!catererId) {
      return NextResponse.json({ error: "catererId is required" }, { status: 400 });
    }

    // Ensure this caterer belongs to the requesting owner
    const caterer = await prisma.caterer.findFirst({
      where: { id: catererId, ownerId: session.user.id, isActive: true },
      select: {
        id: true,
        isVerified: true,
        bookingEnabled: true,
        verificationRequestedAt: true,
      },
    });

    if (!caterer) {
      return NextResponse.json({ error: "Caterer not found" }, { status: 404 });
    }

    if (caterer.isVerified && caterer.bookingEnabled) {
      return NextResponse.json({ error: "Caterer is already verified and booking-enabled" }, { status: 400 });
    }

    if (caterer.verificationRequestedAt) {
      return NextResponse.json({ error: "Verification already requested — admin will review shortly" }, { status: 400 });
    }

    const updated = await prisma.caterer.update({
      where: { id: catererId },
      data: { verificationRequestedAt: new Date() },
      select: { id: true, verificationRequestedAt: true },
    });

    return NextResponse.json({ success: true, caterer: updated });
  } catch (error) {
    console.error("Error requesting verification:", error);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}
