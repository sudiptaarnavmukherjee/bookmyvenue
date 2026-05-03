import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// GET - Fetch caterers owned by the current catering owner
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "CATERING_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caterers = await prisma.caterer.findMany({
      where: { ownerId: session.user.id, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        area: true,
        address: true,
        contactName: true,
        contactNumber: true,
        isPureVeg: true,
        cuisines: true,
        silverPrice: true,
        goldPrice: true,
        platinumPrice: true,
        minPlatePrice: true,
        images: true,
        coverImage: true,
        isAdminListed: true,
        isVerified: true,
        bookingEnabled: true,
        verificationRequestedAt: true,
        verificationNotes: true,
        viewCount: true,
        createdAt: true,
        _count: { select: { bookings: true, reviews: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ caterers });
  } catch (error) {
    console.error("Error fetching owner caterers:", error);
    return NextResponse.json({ error: "Failed to fetch caterers" }, { status: 500 });
  }
}
