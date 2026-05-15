import prisma from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { sendSMS } from "@/lib/sms";

export const MAX_RETRY_ATTEMPTS = 3;
export const ALERT_FAILURE_THRESHOLD = 5;

const RETRY_LOOKBACK_HOURS = 48;

type RetryResult = {
  success: boolean;
  attemptsUsed: number;
  reason?: string;
};

type EmailTemplateName =
  | "booking_confirmation"
  | "booking_status_update"
  | "payment_success"
  | "payment_failed"
  | "owner_new_booking"
  | "owner_booking_reminder"
  | "review_request"
  | "welcome"
  | "event_reminder"
  | "post_event_feedback"
  | "re_engagement";

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function templateToEmailTemplate(template: string): EmailTemplateName | null {
  const supported = new Set([
    "booking_confirmation",
    "booking_status_update",
    "payment_success",
    "payment_failed",
    "owner_new_booking",
    "owner_booking_reminder",
    "review_request",
    "welcome",
    "event_reminder",
    "post_event_feedback",
    "re_engagement",
  ]);

  return supported.has(template) ? (template as EmailTemplateName) : null;
}

async function countEmailAttempts(log: {
  to: string;
  template: string;
  bookingId: string | null;
  createdAt: Date;
}) {
  return prisma.emailLog.count({
    where: {
      to: log.to,
      template: log.template,
      bookingId: log.bookingId,
      createdAt: { gte: hoursAgo(RETRY_LOOKBACK_HOURS) },
    },
  });
}

async function countSmsAttempts(log: {
  to: string;
  template: string;
  bookingId: string | null;
  createdAt: Date;
}) {
  return prisma.smsLog.count({
    where: {
      to: log.to,
      template: log.template,
      bookingId: log.bookingId,
      createdAt: { gte: hoursAgo(RETRY_LOOKBACK_HOURS) },
    },
  });
}

export async function getFailedEmailLogs(limit = 30) {
  const failed = await prisma.emailLog.findMany({
    where: { status: "FAILED" },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return Promise.all(
    failed.map(async (log) => {
      const attemptsUsed = await countEmailAttempts(log);
      return {
        ...log,
        attemptsUsed,
        retryable: attemptsUsed < MAX_RETRY_ATTEMPTS,
      };
    })
  );
}

export async function getFailedSmsLogs(limit = 30) {
  const failed = await prisma.smsLog.findMany({
    where: { status: "FAILED" },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return Promise.all(
    failed.map(async (log) => {
      const attemptsUsed = await countSmsAttempts(log);
      return {
        ...log,
        attemptsUsed,
        retryable: attemptsUsed < MAX_RETRY_ATTEMPTS,
      };
    })
  );
}

export async function retryEmailLog(logId: string): Promise<RetryResult> {
  const log = await prisma.emailLog.findUnique({ where: { id: logId } });
  if (!log) {
    return { success: false, attemptsUsed: 0, reason: "Email log not found" };
  }

  const attemptsUsed = await countEmailAttempts(log);
  if (attemptsUsed >= MAX_RETRY_ATTEMPTS) {
    return { success: false, attemptsUsed, reason: "Retry limit reached" };
  }

  const typedTemplate = templateToEmailTemplate(log.template);
  if (!typedTemplate) {
    return { success: false, attemptsUsed, reason: `Unsupported template: ${log.template}` };
  }

  const metadata = (log.metadata ?? {}) as Record<string, unknown>;
  const data = metadata.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== "object") {
    return {
      success: false,
      attemptsUsed,
      reason: "Missing metadata payload required for email retry",
    };
  }

  const success = await sendEmail({
    to: log.to,
    template: typedTemplate,
    data,
    bookingId: log.bookingId ?? undefined,
    userId: log.userId ?? undefined,
  });

  return { success, attemptsUsed: attemptsUsed + 1 };
}

export async function retrySmsLog(logId: string): Promise<RetryResult> {
  const log = await prisma.smsLog.findUnique({ where: { id: logId } });
  if (!log) {
    return { success: false, attemptsUsed: 0, reason: "SMS log not found" };
  }

  const attemptsUsed = await countSmsAttempts(log);
  if (attemptsUsed >= MAX_RETRY_ATTEMPTS) {
    return { success: false, attemptsUsed, reason: "Retry limit reached" };
  }

  const result = await sendSMS(log.to, log.message, log.template, {
    bookingId: log.bookingId ?? undefined,
    userId: log.userId ?? undefined,
  });

  return {
    success: result.success,
    attemptsUsed: attemptsUsed + 1,
    reason: result.success ? undefined : result.error,
  };
}

export async function retryFailedNotifications(options?: {
  emailLimit?: number;
  smsLimit?: number;
}) {
  const emailLimit = options?.emailLimit ?? 10;
  const smsLimit = options?.smsLimit ?? 10;

  const [emailCandidates, smsCandidates] = await Promise.all([
    getFailedEmailLogs(emailLimit),
    getFailedSmsLogs(smsLimit),
  ]);

  const retryableEmails = emailCandidates.filter((l) => l.retryable);
  const retryableSms = smsCandidates.filter((l) => l.retryable);

  const emailResults = await Promise.all(
    retryableEmails.map(async (log) => ({ id: log.id, ...(await retryEmailLog(log.id)) }))
  );

  const smsResults = await Promise.all(
    retryableSms.map(async (log) => ({ id: log.id, ...(await retrySmsLog(log.id)) }))
  );

  return {
    email: {
      candidates: emailCandidates.length,
      attempted: emailResults.length,
      succeeded: emailResults.filter((r) => r.success).length,
      failed: emailResults.filter((r) => !r.success).length,
      results: emailResults,
    },
    sms: {
      candidates: smsCandidates.length,
      attempted: smsResults.length,
      succeeded: smsResults.filter((r) => r.success).length,
      failed: smsResults.filter((r) => !r.success).length,
      results: smsResults,
    },
  };
}

export async function computeProviderAlerts(windowHours = 6) {
  const since = hoursAgo(windowHours);

  const [emailFailures, smsFailures] = await Promise.all([
    prisma.emailLog.findMany({
      where: { status: "FAILED", createdAt: { gte: since } },
      select: { provider: true, createdAt: true },
    }),
    prisma.smsLog.findMany({
      where: { status: "FAILED", createdAt: { gte: since } },
      select: { provider: true, createdAt: true },
    }),
  ]);

  const rollup = new Map<string, { channel: "EMAIL" | "SMS"; provider: string; failureCount: number }>();

  emailFailures.forEach((f) => {
    const provider = f.provider || "unknown";
    const key = `EMAIL:${provider}`;
    const current = rollup.get(key);
    if (current) {
      current.failureCount += 1;
    } else {
      rollup.set(key, { channel: "EMAIL", provider, failureCount: 1 });
    }
  });

  smsFailures.forEach((f) => {
    const provider = f.provider || "unknown";
    const key = `SMS:${provider}`;
    const current = rollup.get(key);
    if (current) {
      current.failureCount += 1;
    } else {
      rollup.set(key, { channel: "SMS", provider, failureCount: 1 });
    }
  });

  return Array.from(rollup.values()).filter((x) => x.failureCount >= ALERT_FAILURE_THRESHOLD);
}

export async function createProviderAlertsAudit(params: {
  adminUserId: string;
  windowHours?: number;
}) {
  const alerts = await computeProviderAlerts(params.windowHours ?? 6);
  if (alerts.length === 0) {
    return { created: 0, alerts };
  }

  const created = await Promise.all(
    alerts.map((alert) =>
      prisma.auditLog.create({
        data: {
          action: "NOTIFICATION_PROVIDER_ALERT",
          entityType: "NOTIFICATION",
          entityId: `${alert.channel}:${alert.provider}`,
          userId: params.adminUserId,
          details: {
            channel: alert.channel,
            provider: alert.provider,
            failureCount: alert.failureCount,
            threshold: ALERT_FAILURE_THRESHOLD,
          },
        },
      })
    )
  );

  return { created: created.length, alerts };
}
