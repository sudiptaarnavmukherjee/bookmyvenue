import { NextRequest, NextResponse } from "next/server";
import { retryFailedNotifications } from "@/lib/notification-reliability";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date().toISOString();

  try {
    const results = await retryFailedNotifications({ emailLimit: 25, smsLimit: 25 });

    return NextResponse.json({
      success: true,
      startedAt,
      completedAt: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error("Notification retry cron error:", error);
    return NextResponse.json(
      {
        success: false,
        startedAt,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
