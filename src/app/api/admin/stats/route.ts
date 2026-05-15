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
      pendingVerifications,
      revenueAgg,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.venue.count({ where: { deletedAt: null } }),
      prisma.caterer.count({ where: { isActive: true } }),
      prisma.venue.count({ where: { isVerified: false, deletedAt: null } }),
      prisma.caterer.count({ where: { isVerified: false, isActive: true } }),
      prisma.booking.count(),
      prisma.caterer.count({
        where: {
          isActive: true,
          isVerified: false,
          verificationRequestedAt: { not: null },
        },
      }),
      prisma.booking.aggregate({
        where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
        _sum: { totalAmount: true },
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalVenues,
      totalCaterers,
      pendingVenues,
      pendingCaterers,
      totalBookings,
      pendingVerifications,
      totalRevenue: revenueAgg._sum.totalAmount ?? 0,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
