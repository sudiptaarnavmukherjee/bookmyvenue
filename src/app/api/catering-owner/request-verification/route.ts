import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { buildCatererVerificationNotes, KycDocument } from "@/lib/verification";

// POST - Caterer owner requests verification for one of their caterers
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "CATERING_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { catererId, ownerNote, kycDocuments } = body as {
      catererId?: string;
      ownerNote?: string;
      kycDocuments?: KycDocument[];
    };

    if (!catererId) {
      return NextResponse.json({ error: "catererId is required" }, { status: 400 });
    }

    const validKycDocuments = (Array.isArray(kycDocuments) ? kycDocuments : []).filter((doc) => {
      return doc && typeof doc.label === "string" && typeof doc.url === "string" && doc.url.startsWith("http");
    });

    if (validKycDocuments.length === 0) {
      return NextResponse.json(
        { error: "Please upload at least one KYC document before requesting verification" },
        { status: 400 }
      );
    }

    const now = new Date();

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
      data: {
        verificationRequestedAt: now,
        verificationNotes: buildCatererVerificationNotes({
          status: "REQUESTED",
          submittedAt: now.toISOString(),
          ownerNote: ownerNote?.trim() || "",
          kycDocuments: validKycDocuments,
        }),
      },
      select: { id: true, verificationRequestedAt: true },
    });

    return NextResponse.json({ success: true, caterer: updated });
  } catch (error) {
    console.error("Error requesting verification:", error);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}
