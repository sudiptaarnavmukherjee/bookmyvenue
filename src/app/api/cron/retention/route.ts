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
import { withCronSafety } from "@/lib/cron-safety";

export const GET = withCronSafety(
  "retention",
  async ({ runId, startedAt }) => {
    console.log(`[Cron] Retention automation started`, { runId, startedAt });
    const results = await runRetentionAutomation();
    console.log("[Cron] Retention automation completed", { runId, results });
    return results;
  },
  { leaseMs: 20 * 60 * 1000 }
);
