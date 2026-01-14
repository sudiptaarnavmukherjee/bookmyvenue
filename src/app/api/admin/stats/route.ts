import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// GET admin stats
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalUsers,
      totalVenues,
      totalCaterers,
      pendingVenues,
      pendingCaterers,
      totalBookings,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.venue.count({ where: { deletedAt: null } }),
      prisma.caterer.count({ where: { deletedAt: null } }),
      prisma.venue.count({ where: { isVerified: false, deletedAt: null } }),
      prisma.caterer.count({ where: { isVerified: false, deletedAt: null } }),
      prisma.booking.count(),
    ]);

    return NextResponse.json({
      totalUsers,
      totalVenues,
      totalCaterers,
      pendingVenues,
      pendingCaterers,
      totalBookings,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
