/**
 * API endpoint for triggering retention automation
 * Can be called by external cron service (e.g., EasyCron, AWS Lambda, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runRetentionAutomation } from "@/lib/retention";

// Validate request with a secret token from environment
const RETENTION_SECRET = process.env.RETENTION_AUTOMATION_SECRET || "dev-secret";

/**
 * POST /api/admin/retention/trigger
 * Triggers the retention automation run
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Allow either an authenticated admin session or the server-to-server bearer token.
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    const isAdminSession = session?.user?.role === "ADMIN";

    if (!isAdminSession && (!token || token !== RETENTION_SECRET)) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid admin session or retention secret" },
        { status: 401 }
      );
    }

    // Run retention automation
    const results = await runRetentionAutomation();

    return NextResponse.json({
      success: true,
      message: "Retention automation completed successfully",
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[Retention API] Error:", err);

    return NextResponse.json(
      {
        error: "Failed to run retention automation",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/retention/health
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "retention-automation",
    timestamp: new Date().toISOString(),
  });
}
