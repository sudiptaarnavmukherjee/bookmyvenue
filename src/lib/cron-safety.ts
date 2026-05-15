import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

const DEFAULT_UNLOCKED_AT = "1970-01-01T00:00:00.000Z";

type CronContext = {
  request: NextRequest;
  runId: string;
  startedAt: string;
};

type CronOptions = {
  leaseMs?: number;
};

type CronResult = Record<string, unknown>;

function lockKey(jobName: string) {
  return `cron.lock.${jobName}`;
}

function historyKey(jobName: string) {
  return `cron.run.${jobName}.last`;
}

async function ensureLockRecord(jobName: string) {
  await prisma.systemConfig.upsert({
    where: { key: lockKey(jobName) },
    create: {
      key: lockKey(jobName),
      value: DEFAULT_UNLOCKED_AT,
      type: "string",
      category: "cron",
      description: `Lease lock for ${jobName}`,
    },
    update: {},
  });
}

async function acquireLease(jobName: string, leaseMs: number) {
  await ensureLockRecord(jobName);

  const nowIso = new Date().toISOString();
  const lockedUntil = new Date(Date.now() + leaseMs).toISOString();

  const result = await prisma.systemConfig.updateMany({
    where: {
      key: lockKey(jobName),
      value: {
        lt: nowIso,
      },
    },
    data: {
      value: lockedUntil,
    },
  });

  if (result.count > 0) {
    return { acquired: true as const, lockedUntil };
  }

  const existing = await prisma.systemConfig.findUnique({
    where: { key: lockKey(jobName) },
    select: { value: true },
  });

  return {
    acquired: false as const,
    lockedUntil: existing?.value || null,
  };
}

async function releaseLease(jobName: string) {
  await prisma.systemConfig.update({
    where: { key: lockKey(jobName) },
    data: { value: new Date().toISOString() },
  });
}

async function recordRun(jobName: string, status: "SUCCESS" | "FAILED", payload: Record<string, unknown>) {
  await prisma.systemConfig.upsert({
    where: { key: historyKey(jobName) },
    create: {
      key: historyKey(jobName),
      value: JSON.stringify(payload),
      type: "json",
      category: "cron",
      description: `Last execution metadata for ${jobName}`,
    },
    update: {
      value: JSON.stringify({
        ...payload,
        status,
      }),
      type: "json",
      category: "cron",
    },
  });
}

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function lockedResponse(jobName: string, lockedUntil: string | null) {
  return NextResponse.json(
    {
      success: false,
      error: `${jobName} is already running`,
      lockedUntil,
    },
    {
      status: 409,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export function withCronSafety(
  jobName: string,
  handler: (context: CronContext) => Promise<CronResult>,
  options: CronOptions = {}
) {
  const leaseMs = options.leaseMs ?? 10 * 60 * 1000;

  return async function GET(request: NextRequest) {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return unauthorizedResponse();
    }

    const lease = await acquireLease(jobName, leaseMs);
    if (!lease.acquired) {
      return lockedResponse(jobName, lease.lockedUntil);
    }

    const startedAt = new Date().toISOString();
    const runId = crypto.randomUUID();

    try {
      const results = await handler({ request, runId, startedAt });
      const completedAt = new Date().toISOString();
      const durationMs = Date.parse(completedAt) - Date.parse(startedAt);

      await recordRun(jobName, "SUCCESS", {
        jobName,
        runId,
        startedAt,
        completedAt,
        durationMs,
        results,
      });

      return NextResponse.json(
        {
          success: true,
          jobName,
          runId,
          startedAt,
          completedAt,
          durationMs,
          results,
        },
        {
          headers: {
            "Cache-Control": "no-store",
            "x-cron-run-id": runId,
          },
        }
      );
    } catch (error) {
      const completedAt = new Date().toISOString();
      const durationMs = Date.parse(completedAt) - Date.parse(startedAt);
      const message = error instanceof Error ? error.message : "Unknown error";

      await recordRun(jobName, "FAILED", {
        jobName,
        runId,
        startedAt,
        completedAt,
        durationMs,
        error: message,
      });

      return NextResponse.json(
        {
          success: false,
          jobName,
          runId,
          startedAt,
          completedAt,
          durationMs,
          error: message,
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store",
            "x-cron-run-id": runId,
          },
        }
      );
    } finally {
      await releaseLease(jobName);
    }
  };
}