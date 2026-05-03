import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

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

    const caterer = await prisma.caterer.update({
      where: { id },
      data: {
        isVerified: true,
        bookingEnabled: true,
        verificationRequestedAt: null, // clear the pending flag
        verificationNotes: notes || "Approved by admin",
      },
    });

    return NextResponse.json({ success: true, caterer });
  } catch (error) {
    console.error("Error approving verification:", error);
    return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
  }
}
