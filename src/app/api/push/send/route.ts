import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { sendPushToUser, PushPayload } from "@/lib/push";

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
    const results = await sendPushToUser(subscriptions, payload);

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    // Clean up expired subscriptions (410 Gone)
    await Promise.allSettled(
      results.map(async (result, i) => {
        if (result.status === "rejected") {
          const err = (result as PromiseRejectedResult).reason;
          if (err?.statusCode === 410) {
            await prisma.pushSubscription.deleteMany({
              where: { endpoint: subscriptions[i].endpoint },
            });
          }
        }
      })
    );

    return NextResponse.json({ success: true, sent, failed });
  } catch (error) {
    console.error("Push send error:", error);
    return NextResponse.json({ error: "Failed to send push" }, { status: 500 });
  }
}
