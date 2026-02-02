import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema
const processPayoutSchema = z.object({
  action: z.enum(["approve", "reject", "complete", "fail"]),
  notes: z.string().optional(),
  transactionId: z.string().optional(), // External transfer reference
});

// GET /api/admin/payouts/[id] - Get payout details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const payout = await prisma.payout.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            venues: {
              select: { id: true, name: true },
            },
            caterings: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!payout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    }

    // Get payments included in this payout period
    const venueIds = payout.owner.venues.map((v) => v.id);
    const catererIds = payout.owner.caterings.map((c) => c.id);

    const payments = await prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        paidAt: {
          gte: payout.periodStart,
          lte: payout.periodEnd,
        },
        booking: {
          OR: [
            { venueId: { in: venueIds } },
            { catererId: { in: catererIds } },
          ],
        },
      },
      include: {
        booking: {
          select: {
            bookingNumber: true,
            customerName: true,
            eventDate: true,
            venue: { select: { name: true } },
            caterer: { select: { name: true } },
          },
        },
      },
      orderBy: { paidAt: "asc" },
    });

    return NextResponse.json({
      payout,
      payments: payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        ownerAmount: p.ownerAmount,
        platformFee: p.platformFee,
        method: p.method,
        paidAt: p.paidAt,
        booking: {
          bookingNumber: p.booking.bookingNumber,
          customerName: p.booking.customerName,
          eventDate: p.booking.eventDate,
          propertyName: p.booking.venue?.name || p.booking.caterer?.name,
        },
      })),
    });
  } catch (error) {
    console.error("Error fetching payout:", error);
    return NextResponse.json(
      { error: "Failed to fetch payout" },
      { status: 500 }
    );
  }
}

// POST /api/admin/payouts/[id] - Process payout (approve/reject/complete)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validation = processPayoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { action, notes, transactionId } = validation.data;

    const payout = await prisma.payout.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            venues: { select: { id: true } },
            caterings: { select: { id: true } },
          },
        },
      },
    });

    if (!payout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    }

    let updateData: Record<string, unknown> = {};
    let auditAction = "";

    switch (action) {
      case "approve":
        if (payout.status !== "PENDING") {
          return NextResponse.json(
            { error: "Can only approve pending payouts" },
            { status: 400 }
          );
        }
        updateData = { status: "PROCESSING" };
        auditAction = "PAYOUT_APPROVED";
        break;

      case "reject":
        if (!["PENDING", "PROCESSING"].includes(payout.status)) {
          return NextResponse.json(
            { error: "Cannot reject this payout" },
            { status: 400 }
          );
        }
        updateData = {
          status: "FAILED",
          failedAt: new Date(),
          failureReason: notes || "Rejected by admin",
        };
        auditAction = "PAYOUT_REJECTED";
        break;

      case "complete":
        if (payout.status !== "PROCESSING") {
          return NextResponse.json(
            { error: "Can only complete processing payouts" },
            { status: 400 }
          );
        }
        updateData = {
          status: "COMPLETED",
          processedAt: new Date(),
          razorpayPayoutId: transactionId,
        };
        auditAction = "PAYOUT_COMPLETED";

        // Mark payments as paid to owner
        const venueIds = payout.owner.venues.map((v) => v.id);
        const catererIds = payout.owner.caterings.map((c) => c.id);

        await prisma.payment.updateMany({
          where: {
            status: "COMPLETED",
            isOwnerPaid: false,
            paidAt: {
              gte: payout.periodStart,
              lte: payout.periodEnd,
            },
            booking: {
              OR: [
                { venueId: { in: venueIds } },
                { catererId: { in: catererIds } },
              ],
            },
          },
          data: {
            isOwnerPaid: true,
            ownerPaidAt: new Date(),
          },
        });
        break;

      case "fail":
        if (payout.status !== "PROCESSING") {
          return NextResponse.json(
            { error: "Can only fail processing payouts" },
            { status: 400 }
          );
        }
        updateData = {
          status: "FAILED",
          failedAt: new Date(),
          failureReason: notes || "Transfer failed",
        };
        auditAction = "PAYOUT_FAILED";
        break;
    }

    const updatedPayout = await prisma.payout.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: auditAction,
        entityType: "PAYOUT",
        entityId: id,
        userId: session.user.id,
        details: {
          action,
          notes,
          transactionId,
          previousStatus: payout.status,
          newStatus: updatedPayout.status,
        },
      },
    });

    return NextResponse.json({
      success: true,
      payout: updatedPayout,
    });
  } catch (error) {
    console.error("Error processing payout:", error);
    return NextResponse.json(
      { error: "Failed to process payout" },
      { status: 500 }
    );
  }
}
