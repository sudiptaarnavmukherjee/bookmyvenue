import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// POST - Toggle booking status for a caterer
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
    const { enabled } = body;

    // Update caterer booking status
    const caterer = await prisma.caterer.update({
      where: { id: catererId },
      data: {
        bookingEnabled: enabled,
        // If enabling booking, also mark as verified
        ...(enabled && { isVerified: true }),
      },
    });

    return NextResponse.json({
      success: true,
      message: enabled ? "Booking enabled" : "Booking disabled",
      caterer,
    });
  } catch (error) {
    console.error("Error toggling booking:", error);
    return NextResponse.json(
      { error: "Failed to toggle booking" },
      { status: 500 }
    );
  }
}
