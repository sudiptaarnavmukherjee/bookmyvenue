/**
 * Vercel Cron Job — Retention Automation
 * Runs daily at 00:00 IST (18:30 UTC) via vercel.json schedule.
 *
 * Protect with CRON_SECRET env variable (auto-set by Vercel on Pro plans,
 * or set manually on Hobby). Vercel passes it as the Authorization header:
 *   Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from "next/server";
import { runRetentionAutomation } from "@/lib/retention";

export async function GET(request: NextRequest) {
  // Verify the Vercel cron secret. On Vercel this is injected automatically;
  // locally you can set CRON_SECRET in .env.local and pass it manually.
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // If a secret is configured, enforce it. Skip enforcement in dev when no secret is set.
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date().toISOString();
  console.log(`[Cron] Retention automation started at ${startedAt}`);

  try {
    const results = await runRetentionAutomation();

    console.log("[Cron] Retention automation completed:", results);

    return NextResponse.json({
      success: true,
      startedAt,
      completedAt: new Date().toISOString(),
      results,
    });
  } catch (err) {
    console.error("[Cron] Retention automation error:", err);

    return NextResponse.json(
      {
        success: false,
        startedAt,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
