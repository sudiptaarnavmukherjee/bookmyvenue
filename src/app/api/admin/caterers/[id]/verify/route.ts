import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// POST - Verify or unverify a caterer
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

    const caterer = await prisma.caterer.update({
      where: { id },
      data: { isVerified },
    });

    return NextResponse.json({ 
      message: isVerified ? "Caterer verified successfully" : "Caterer verification revoked",
      caterer 
    });
  } catch (error) {
    console.error("Error verifying caterer:", error);
    return NextResponse.json(
      { error: "Failed to update caterer" },
      { status: 500 }
    );
  }
}
