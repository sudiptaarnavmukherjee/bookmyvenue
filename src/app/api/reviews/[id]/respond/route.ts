import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const ownerResponseSchema = z.object({
  response: z.string().min(10, "Response must be at least 10 characters").max(1000),
});

// POST - Owner responds to a review
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the review
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        venue: { select: { ownerId: true } },
        caterer: { select: { ownerId: true } },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Check if user is the owner
    const isOwner =
      (review.venue && review.venue.ownerId === user.id) ||
      (review.caterer && review.caterer.ownerId === user.id) ||
      user.role === "ADMIN";

    if (!isOwner) {
      return NextResponse.json(
        { error: "Only the owner can respond to reviews" },
        { status: 403 }
      );
    }

    // Check if already responded
    if (review.ownerResponse) {
      return NextResponse.json(
        { error: "You have already responded to this review" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = ownerResponseSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { response } = validationResult.data;

    // Update review with owner response
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        ownerResponse: response,
        ownerRespondedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ review: updatedReview });
  } catch (error) {
    console.error("Error responding to review:", error);
    return NextResponse.json(
      { error: "Failed to respond to review" },
      { status: 500 }
    );
  }
}

// DELETE - Owner or admin can delete response
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        venue: { select: { ownerId: true } },
        caterer: { select: { ownerId: true } },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const isOwner =
      (review.venue && review.venue.ownerId === user.id) ||
      (review.caterer && review.caterer.ownerId === user.id) ||
      user.role === "ADMIN";

    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        ownerResponse: null,
        ownerRespondedAt: null,
      },
    });

    return NextResponse.json({ review: updatedReview });
  } catch (error) {
    console.error("Error deleting response:", error);
    return NextResponse.json(
      { error: "Failed to delete response" },
      { status: 500 }
    );
  }
}
