import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { sendPushToSubscription, PushPayload } from "@/lib/push";

const PUSH_RETRY_ATTEMPTS = 3;
const PUSH_ALERT_FAILURE_THRESHOLD = 5;

async function sendPushWithRetries(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= PUSH_RETRY_ATTEMPTS; attempt += 1) {
    try {
      await sendPushToSubscription(subscription, payload);
      return { ok: true as const, attempt };
    } catch (error) {
      lastError = error;
      const statusCode = (error as { statusCode?: number })?.statusCode;
      if (statusCode === 410 || attempt === PUSH_RETRY_ATTEMPTS) {
        break;
      }
    }
  }

  return { ok: false as const, error: lastError };
}

// POST /api/push/send — admin sends a push notification to a specific user or all subscribers
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, title, body: msgBody, url } = body as {
      userId?: string;
      title: string;
      body: string;
      url?: string;
    };

    if (!title || !msgBody) {
      return NextResponse.json({ error: "title and body are required" }, { status: 400 });
    }

    const where = userId ? { userId } : {};
    const subscriptions = await prisma.pushSubscription.findMany({ where });

    if (!subscriptions.length) {
      return NextResponse.json({ success: true, sent: 0, message: "No subscribers" });
    }

    const payload: PushPayload = { title, body: msgBody, url: url || "/" };
    const results = await Promise.all(
      subscriptions.map(async (subscription) => ({
        subscription,
        result: await sendPushWithRetries(subscription, payload),
      }))
    );

    const sent = results.filter((r) => r.result.ok).length;
    const failed = results.filter((r) => !r.result.ok).length;

    // Clean up expired subscriptions (410 Gone)
    await Promise.allSettled(
      results.map(async ({ result, subscription }) => {
        if (result.ok) {
          return;
        }
        const err = result.error as { statusCode?: number } | undefined;
        if (err?.statusCode === 410) {
          await prisma.pushSubscription.deleteMany({
            where: { endpoint: subscription.endpoint },
          });
        }
      })
    );

    if (failed >= PUSH_ALERT_FAILURE_THRESHOLD && session.user.id) {
      await prisma.auditLog.create({
        data: {
          action: "NOTIFICATION_PROVIDER_ALERT",
          entityType: "NOTIFICATION",
          entityId: "PUSH:web-push",
          userId: session.user.id,
          details: {
            channel: "PUSH",
            provider: "web-push",
            failureCount: failed,
            threshold: PUSH_ALERT_FAILURE_THRESHOLD,
            context: "/api/push/send",
          },
        },
      });
    }

    return NextResponse.json({ success: true, sent, failed });
  } catch (error) {
    console.error("Push send error:", error);
    return NextResponse.json({ error: "Failed to send push" }, { status: 500 });
  }
}
