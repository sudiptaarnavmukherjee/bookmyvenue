import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// GET all caterers for admin (including unverified)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caterers = await prisma.caterer.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: [
        { isVerified: "asc" }, // Unverified first
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ caterers });
  } catch (error) {
    console.error("Error fetching caterers for admin:", error);
    return NextResponse.json(
      { error: "Failed to fetch caterers" },
      { status: 500 }
    );
  }
}
