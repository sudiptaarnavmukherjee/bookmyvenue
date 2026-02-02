import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for payout request
const payoutRequestSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  bankAccountNumber: z.string().optional(),
  bankIfscCode: z.string().optional(),
  bankAccountName: z.string().optional(),
  upiId: z.string().optional(),
  transferMode: z.enum(["NEFT", "IMPS", "UPI"]).default("NEFT"),
});

// GET /api/owner/payouts - Get payout history
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["VENUE_OWNER", "CATERING_OWNER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");

    const where = {
      ownerId: session.user.id,
      ...(status && { status }),
    };

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.payout.count({ where }),
    ]);

    return NextResponse.json({
      payouts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching payouts:", error);
    return NextResponse.json(
      { error: "Failed to fetch payouts" },
      { status: 500 }
    );
  }
}

// POST /api/owner/payouts - Request a payout
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["VENUE_OWNER", "CATERING_OWNER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Only owners can request payouts" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = payoutRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Validate payment details
    if (data.transferMode === "UPI" && !data.upiId) {
      return NextResponse.json(
        { error: "UPI ID is required for UPI transfer" },
        { status: 400 }
      );
    }

    if (
      (data.transferMode === "NEFT" || data.transferMode === "IMPS") &&
      (!data.bankAccountNumber || !data.bankIfscCode)
    ) {
      return NextResponse.json(
        { error: "Bank account details are required" },
        { status: 400 }
      );
    }

    // Get owner's properties
    const [venues, caterers] = await Promise.all([
      prisma.venue.findMany({
        where: { ownerId: session.user.id },
        select: { id: true },
      }),
      prisma.caterer.findMany({
        where: { ownerId: session.user.id },
        select: { id: true },
      }),
    ]);

    const venueIds = venues.map((v) => v.id);
    const catererIds = caterers.map((c) => c.id);

    // Check pending payout amount
    const pendingPayments = await prisma.payment.aggregate({
      where: {
        status: "COMPLETED",
        isOwnerPaid: false,
        booking: {
          OR: [
            { venueId: { in: venueIds } },
            { catererId: { in: catererIds } },
          ],
        },
      },
      _sum: { ownerAmount: true },
    });

    const availableAmount = pendingPayments._sum.ownerAmount || 0;

    if (data.amount > availableAmount) {
      return NextResponse.json(
        { error: `Maximum available amount for payout is ₹${availableAmount.toLocaleString("en-IN")}` },
        { status: 400 }
      );
    }

    // Minimum payout amount (₹1000)
    const minPayout = 1000;
    if (data.amount < minPayout) {
      return NextResponse.json(
        { error: `Minimum payout amount is ₹${minPayout.toLocaleString("en-IN")}` },
        { status: 400 }
      );
    }

    // Check for pending payout request
    const pendingPayout = await prisma.payout.findFirst({
      where: {
        ownerId: session.user.id,
        status: "PENDING",
      },
    });

    if (pendingPayout) {
      return NextResponse.json(
        { error: "You already have a pending payout request" },
        { status: 400 }
      );
    }

    // Get payments to be included in this payout
    const paymentsToPayout = await prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        isOwnerPaid: false,
        booking: {
          OR: [
            { venueId: { in: venueIds } },
            { catererId: { in: catererIds } },
          ],
        },
      },
      orderBy: { paidAt: "asc" },
    });

    // Calculate totals
    let totalGross = 0;
    let totalPlatformFee = 0;
    const paymentIds: string[] = [];

    for (const payment of paymentsToPayout) {
      if (totalGross + (payment.ownerAmount || 0) <= data.amount) {
        totalGross += payment.ownerAmount || 0;
        totalPlatformFee += payment.platformFee || 0;
        paymentIds.push(payment.id);
      }
      if (totalGross >= data.amount) break;
    }

    // Determine period
    const oldestPayment = paymentsToPayout[0];
    const newestPayment = paymentsToPayout[paymentsToPayout.length - 1];

    // Create payout request
    const payout = await prisma.payout.create({
      data: {
        ownerId: session.user.id,
        amount: totalGross,
        status: "PENDING",
        bankAccountNumber: data.bankAccountNumber,
        bankIfscCode: data.bankIfscCode,
        bankAccountName: data.bankAccountName,
        upiId: data.upiId,
        transferMode: data.transferMode,
        periodStart: oldestPayment?.paidAt || new Date(),
        periodEnd: newestPayment?.paidAt || new Date(),
        totalBookings: paymentIds.length,
        totalGross,
        platformFee: totalPlatformFee,
      },
    });

    // Mark payments as pending payout
    // Note: We don't mark as paid until admin processes the payout

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        amount: payout.amount,
        status: payout.status,
        transferMode: payout.transferMode,
        createdAt: payout.createdAt,
      },
      message: "Payout request submitted. It will be processed within 3-5 business days.",
    });
  } catch (error) {
    console.error("Error requesting payout:", error);
    return NextResponse.json(
      { error: "Failed to request payout" },
      { status: 500 }
    );
  }
}
