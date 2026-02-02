import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { PayoutStatus, Prisma } from "@prisma/client";

// GET /api/admin/payouts - Get all payout requests
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as PayoutStatus | null;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Prisma.PayoutWhereInput = status ? { status } : {};

    const [payouts, total, stats] = await Promise.all([
      prisma.payout.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
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
      }),
      prisma.payout.count({ where }),
      prisma.payout.groupBy({
        by: ["status"],
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    // Calculate summary stats
    const summary = {
      pending: { count: 0, amount: 0 },
      processing: { count: 0, amount: 0 },
      completed: { count: 0, amount: 0 },
      failed: { count: 0, amount: 0 },
    };

    stats.forEach((s) => {
      const key = s.status.toLowerCase() as keyof typeof summary;
      if (summary[key]) {
        summary[key] = {
          count: s._count,
          amount: s._sum.amount || 0,
        };
      }
    });

    return NextResponse.json({
      payouts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary,
    });
  } catch (error) {
    console.error("Error fetching payouts:", error);
    return NextResponse.json(
      { error: "Failed to fetch payouts" },
      { status: 500 }
    );
  }
}
