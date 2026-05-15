import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createProviderAlertsAudit,
  retryEmailLog,
  retryFailedNotifications,
  retrySmsLog,
} from "@/lib/notification-reliability";

type RetryBody = {
  retryAll?: boolean;
  channel?: "EMAIL" | "SMS";
  logId?: string;
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN" || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as RetryBody;

    if (body.retryAll) {
      const results = await retryFailedNotifications({ emailLimit: 10, smsLimit: 10 });
      const alerts = await createProviderAlertsAudit({ adminUserId: session.user.id, windowHours: 6 });
      return NextResponse.json({ success: true, mode: "bulk", results, alerts });
    }

    if (!body.channel || !body.logId) {
      return NextResponse.json(
        { error: "Provide either retryAll=true or both channel and logId" },
        { status: 400 }
      );
    }

    if (body.channel === "EMAIL") {
      const result = await retryEmailLog(body.logId);
      const alerts = await createProviderAlertsAudit({ adminUserId: session.user.id, windowHours: 6 });
      return NextResponse.json({ success: result.success, channel: "EMAIL", result, alerts });
    }

    const result = await retrySmsLog(body.logId);
    const alerts = await createProviderAlertsAudit({ adminUserId: session.user.id, windowHours: 6 });
    return NextResponse.json({ success: result.success, channel: "SMS", result, alerts });
  } catch (error) {
    console.error("Notification retry POST error:", error);
    return NextResponse.json({ error: "Failed to run notification retry" }, { status: 500 });
  }
}
