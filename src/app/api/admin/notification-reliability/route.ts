import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import {
  ALERT_FAILURE_THRESHOLD,
  MAX_RETRY_ATTEMPTS,
  computeProviderAlerts,
  getFailedEmailLogs,
  getFailedSmsLogs,
} from "@/lib/notification-reliability";

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const since24h = hoursAgo(24);

    const [
      emailSent24h,
      emailFailed24h,
      smsSent24h,
      smsFailed24h,
      pushSubscribers,
      failedEmails,
      failedSms,
      providerAlerts,
    ] = await Promise.all([
      prisma.emailLog.count({ where: { status: "SENT", createdAt: { gte: since24h } } }),
      prisma.emailLog.count({ where: { status: "FAILED", createdAt: { gte: since24h } } }),
      prisma.smsLog.count({
        where: { status: { in: ["SENT", "DELIVERED"] }, createdAt: { gte: since24h } },
      }),
      prisma.smsLog.count({ where: { status: "FAILED", createdAt: { gte: since24h } } }),
      prisma.pushSubscription.count(),
      getFailedEmailLogs(25),
      getFailedSmsLogs(25),
      computeProviderAlerts(6),
    ]);

    const retryQueue = {
      email: failedEmails.filter((l) => l.retryable).length,
      sms: failedSms.filter((l) => l.retryable).length,
    };

    return NextResponse.json({
      summary: {
        emailSent24h,
        emailFailed24h,
        smsSent24h,
        smsFailed24h,
        pushSubscribers,
      },
      retryPolicy: {
        maxAttempts: MAX_RETRY_ATTEMPTS,
        alertThreshold: ALERT_FAILURE_THRESHOLD,
      },
      retryQueue,
      providerAlerts,
      failedLogs: {
        email: failedEmails.map((row) => ({
          id: row.id,
          to: row.to,
          template: row.template,
          provider: row.provider || "unknown",
          error: row.error,
          createdAt: row.createdAt,
          attemptsUsed: row.attemptsUsed,
          retryable: row.retryable,
        })),
        sms: failedSms.map((row) => ({
          id: row.id,
          to: row.to,
          template: row.template,
          provider: row.provider,
          error: row.error,
          createdAt: row.createdAt,
          attemptsUsed: row.attemptsUsed,
          retryable: row.retryable,
        })),
      },
    });
  } catch (error) {
    console.error("Notification reliability GET error:", error);
    return NextResponse.json(
      { error: "Failed to load notification reliability data" },
      { status: 500 }
    );
  }
}
