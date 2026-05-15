import { NextRequest, NextResponse } from "next/server";
import { retryFailedNotifications } from "@/lib/notification-reliability";
import { withCronSafety } from "@/lib/cron-safety";

export const GET = withCronSafety(
  "notification-retry",
  async ({ runId, startedAt }) => {
    console.log("[Cron] Notification retry started", { runId, startedAt });
    const results = await retryFailedNotifications({ emailLimit: 25, smsLimit: 25 });
    console.log("[Cron] Notification retry completed", { runId, results });
    return results;
  },
  { leaseMs: 15 * 60 * 1000 }
);
