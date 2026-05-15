import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// POST /api/push/subscribe  — save or refresh a push subscription
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint, keys } = body as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    };

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription data" }, { status: 400 });
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId: session.user.id, p256dh: keys.p256dh, auth: keys.auth },
      create: {
        userId: session.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push subscribe error:", error);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}

// DELETE /api/push/subscribe  — remove a push subscription
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint } = body as { endpoint?: string };

    if (!endpoint) {
      return NextResponse.json({ error: "No endpoint provided" }, { status: 400 });
    }

    await prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push unsubscribe error:", error);
    return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 });
  }
}
