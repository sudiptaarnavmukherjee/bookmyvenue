import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { buildCatererVerificationNotes, parseCatererVerificationNotes } from "@/lib/verification";

// POST - Admin approves a verification request: marks verified + enables booking + clears request timestamp
export async function POST(
  request: Request,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await segmentData.params;
    const body = await request.json();
    const { notes } = body as { notes?: string };

    const existing = await prisma.caterer.findUnique({
      where: { id },
      select: { verificationNotes: true },
    });

    const parsed = parseCatererVerificationNotes(existing?.verificationNotes);
    const reviewedAt = new Date();

    const caterer = await prisma.caterer.update({
      where: { id },
      data: {
        isVerified: true,
        bookingEnabled: true,
        verificationRequestedAt: null, // clear the pending flag
        verificationNotes: buildCatererVerificationNotes({
          status: "APPROVED",
          submittedAt: parsed?.submittedAt,
          approvedAt: reviewedAt.toISOString(),
          ownerNote: parsed?.ownerNote || "",
          adminReviewNote: notes || "Approved by admin",
          kycDocuments: parsed?.kycDocuments || [],
        }),
      },
    });

    return NextResponse.json({ success: true, caterer });
  } catch (error) {
    console.error("Error approving verification:", error);
    return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
  }
}
