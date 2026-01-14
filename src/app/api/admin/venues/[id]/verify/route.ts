import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// POST - Verify or unverify a venue
export async function POST(
  request: Request,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const params = await segmentData.params;
    const { id } = params;
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { isVerified } = body;

    const venue = await prisma.venue.update({
      where: { id },
      data: { isVerified },
    });

    return NextResponse.json({ 
      message: isVerified ? "Venue verified successfully" : "Venue verification revoked",
      venue 
    });
  } catch (error) {
    console.error("Error verifying venue:", error);
    return NextResponse.json(
      { error: "Failed to update venue" },
      { status: 500 }
    );
  }
}
