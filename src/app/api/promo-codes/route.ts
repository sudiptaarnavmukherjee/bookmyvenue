import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schemas
const createPromoSchema = z.object({
  code: z.string().min(3).max(20).transform(s => s.toUpperCase()),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FLAT"]),
  discountValue: z.number().positive(),
  maxDiscount: z.number().positive().optional(),
  minOrderValue: z.number().nonnegative().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().default(1),
  startDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  applicableTo: z.enum(["ALL", "VENUE", "CATERING"]).default("ALL"),
  applicableIds: z.string().optional(),
  forNewUsers: z.boolean().default(false),
});

// GET /api/promo-codes - List promo codes (admin) or validate code (user)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const orderAmount = parseFloat(searchParams.get("amount") || "0");
    const bookingType = searchParams.get("type") as "VENUE" | "CATERING" | null;

    // If code provided, validate it
    if (code) {
      const promoCode = await prisma.promoCode.findUnique({
        where: { code: code.toUpperCase() },
        include: {
          usages: session?.user ? {
            where: { userId: session.user.id },
          } : false,
        },
      });

      if (!promoCode) {
        return NextResponse.json(
          { valid: false, error: "Invalid promo code" },
          { status: 404 }
        );
      }

      // Check if active
      if (!promoCode.isActive) {
        return NextResponse.json(
          { valid: false, error: "This promo code is no longer active" },
          { status: 400 }
        );
      }

      // Check expiry
      if (promoCode.expiryDate && new Date(promoCode.expiryDate) < new Date()) {
        return NextResponse.json(
          { valid: false, error: "This promo code has expired" },
          { status: 400 }
        );
      }

      // Check start date
      if (promoCode.startDate && new Date(promoCode.startDate) > new Date()) {
        return NextResponse.json(
          { valid: false, error: "This promo code is not yet active" },
          { status: 400 }
        );
      }

      // Check usage limit
      if (promoCode.usageLimit && promoCode.usedCount >= promoCode.usageLimit) {
        return NextResponse.json(
          { valid: false, error: "This promo code has reached its usage limit" },
          { status: 400 }
        );
      }

      // Check per-user limit
      if (session?.user && promoCode.usages) {
        const userUsages = Array.isArray(promoCode.usages) ? promoCode.usages.length : 0;
        if (userUsages >= promoCode.perUserLimit) {
          return NextResponse.json(
            { valid: false, error: "You have already used this promo code" },
            { status: 400 }
          );
        }
      }

      // Check minimum order value
      if (promoCode.minOrderValue && orderAmount < promoCode.minOrderValue) {
        return NextResponse.json(
          { 
            valid: false, 
            error: `Minimum order value of ₹${promoCode.minOrderValue.toLocaleString("en-IN")} required` 
          },
          { status: 400 }
        );
      }

      // Check booking type applicability
      if (bookingType && promoCode.applicableTo !== "ALL" && promoCode.applicableTo !== bookingType) {
        return NextResponse.json(
          { valid: false, error: `This code is only valid for ${promoCode.applicableTo.toLowerCase()} bookings` },
          { status: 400 }
        );
      }

      // Check if for new users only
      if (promoCode.forNewUsers && session?.user) {
        const existingBookings = await prisma.booking.count({
          where: { userId: session.user.id, status: { in: ["CONFIRMED", "COMPLETED"] } },
        });
        if (existingBookings > 0) {
          return NextResponse.json(
            { valid: false, error: "This promo code is only for first-time users" },
            { status: 400 }
          );
        }
      }

      // Calculate discount
      let discount = 0;
      if (promoCode.discountType === "PERCENTAGE") {
        discount = (orderAmount * promoCode.discountValue) / 100;
        if (promoCode.maxDiscount && discount > promoCode.maxDiscount) {
          discount = promoCode.maxDiscount;
        }
      } else {
        discount = promoCode.discountValue;
      }

      // Discount shouldn't exceed order amount
      discount = Math.min(discount, orderAmount);

      return NextResponse.json({
        valid: true,
        promoCode: {
          id: promoCode.id,
          code: promoCode.code,
          description: promoCode.description,
          discountType: promoCode.discountType,
          discountValue: promoCode.discountValue,
          maxDiscount: promoCode.maxDiscount,
        },
        discount,
        finalAmount: orderAmount - discount,
      });
    }

    // Admin: List all promo codes
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const status = searchParams.get("status"); // active, expired, all

    const where: any = {};
    if (status === "active") {
      where.isActive = true;
      where.OR = [
        { expiryDate: null },
        { expiryDate: { gte: new Date() } },
      ];
    } else if (status === "expired") {
      where.OR = [
        { isActive: false },
        { expiryDate: { lt: new Date() } },
      ];
    }

    const [promoCodes, total] = await Promise.all([
      prisma.promoCode.findMany({
        where,
        include: {
          _count: { select: { usages: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.promoCode.count({ where }),
    ]);

    return NextResponse.json({
      promoCodes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error with promo codes:", error);
    return NextResponse.json(
      { error: "Failed to process promo code request" },
      { status: 500 }
    );
  }
}

// POST /api/promo-codes - Create new promo code (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createPromoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if code already exists
    const existing = await prisma.promoCode.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Promo code already exists" },
        { status: 400 }
      );
    }

    const promoCode = await prisma.promoCode.create({
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        createdBy: session.user.id,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "PROMO_CODE_CREATED",
        entityType: "PROMO_CODE",
        entityId: promoCode.id,
        userId: session.user.id,
        details: { code: promoCode.code, discountType: data.discountType, discountValue: data.discountValue },
      },
    });

    return NextResponse.json({ promoCode }, { status: 201 });
  } catch (error) {
    console.error("Error creating promo code:", error);
    return NextResponse.json(
      { error: "Failed to create promo code" },
      { status: 500 }
    );
  }
}
