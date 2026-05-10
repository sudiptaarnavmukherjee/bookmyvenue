import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// POST - Tag owner to a caterer and enable booking
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: catererId } = await params;
    const body = await request.json();
    const { ownerId, email } = body;

    if (!ownerId && !email) {
      return NextResponse.json(
        { error: "ownerId or email is required" },
        { status: 400 }
      );
    }

    // Look up by email if provided
    const owner = ownerId
      ? await prisma.user.findUnique({ where: { id: ownerId } })
      : await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    if (!owner) {
      return NextResponse.json(
        { error: email ? `No user found with email: ${email}` : "Owner not found" },
        { status: 404 }
      );
    }

    // Block ADMIN and VENUE_OWNER from being tagged as catering owner
    if (owner.role === "ADMIN" || owner.role === "VENUE_OWNER") {
      return NextResponse.json(
        { error: `User "${owner.email}" has role "${owner.role}" and cannot be tagged as a catering owner.` },
        { status: 400 }
      );
    }

    // Auto-promote USER → CATERING_OWNER if needed
    const resolvedOwner =
      owner.role === "USER"
        ? await prisma.user.update({
            where: { id: owner.id },
            data: { role: "CATERING_OWNER" },
          })
        : owner;

    // Update caterer with owner and enable booking
    const caterer = await prisma.caterer.update({
      where: { id: catererId },
      data: {
        ownerId: resolvedOwner.id,
        taggedToOwnerId: resolvedOwner.id,
        bookingEnabled: true,
        isVerified: true,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const wasPromoted = owner.role === "USER";

    return NextResponse.json({
      success: true,
      message: wasPromoted
        ? `Owner tagged, account promoted to Catering Owner, and booking enabled`
        : `Owner tagged and booking enabled`,
      caterer,
      promoted: wasPromoted,
    });
  } catch (error) {
    console.error("Error tagging owner:", error);
    return NextResponse.json(
      { error: "Failed to tag owner" },
      { status: 500 }
    );
  }
}
