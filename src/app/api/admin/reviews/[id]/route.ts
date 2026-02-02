import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema
const moderateReviewSchema = z.object({
  action: z.enum(["approve", "reject", "flag", "unflag", "delete"]),
  reason: z.string().optional(),
});

// POST /api/admin/reviews/[id] - Moderate a review
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validation = moderateReviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { action, reason } = validation.data;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        venue: { select: { id: true, name: true } },
        caterer: { select: { id: true, name: true } },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    let updateData: Record<string, unknown> = {};
    let auditAction = "";

    switch (action) {
      case "approve":
        updateData = { isApproved: true, isFlagged: false };
        auditAction = "REVIEW_APPROVED";
        break;
      case "reject":
        updateData = { isApproved: false };
        auditAction = "REVIEW_REJECTED";
        break;
      case "flag":
        updateData = { isFlagged: true };
        auditAction = "REVIEW_FLAGGED";
        break;
      case "unflag":
        updateData = { isFlagged: false };
        auditAction = "REVIEW_UNFLAGGED";
        break;
      case "delete":
        // Delete the review
        await prisma.review.delete({ where: { id } });

        // Update rating on venue/caterer
        if (review.venueId) {
          await updateVenueRating(review.venueId);
        }
        if (review.catererId) {
          await updateCatererRating(review.catererId);
        }

        // Create audit log
        await prisma.auditLog.create({
          data: {
            action: "REVIEW_DELETED",
            entityType: "REVIEW",
            entityId: id,
            userId: session.user.id,
            details: {
              reason,
              reviewRating: review.rating,
              reviewComment: review.comment?.substring(0, 100),
              venueName: review.venue?.name,
              catererName: review.caterer?.name,
            },
            previousValue: review,
          },
        });

        return NextResponse.json({
          success: true,
          message: "Review deleted",
        });
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: auditAction,
        entityType: "REVIEW",
        entityId: id,
        userId: session.user.id,
        details: {
          action,
          reason,
          reviewRating: review.rating,
        },
        previousValue: {
          isApproved: review.isApproved,
          isFlagged: review.isFlagged,
        },
        newValue: {
          isApproved: updatedReview.isApproved,
          isFlagged: updatedReview.isFlagged,
        },
      },
    });

    return NextResponse.json({
      success: true,
      review: updatedReview,
    });
  } catch (error) {
    console.error("Error moderating review:", error);
    return NextResponse.json(
      { error: "Failed to moderate review" },
      { status: 500 }
    );
  }
}

// Helper functions to update ratings
async function updateVenueRating(venueId: string) {
  const stats = await prisma.review.aggregate({
    where: {
      venueId,
      isApproved: true,
    },
    _avg: { rating: true },
    _count: true,
  });

  // Note: Venue model doesn't have rating field, so we skip this
  // If you want to add it, update the schema
}

async function updateCatererRating(catererId: string) {
  const stats = await prisma.review.aggregate({
    where: {
      catererId,
      isApproved: true,
    },
    _avg: { rating: true },
    _count: true,
  });

  await prisma.caterer.update({
    where: { id: catererId },
    data: {
      rating: stats._avg.rating || 0,
      totalReviews: stats._count,
    },
  });
}
