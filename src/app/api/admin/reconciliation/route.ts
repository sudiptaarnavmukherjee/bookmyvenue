import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

function resolveDateRange(range: string) {
  const now = new Date();
  switch (range) {
    case "week":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "year":
      return new Date(now.getFullYear(), 0, 1);
    default:
      return new Date(0);
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "month";
    const startDate = resolveDateRange(range);

    const [
      approvedCancellations,
      completedRefunds,
      pendingOrProcessingRefunds,
      failedRefunds,
      payouts,
      completedPayments,
    ] = await Promise.all([
      prisma.cancellationRequest.findMany({
        where: {
          status: "APPROVED",
          approvedAt: { gte: startDate },
        },
        select: {
          id: true,
          bookingId: true,
          refundAmount: true,
          refundStatus: true,
          refundId: true,
          approvedAt: true,
          refundedAt: true,
          booking: {
            select: {
              bookingNumber: true,
              customerName: true,
              customerEmail: true,
              totalAmount: true,
            },
          },
        },
        orderBy: { approvedAt: "desc" },
      }),
      prisma.cancellationRequest.count({
        where: {
          status: "APPROVED",
          refundStatus: "COMPLETED",
          refundedAt: { gte: startDate },
        },
      }),
      prisma.cancellationRequest.count({
        where: {
          status: "APPROVED",
          refundStatus: { in: ["PENDING", "PROCESSING"] },
          approvedAt: { gte: startDate },
        },
      }),
      prisma.cancellationRequest.count({
        where: {
          status: "APPROVED",
          refundStatus: "FAILED",
          approvedAt: { gte: startDate },
        },
      }),
      prisma.payout.groupBy({
        by: ["status"],
        where: {
          createdAt: { gte: startDate },
        },
        _count: { _all: true },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: "COMPLETED",
          paidAt: { gte: startDate },
        },
        _count: { id: true },
        _sum: {
          amount: true,
          ownerAmount: true,
          platformFee: true,
        },
      }),
    ]);

    const mismatches = approvedCancellations.filter((c) => {
      const refundAmount = c.refundAmount || 0;
      const refundStatus = c.refundStatus || "PENDING";
      if (refundAmount <= 0) return false;
      return refundStatus !== "COMPLETED";
    });

    const payoutSummary = payouts.reduce(
      (acc, item) => {
        const key = item.status.toLowerCase();
        acc[key] = {
          count: item._count._all,
          amount: item._sum.amount || 0,
        };
        return acc;
      },
      {} as Record<string, { count: number; amount: number }>
    );

    return NextResponse.json({
      summary: {
        approvedCancellations: approvedCancellations.length,
        completedRefunds,
        pendingOrProcessingRefunds,
        failedRefunds,
        mismatchCount: mismatches.length,
        mismatchAmount: mismatches.reduce((sum, row) => sum + (row.refundAmount || 0), 0),
        completedPaymentCount: completedPayments._count.id || 0,
        completedPaymentAmount: completedPayments._sum.amount || 0,
        completedOwnerAmount: completedPayments._sum.ownerAmount || 0,
        completedPlatformFee: completedPayments._sum.platformFee || 0,
      },
      payoutSummary,
      mismatches: mismatches.map((m) => ({
        id: m.id,
        bookingId: m.bookingId,
        bookingNumber: m.booking.bookingNumber,
        customerName: m.booking.customerName,
        customerEmail: m.booking.customerEmail,
        bookingTotalAmount: m.booking.totalAmount,
        refundAmount: m.refundAmount,
        refundStatus: m.refundStatus || "PENDING",
        refundId: m.refundId,
        approvedAt: m.approvedAt,
        refundedAt: m.refundedAt,
      })),
    });
  } catch (error) {
    console.error("Reconciliation GET error:", error);
    return NextResponse.json({ error: "Failed to fetch reconciliation report" }, { status: 500 });
  }
}
