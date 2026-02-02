import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updatePromoSchema = z.object({
  description: z.string().optional(),
  discountValue: z.number().positive().optional(),
  maxDiscount: z.number().positive().optional(),
  minOrderValue: z.number().nonnegative().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().optional(),
  expiryDate: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
  applicableTo: z.enum(["ALL", "VENUE", "CATERING"]).optional(),
  applicableIds: z.string().optional(),
  forNewUsers: z.boolean().optional(),
});

// GET /api/promo-codes/[id] - Get promo code details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const promoCode = await prisma.promoCode.findUnique({
      where: { id },
      include: {
        usages: {
          take: 50,
          orderBy: { usedAt: "desc" },
        },
        _count: { select: { usages: true } },
      },
    });

    if (!promoCode) {
      return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
    }

    // Get usage statistics
    const stats = await prisma.promoCodeUsage.aggregate({
      where: { promoCodeId: id },
      _sum: { discountApplied: true, orderAmount: true },
      _count: true,
    });

    return NextResponse.json({
      promoCode,
      stats: {
        totalUsages: stats._count,
        totalDiscountGiven: stats._sum.discountApplied || 0,
        totalOrderValue: stats._sum.orderAmount || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching promo code:", error);
    return NextResponse.json(
      { error: "Failed to fetch promo code" },
      { status: 500 }
    );
  }
}

// PATCH /api/promo-codes/[id] - Update promo code
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = updatePromoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const existing = await prisma.promoCode.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
    }

    const data = validation.data;
    const updateData: any = { ...data };
    
    if (data.expiryDate) {
      updateData.expiryDate = new Date(data.expiryDate);
    }

    const promoCode = await prisma.promoCode.update({
      where: { id },
      data: updateData,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "PROMO_CODE_UPDATED",
        entityType: "PROMO_CODE",
        entityId: id,
        userId: session.user.id,
        previousValue: existing,
        newValue: promoCode,
      },
    });

    return NextResponse.json({ promoCode });
  } catch (error) {
    console.error("Error updating promo code:", error);
    return NextResponse.json(
      { error: "Failed to update promo code" },
      { status: 500 }
    );
  }
}

// DELETE /api/promo-codes/[id] - Delete promo code
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const promoCode = await prisma.promoCode.findUnique({
      where: { id },
      include: { _count: { select: { usages: true } } },
    });

    if (!promoCode) {
      return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
    }

    // If already used, just deactivate
    if (promoCode._count.usages > 0) {
      await prisma.promoCode.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        message: "Promo code deactivated (has existing usages)",
      });
    }

    // Delete if never used
    await prisma.promoCode.delete({ where: { id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "PROMO_CODE_DELETED",
        entityType: "PROMO_CODE",
        entityId: id,
        userId: session.user.id,
        details: { code: promoCode.code },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting promo code:", error);
    return NextResponse.json(
      { error: "Failed to delete promo code" },
      { status: 500 }
    );
  }
}
