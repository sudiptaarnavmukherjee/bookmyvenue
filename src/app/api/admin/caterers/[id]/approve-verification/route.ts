import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { buildCatererVerificationNotes, parseCatererVerificationNotes } from "@/lib/verification";
import { sendTemplatedEmail } from "@/lib/email-templates";

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

    // Notify the caterer owner by email (non-blocking)
    try {
      const ownerRecord = await prisma.caterer.findUnique({
        where: { id },
        select: { owner: { select: { email: true, name: true } } },
      });
      const ownerEmail = ownerRecord?.owner?.email;
      const ownerName = ownerRecord?.owner?.name ?? "Caterer Owner";
      if (ownerEmail) {
        sendTemplatedEmail({
          to: ownerEmail,
          templateName: "caterer_verification_approved",
          subject: `Your caterer has been verified! 🎉`,
          variables: {
            ownerName,
            catererName: caterer.name ?? "your caterer",
            adminNote: notes || "Approved by admin",
          },
          fallbackHtml: `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
              <h2 style="color:#16a34a">Congratulations! Your Caterer is Verified</h2>
              <p>Hi ${ownerName},</p>
              <p>Your caterer <strong>${caterer.name}</strong> has been verified and is now enabled for online bookings.</p>
              <p><strong>Admin note:</strong> ${notes || "Approved by admin"}</p>
              <p style="margin-top:16px">Log in to your catering owner dashboard to start receiving bookings!</p>
              <p style="color:#6b7280;font-size:13px">Questions? Contact support@shubhspace.com</p>
            </div>
          `,
        }).catch((e) => console.error("Verification approval email error:", e));
      }
    } catch (emailErr) {
      console.error("Owner email lookup error (approve):", emailErr);
    }

    return NextResponse.json({ success: true, caterer });
  } catch (error) {
    console.error("Error approving verification:", error);
    return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
  }
}
