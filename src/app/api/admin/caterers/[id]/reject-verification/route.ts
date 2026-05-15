import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { buildCatererVerificationNotes, parseCatererVerificationNotes } from "@/lib/verification";
import { sendTemplatedEmail } from "@/lib/email-templates";

// POST - Admin rejects a verification request: keeps caterer unverified, clears pending flag, stores admin reason
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
    const { reason } = body as { reason?: string };

    const existing = await prisma.caterer.findUnique({
      where: { id },
      select: {
        name: true,
        verificationNotes: true,
        verificationRequestedAt: true,
        owner: { select: { email: true, name: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Caterer not found" }, { status: 404 });
    }

    if (!existing.verificationRequestedAt) {
      return NextResponse.json({ error: "No pending verification request" }, { status: 400 });
    }

    const parsed = parseCatererVerificationNotes(existing.verificationNotes);
    const rejectedAt = new Date();

    const caterer = await prisma.caterer.update({
      where: { id },
      data: {
        verificationRequestedAt: null, // clear the pending flag so owner can resubmit
        verificationNotes: buildCatererVerificationNotes({
          status: "REJECTED",
          submittedAt: parsed?.submittedAt,
          rejectedAt: rejectedAt.toISOString(),
          ownerNote: parsed?.ownerNote || "",
          adminReviewNote: reason || "Rejected by admin",
          kycDocuments: parsed?.kycDocuments || [],
        }),
      },
    });

    // Notify owner by email (non-blocking)
    try {
      const ownerEmail = existing.owner?.email;
      const ownerName = existing.owner?.name ?? "Caterer Owner";
      if (ownerEmail) {
        sendTemplatedEmail({
          to: ownerEmail,
          templateName: "caterer_verification_rejected",
          subject: `Action Required: Caterer Verification Needs Resubmission`,
          variables: {
            ownerName,
            catererName: existing.name ?? "your caterer",
            adminReason: reason || "Please re-upload clearer KYC documents and try again.",
          },
          fallbackHtml: `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
              <h2 style="color:#dc2626">Verification Resubmission Required</h2>
              <p>Hi ${ownerName},</p>
              <p>We reviewed your verification request for <strong>${existing.name}</strong> and need some changes before we can approve it.</p>
              <p><strong>Reason:</strong> ${reason || "Please re-upload clearer KYC documents and try again."}</p>
              <p style="margin-top:16px">Please log in to your catering owner dashboard, update your KYC documents, and submit a new request.</p>
              <p style="color:#6b7280;font-size:13px">Questions? Contact support@shubhspace.com</p>
            </div>
          `,
        }).catch((e) => console.error("Verification rejection email error:", e));
      }
    } catch (emailErr) {
      console.error("Owner email lookup error (reject):", emailErr);
    }

    return NextResponse.json({ success: true, caterer });
  } catch (error) {
    console.error("Error rejecting verification:", error);
    return NextResponse.json({ error: "Failed to reject" }, { status: 500 });
  }
}
