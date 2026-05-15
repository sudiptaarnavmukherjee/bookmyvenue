// Admin Cancellation Requests Management API
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendCancellationSMS } from "@/lib/sms";
import { sendCancellationEmail } from "@/lib/email-templates";

type CancellationAction = "APPROVE" | "REJECT" | "UPDATE_REFUND";
type RefundLifecycleStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

function isValidRefundStatus(value: unknown): value is RefundLifecycleStatus {
  return (
    value === "PENDING" ||
    value === "PROCESSING" ||
    value === "COMPLETED" ||
    value === "FAILED"
  );
}

async function processCancellationRequest(params: {
  id: string;
  action: CancellationAction;
  adminUserId: string;
  reason?: string;
  adjustedRefundAmount?: number;
}) {
  const { id, action, adminUserId, reason, adjustedRefundAmount } = params;

  const cancellation = await prisma.cancellationRequest.findUnique({
    where: { id },
    include: {
      booking: {
        include: {
          user: true,
          venue: true,
          caterer: true,
        },
      },
    },
  });

  if (!cancellation) {
    return {
      success: false,
      statusCode: 404,
      error: "Cancellation request not found",
    } as const;
  }

  if (cancellation.status !== "PENDING") {
    return {
      success: false,
      statusCode: 400,
      error: "Cancellation request already processed",
    } as const;
  }

  const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";
  const finalRefundAmount = adjustedRefundAmount ?? cancellation.refundAmount;

  const updatedCancellation = await prisma.cancellationRequest.update({
    where: { id },
    data: {
      status: newStatus,
      processedBy: adminUserId,
      approvedAt: new Date(),
      processedAt: new Date(),
      refundAmount: finalRefundAmount,
      processNotes: reason,
    },
  });

  if (action === "APPROVE") {
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: cancellation.bookingId },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
        },
      }),
      prisma.blockedDate.deleteMany({
        where: {
          bookingId: cancellation.bookingId,
          isOnlineBooking: true,
        },
      }),
    ]);

    const customer = cancellation.booking.user;
    const bookingNumber =
      cancellation.booking.bookingNumber ||
      cancellation.booking.id.slice(-8).toUpperCase();
    const venueName =
      cancellation.booking.venue?.name ||
      cancellation.booking.caterer?.name ||
      "Venue";

    try {
      if (customer.phone) {
        await sendCancellationSMS({
          bookingId: cancellation.bookingId,
          customerPhone: customer.phone,
          customerName: customer.name || "Customer",
          bookingNumber,
          refundAmount: finalRefundAmount && finalRefundAmount > 0 ? finalRefundAmount : undefined,
        });
      }

      if (customer.email) {
        await sendCancellationEmail({
          to: customer.email,
          customerName: customer.name || "Customer",
          bookingNumber,
          venueName,
          refundAmount: finalRefundAmount && finalRefundAmount > 0 ? finalRefundAmount : undefined,
          cancellationReason: cancellation.reason,
        });
      }
    } catch (notificationError) {
      console.error("Cancellation notification error:", notificationError);
    }
  }

  try {
    await prisma.auditLog.create({
      data: {
        action: action === "APPROVE" ? "CANCELLATION_APPROVED" : "CANCELLATION_REJECTED",
        entityType: "CANCELLATION",
        entityId: cancellation.id,
        userId: adminUserId,
        details: {
          cancellationId: cancellation.id,
          bookingId: cancellation.bookingId,
          bookingNumber: cancellation.booking.bookingNumber,
          requestedBy: cancellation.requestedBy,
          previousStatus: cancellation.status,
          newStatus,
          refundAmount: finalRefundAmount,
          reason: reason || null,
        },
      },
    });
  } catch (auditError) {
    console.error("Audit log creation failed:", auditError);
  }

  return {
    success: true,
    cancellation: updatedCancellation,
    message:
      action === "APPROVE"
        ? "Cancellation approved and customer notified"
        : "Cancellation request rejected",
  } as const;
}

async function updateRefundLifecycle(params: {
  id: string;
  adminUserId: string;
  refundStatus: RefundLifecycleStatus;
  refundId?: string;
  reason?: string;
}) {
  const { id, adminUserId, refundStatus, refundId, reason } = params;

  const cancellation = await prisma.cancellationRequest.findUnique({
    where: { id },
    include: {
      booking: {
        include: {
          payments: {
            where: {
              status: "COMPLETED",
            },
            orderBy: {
              paidAt: "asc",
            },
          },
        },
      },
    },
  });

  if (!cancellation) {
    return {
      success: false,
      statusCode: 404,
      error: "Cancellation request not found",
    } as const;
  }

  if (cancellation.status !== "APPROVED") {
    return {
      success: false,
      statusCode: 400,
      error: "Refund lifecycle can only be updated for approved cancellations",
    } as const;
  }

  const updatePayload: {
    refundStatus: RefundLifecycleStatus;
    refundId?: string;
    refundedAt?: Date | null;
    processNotes?: string;
  } = {
    refundStatus,
  };

  if (refundId !== undefined) {
    updatePayload.refundId = refundId;
  }

  if (refundStatus === "COMPLETED") {
    updatePayload.refundedAt = new Date();
  } else if (refundStatus === "FAILED") {
    updatePayload.refundedAt = null;
  }

  if (reason && reason.trim().length > 0) {
    updatePayload.processNotes = reason.trim();
  }

  const updatedCancellation = await prisma.cancellationRequest.update({
    where: { id },
    data: updatePayload,
  });

  if (refundStatus === "COMPLETED" && cancellation.refundAmount && cancellation.refundAmount > 0) {
    let remainingRefund = cancellation.refundAmount;
    const paymentUpdates = [] as ReturnType<typeof prisma.payment.update>[];

    for (const payment of cancellation.booking.payments) {
      if (remainingRefund <= 0) {
        break;
      }

      const paymentRefundAmount = Math.min(payment.amount, remainingRefund);
      remainingRefund -= paymentRefundAmount;

      paymentUpdates.push(
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: paymentRefundAmount >= payment.amount ? "REFUNDED" : "PARTIALLY_REFUNDED",
            refundAmount: paymentRefundAmount,
            refundId: refundId || payment.refundId,
            refundedAt: new Date(),
          },
        })
      );
    }

    if (paymentUpdates.length > 0) {
      await prisma.$transaction(paymentUpdates);
    }
  }

  try {
    await prisma.auditLog.create({
      data: {
        action: "CANCELLATION_REFUND_UPDATED",
        entityType: "CANCELLATION",
        entityId: cancellation.id,
        userId: adminUserId,
        details: {
          cancellationId: cancellation.id,
          bookingId: cancellation.bookingId,
          bookingNumber: cancellation.booking.bookingNumber,
          previousRefundStatus: cancellation.refundStatus || null,
          newRefundStatus: refundStatus,
          refundId: refundId || cancellation.refundId || null,
          refundAmount: cancellation.refundAmount || 0,
          reason: reason || null,
        },
      },
    });
  } catch (auditError) {
    console.error("Refund audit log creation failed:", auditError);
  }

  return {
    success: true,
    cancellation: updatedCancellation,
    message: `Refund status updated to ${refundStatus}`,
  } as const;
}

// GET /api/admin/cancellations - List all cancellation requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // PENDING, APPROVED, REJECTED
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const [cancellations, total] = await Promise.all([
      prisma.cancellationRequest.findMany({
        where,
        include: {
          booking: {
            include: {
              user: {
                select: { id: true, name: true, email: true, phone: true },
              },
              venue: {
                select: { id: true, name: true, owner: { select: { name: true, email: true } } },
              },
              caterer: {
                select: { id: true, name: true, owner: { select: { name: true, email: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.cancellationRequest.count({ where }),
    ]);

    // Format for response
    const formatted = cancellations.map((c) => ({
      id: c.id,
      bookingId: c.bookingId,
      bookingNumber: c.booking.bookingNumber,
      customerName: c.booking.user.name,
      customerEmail: c.booking.user.email,
      customerPhone: c.booking.user.phone,
      entityName: c.booking.venue?.name || c.booking.caterer?.name,
      entityType: c.booking.venue ? "VENUE" : "CATERER",
      ownerName: c.booking.venue?.owner.name || c.booking.caterer?.owner.name,
      ownerEmail: c.booking.venue?.owner.email || c.booking.caterer?.owner.email,
      eventDate: c.booking.eventDate,
      totalAmount: c.booking.totalAmount,
      paidAmount: c.booking.advanceAmount || 0,
      refundAmount: c.refundAmount,
      refundPercentage: c.refundPercentage,
      reason: c.reason,
      requestedBy: c.requestedBy,
      status: c.status,
      refundStatus: c.refundStatus,
      refundId: c.refundId,
      createdAt: c.createdAt,
      approvedAt: c.approvedAt,
      refundedAt: c.refundedAt,
    }));

    return NextResponse.json({
      cancellations: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get cancellation requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cancellation requests" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/cancellations - Approve/Reject cancellation
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ids, action, reason, adjustedRefundAmount, refundStatus, refundId } = body;

    const actionType = action as CancellationAction;
    const targetIds = Array.isArray(ids)
      ? ids.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      : typeof id === "string" && id.trim().length > 0
        ? [id]
        : [];

    if (targetIds.length === 0 || !actionType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["APPROVE", "REJECT", "UPDATE_REFUND"].includes(actionType)) {
      return NextResponse.json(
        { error: "Invalid action. Must be APPROVE, REJECT, or UPDATE_REFUND" },
        { status: 400 }
      );
    }

    if (actionType === "UPDATE_REFUND") {
      if (!isValidRefundStatus(refundStatus)) {
        return NextResponse.json(
          { error: "Invalid refundStatus. Must be PENDING, PROCESSING, COMPLETED, or FAILED" },
          { status: 400 }
        );
      }

      if (targetIds.length > 1 && refundId) {
        return NextResponse.json(
          { error: "refundId can only be set for single refund update" },
          { status: 400 }
        );
      }

      if (targetIds.length === 1) {
        const refundResult = await updateRefundLifecycle({
          id: targetIds[0],
          adminUserId: session.user.id,
          refundStatus,
          refundId,
          reason,
        });

        if (!refundResult.success) {
          return NextResponse.json({ error: refundResult.error }, { status: refundResult.statusCode });
        }

        return NextResponse.json({
          success: true,
          cancellation: refundResult.cancellation,
          message: refundResult.message,
        });
      }

      const refundResults = [] as Array<{ id: string; success: boolean; error?: string }>;
      for (const targetId of targetIds) {
        const refundResult = await updateRefundLifecycle({
          id: targetId,
          adminUserId: session.user.id,
          refundStatus,
          reason,
        });

        refundResults.push({
          id: targetId,
          success: refundResult.success,
          error: refundResult.success ? undefined : refundResult.error,
        });
      }

      const successfulRefundUpdates = refundResults.filter((item) => item.success).length;
      const failedRefundUpdates = refundResults.length - successfulRefundUpdates;

      return NextResponse.json({
        success: true,
        message: `${successfulRefundUpdates} refund status update(s) applied${failedRefundUpdates > 0 ? `, ${failedRefundUpdates} failed` : ""}`,
        results: refundResults,
        summary: {
          total: refundResults.length,
          successful: successfulRefundUpdates,
          failed: failedRefundUpdates,
        },
      });
    }

    if (targetIds.length > 1 && adjustedRefundAmount !== undefined) {
      return NextResponse.json(
        { error: "Adjusted refund amount is only supported for single request processing" },
        { status: 400 }
      );
    }

    if (targetIds.length === 1) {
      const result = await processCancellationRequest({
        id: targetIds[0],
        action: actionType,
        adminUserId: session.user.id,
        reason,
        adjustedRefundAmount,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: result.statusCode });
      }

      return NextResponse.json({
        success: true,
        cancellation: result.cancellation,
        message: result.message,
      });
    }

    const results = [] as Array<{ id: string; success: boolean; error?: string }>;
    for (const targetId of targetIds) {
      const result = await processCancellationRequest({
        id: targetId,
        action: actionType,
        adminUserId: session.user.id,
        reason,
      });

      results.push({
        id: targetId,
        success: result.success,
        error: result.success ? undefined : result.error,
      });
    }

    const successful = results.filter((item) => item.success).length;
    const failed = results.length - successful;

    return NextResponse.json({
      success: true,
      message:
        actionType === "APPROVE"
          ? `${successful} cancellation request(s) approved${failed > 0 ? `, ${failed} failed` : ""}`
          : `${successful} cancellation request(s) rejected${failed > 0 ? `, ${failed} failed` : ""}`,
      results,
      summary: {
        total: results.length,
        successful,
        failed,
      },
    });
  } catch (error) {
    console.error("Process cancellation error:", error);
    return NextResponse.json(
      { error: "Failed to process cancellation" },
      { status: 500 }
    );
  }
}
