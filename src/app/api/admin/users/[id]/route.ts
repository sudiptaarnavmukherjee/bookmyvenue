import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema
const updateUserSchema = z.object({
  action: z.enum(["ban", "unban", "verify_kyc", "change_role", "update"]),
  role: z.enum(["USER", "VENUE_OWNER", "CATERING_OWNER", "ADMIN"]).optional(),
  reason: z.string().optional(),
});

// GET /api/admin/users/[id] - Get user details
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

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        image: true,
        isActive: true,
        isBanned: true,
        banReason: true,
        kycVerified: true,
        aadhaarNumber: true,
        panNumber: true,
        gstNumber: true,
        createdAt: true,
        updatedAt: true,
        venues: {
          select: {
            id: true,
            name: true,
            city: true,
            isVerified: true,
            isActive: true,
          },
        },
        caterings: {
          select: {
            id: true,
            businessName: true,
            city: true,
            isVerified: true,
            isActive: true,
          },
        },
        bookings: {
          select: {
            id: true,
            bookingNumber: true,
            status: true,
            totalAmount: true,
            eventDate: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            isApproved: true,
            isFlagged: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
            venues: true,
            caterings: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get recent audit logs for this user
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { userId: id },
          { entityType: "USER", entityId: id },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    // Get user's payment history
    const payments = await prisma.payment.findMany({
      where: {
        booking: { userId: id },
        status: "COMPLETED",
      },
      select: {
        amount: true,
        paidAt: true,
      },
    });

    const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      user,
      auditLogs,
      stats: {
        totalSpent,
        transactionCount: payments.length,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// POST /api/admin/users/[id] - Update user (ban, verify, change role)
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
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { action, role, reason } = validation.data;

    // Prevent admin from modifying themselves
    if (id === session.user.id && action === "ban") {
      return NextResponse.json(
        { error: "Cannot ban yourself" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let updateData: Record<string, unknown> = {};
    let auditAction = "";

    switch (action) {
      case "ban":
        updateData = { isBanned: true, banReason: reason };
        auditAction = "USER_BANNED";
        break;
      case "unban":
        updateData = { isBanned: false, banReason: null };
        auditAction = "USER_UNBANNED";
        break;
      case "verify_kyc":
        updateData = { kycVerified: true };
        auditAction = "USER_KYC_VERIFIED";
        break;
      case "change_role":
        if (!role) {
          return NextResponse.json(
            { error: "Role is required for change_role action" },
            { status: 400 }
          );
        }
        updateData = { role };
        auditAction = "USER_ROLE_CHANGED";
        break;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBanned: true,
        kycVerified: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: auditAction,
        entityType: "USER",
        entityId: id,
        userId: session.user.id,
        details: {
          action,
          reason,
          newRole: role,
        },
        previousValue: {
          isBanned: (user as any).isBanned,
          kycVerified: user.kycVerified,
          role: user.role,
        },
        newValue: {
          isBanned: updatedUser.isBanned,
          kycVerified: updatedUser.kycVerified,
          role: updatedUser.role,
        },
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
