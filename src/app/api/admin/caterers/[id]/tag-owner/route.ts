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
    const { ownerId } = body;

    if (!ownerId) {
      return NextResponse.json(
        { error: "Owner ID is required" },
        { status: 400 }
      );
    }

    // Verify owner exists and is a CATERING_OWNER
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
    });

    if (!owner) {
      return NextResponse.json(
        { error: "Owner not found" },
        { status: 404 }
      );
    }

    if (owner.role !== "CATERING_OWNER") {
      return NextResponse.json(
        { error: "User is not a catering owner" },
        { status: 400 }
      );
    }

    // Update caterer with owner and enable booking
    const caterer = await prisma.caterer.update({
      where: { id: catererId },
      data: {
        ownerId: ownerId,
        taggedToOwnerId: ownerId,
        bookingEnabled: true,
        isVerified: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Owner tagged and booking enabled",
      caterer,
    });
  } catch (error) {
    console.error("Error tagging owner:", error);
    return NextResponse.json(
      { error: "Failed to tag owner" },
      { status: 500 }
    );
  }
}
