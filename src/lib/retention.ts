/**
 * Retention & Lifecycle Automation Service (Phase 3)
 * Handles event reminders, post-event feedback requests, and re-engagement campaigns
 */

import { prisma } from "./db";
import {
  sendEventReminder,
  sendPostEventFeedback,
  sendReEngagementEmail,
} from "./email";

export type RetentionSettings = {
  enabled: boolean;
  sendEventReminders: boolean;
  reminderDaysAhead: number[];
  sendPostEventFeedback: boolean;
  feedbackDelayDays: number;
  sendReEngagement: boolean;
  reEngagementDays: number;
};

const RETENTION_SETTINGS_DEFAULTS: RetentionSettings = {
  enabled: true,
  sendEventReminders: true,
  reminderDaysAhead: [7, 3, 1],
  sendPostEventFeedback: true,
  feedbackDelayDays: 2,
  sendReEngagement: true,
  reEngagementDays: 60,
};

const RETENTION_CONFIG_KEYS = {
  enabled: "retention.enabled",
  sendEventReminders: "retention.sendEventReminders",
  reminderDaysAhead: "retention.reminderDaysAhead",
  sendPostEventFeedback: "retention.sendPostEventFeedback",
  feedbackDelayDays: "retention.feedbackDelayDays",
  sendReEngagement: "retention.sendReEngagement",
  reEngagementDays: "retention.reEngagementDays",
} as const;

function parseBoolean(value: string, fallback: boolean) {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
}

function parseNumber(value: string, fallback: number) {
  if (value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseReminderDays(value: string, fallback: number[]) {
  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return fallback;
    }

    return parsed
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && item > 0)
      .sort((left, right) => right - left);
  } catch {
    return fallback;
  }
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function getJsonNumber(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const rawValue = (value as Record<string, unknown>)[key];
  return typeof rawValue === "number" ? rawValue : null;
}

export async function getRetentionSettings(): Promise<RetentionSettings> {
  const configs = await prisma.systemConfig.findMany({
    where: {
      category: "retention",
      key: {
        in: Object.values(RETENTION_CONFIG_KEYS),
      },
    },
  });

  const configMap = new Map(configs.map((config) => [config.key, config.value]));

  return {
    enabled: parseBoolean(
      configMap.get(RETENTION_CONFIG_KEYS.enabled) ?? "",
      RETENTION_SETTINGS_DEFAULTS.enabled
    ),
    sendEventReminders: parseBoolean(
      configMap.get(RETENTION_CONFIG_KEYS.sendEventReminders) ?? "",
      RETENTION_SETTINGS_DEFAULTS.sendEventReminders
    ),
    reminderDaysAhead: parseReminderDays(
      configMap.get(RETENTION_CONFIG_KEYS.reminderDaysAhead) ?? "",
      RETENTION_SETTINGS_DEFAULTS.reminderDaysAhead
    ),
    sendPostEventFeedback: parseBoolean(
      configMap.get(RETENTION_CONFIG_KEYS.sendPostEventFeedback) ?? "",
      RETENTION_SETTINGS_DEFAULTS.sendPostEventFeedback
    ),
    feedbackDelayDays: parseNumber(
      configMap.get(RETENTION_CONFIG_KEYS.feedbackDelayDays) ?? "",
      RETENTION_SETTINGS_DEFAULTS.feedbackDelayDays
    ),
    sendReEngagement: parseBoolean(
      configMap.get(RETENTION_CONFIG_KEYS.sendReEngagement) ?? "",
      RETENTION_SETTINGS_DEFAULTS.sendReEngagement
    ),
    reEngagementDays: parseNumber(
      configMap.get(RETENTION_CONFIG_KEYS.reEngagementDays) ?? "",
      RETENTION_SETTINGS_DEFAULTS.reEngagementDays
    ),
  };
}

export async function saveRetentionSettings(
  updates: Partial<RetentionSettings>
): Promise<RetentionSettings> {
  const entries = Object.entries(updates) as Array<[keyof RetentionSettings, RetentionSettings[keyof RetentionSettings]]>;

  await Promise.all(
    entries.map(([field, value]) => {
      const key = RETENTION_CONFIG_KEYS[field];
      const serializedValue = Array.isArray(value) ? JSON.stringify(value) : String(value);
      const type = Array.isArray(value)
        ? "json"
        : typeof value === "boolean"
          ? "boolean"
          : "number";

      return prisma.systemConfig.upsert({
        where: { key },
        create: {
          key,
          value: serializedValue,
          type,
          category: "retention",
          description: key,
        },
        update: {
          value: serializedValue,
          type,
          category: "retention",
        },
      });
    })
  );

  return getRetentionSettings();
}

// ==================== EVENT REMINDERS ====================

/**
 * Find bookings that need event reminders (1, 3, or 7 days before event)
 * Send reminders that haven't been sent yet
 */
export async function processEventReminders(settings?: RetentionSettings) {
  const resolvedSettings = settings ?? (await getRetentionSettings());

  if (!resolvedSettings.enabled || !resolvedSettings.sendEventReminders) {
    return {
      sent: 0,
      failed: 0,
      updated: 0,
    };
  }

  const now = new Date();

  // Define reminder windows: send 7, 3, and 1 day(s) before event
  const reminders = resolvedSettings.reminderDaysAhead.map((daysAhead) => ({
    daysAhead,
    name: `${daysAhead}-day reminder`,
  }));

  const results = {
    sent: 0,
    failed: 0,
    updated: 0,
  };

  for (const reminder of reminders) {
    try {
      // Calculate the date window for this reminder
      const targetDate = startOfDay(addDays(now, reminder.daysAhead));
      const nextDay = addDays(targetDate, 1);

      // Find confirmed bookings in the target window and inspect campaign history per reminder.
      const bookingsToRemind = await prisma.booking.findMany({
        where: {
          status: "CONFIRMED",
          eventDate: {
            gte: targetDate,
            lt: nextDay,
          },
        },
        include: {
          venue: true,
          caterer: true,
          retentionCampaigns: {
            where: {
              campaignType: "EVENT_REMINDER",
            },
            select: {
              metadata: true,
            },
          },
        },
      });

      console.log(
        `[Retention] Found ${bookingsToRemind.length} bookings for ${reminder.name}`
      );

      for (const booking of bookingsToRemind) {
        try {
          const alreadySentForWindow = booking.retentionCampaigns.some((campaign) => {
            return getJsonNumber(campaign.metadata, "daysAhead") === reminder.daysAhead;
          });

          if (alreadySentForWindow) {
            continue;
          }

          const venueName = booking.venue?.name || booking.caterer?.name || "Your Venue";

          const emailSent = await sendEventReminder(
            booking.customerEmail,
            booking.customerName,
            venueName,
            booking.bookingNumber,
            booking.eventDate,
            booking.guestCount,
            booking.id,
            reminder.daysAhead
          );

          if (emailSent) {
            // Mark reminder as sent
            await prisma.booking.update({
              where: { id: booking.id },
              data: { reminderEmailSentAt: new Date() },
            });

            // Also create a RetentionCampaign record for tracking
            await prisma.retentionCampaign.create({
              data: {
                userId: booking.userId,
                bookingId: booking.id,
                campaignType: "EVENT_REMINDER",
                emailSentAt: new Date(),
                status: "SENT",
                metadata: {
                  daysAhead: reminder.daysAhead,
                  reminderType: reminder.name,
                },
              },
            });

            results.sent++;
          } else {
            results.failed++;
          }
        } catch (err) {
          console.error(
            `[Retention] Error sending reminder for booking ${booking.id}:`,
            err
          );
          results.failed++;
        }
      }
    } catch (err) {
      console.error(`[Retention] Error processing ${reminder.name}:`, err);
    }
  }

  return results;
}

// ==================== POST-EVENT FEEDBACK ====================

/**
 * Find completed bookings and send feedback request emails
 * Send 1-2 days after the event
 */
export async function processPostEventFeedback() {
  return processPostEventFeedbackWithSettings();
}

async function processPostEventFeedbackWithSettings(settings?: RetentionSettings) {
  const resolvedSettings = settings ?? (await getRetentionSettings());

  if (!resolvedSettings.enabled || !resolvedSettings.sendPostEventFeedback) {
    return { sent: 0, failed: 0 };
  }

  const now = new Date();

  try {
    const targetDate = startOfDay(addDays(now, -resolvedSettings.feedbackDelayDays));
    const nextDay = addDays(targetDate, 1);

    const bookingsForFeedback = await prisma.booking.findMany({
      where: {
        status: "COMPLETED",
        eventDate: {
          gte: targetDate,
          lt: nextDay,
        },
        feedbackEmailSentAt: null,
        review: null,
      },
      include: {
        venue: true,
        caterer: true,
      },
    });

    console.log(
      `[Retention] Found ${bookingsForFeedback.length} bookings for post-event feedback`
    );

    const results = {
      sent: 0,
      failed: 0,
    };

    for (const booking of bookingsForFeedback) {
      try {
        const venueName = booking.venue?.name || booking.caterer?.name || "Your Venue";

        const emailSent = await sendPostEventFeedback(
          booking.customerEmail,
          booking.customerName,
          venueName,
          booking.id,
          booking.userId
        );

        if (emailSent) {
          // Mark feedback request as sent
          await prisma.booking.update({
            where: { id: booking.id },
            data: { feedbackEmailSentAt: new Date() },
          });

          // Create RetentionCampaign record
          await prisma.retentionCampaign.create({
            data: {
              userId: booking.userId,
              bookingId: booking.id,
              campaignType: "POST_EVENT_FEEDBACK",
              emailSentAt: new Date(),
              status: "SENT",
              metadata: {
                eventDate: booking.eventDate,
              },
            },
          });

          results.sent++;
        } else {
          results.failed++;
        }
      } catch (err) {
        console.error(
          `[Retention] Error sending feedback request for booking ${booking.id}:`,
          err
        );
        results.failed++;
      }
    }

    return results;
  } catch (err) {
    console.error("[Retention] Error processing post-event feedback:", err);
    return { sent: 0, failed: 0 };
  }
}

// ==================== RE-ENGAGEMENT CAMPAIGNS ====================

/**
 * Find inactive users and send re-engagement emails
 * Target users who haven't booked anything in 60+ days
 */
export async function processReEngagementCampaigns(
  inactiveDaysThreshold?: number,
  settings?: RetentionSettings
) {
  const resolvedSettings = settings ?? (await getRetentionSettings());

  if (!resolvedSettings.enabled || !resolvedSettings.sendReEngagement) {
    return { sent: 0, failed: 0 };
  }

  const effectiveInactiveDaysThreshold =
    inactiveDaysThreshold ?? resolvedSettings.reEngagementDays;
  const now = new Date();

  try {
    // Find users who last booked 60+ days ago
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - effectiveInactiveDaysThreshold);

    // Get users with bookings before cutoff date and no recent re-engagement email
    const inactiveUsers = await prisma.user.findMany({
      where: {
        role: "USER",
        isActive: true,
        isBanned: false,
        bookings: {
          some: {
            createdAt: {
              lt: cutoffDate,
            },
          },
        },
        retentionCampaigns: {
          none: {
            campaignType: "RE_ENGAGEMENT",
            emailSentAt: {
              gte: cutoffDate, // No re-engagement email sent in the last 60 days
            },
          },
        },
      },
      include: {
        bookings: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    console.log(
      `[Retention] Found ${inactiveUsers.length} inactive users for re-engagement`
    );

    const results = {
      sent: 0,
      failed: 0,
    };

    for (const user of inactiveUsers) {
      try {
        // Only send to users with valid email
        if (!user.email || !user.name) {
          continue;
        }

        const emailSent = await sendReEngagementEmail(
          user.email,
          user.name,
          user.id,
          effectiveInactiveDaysThreshold
        );

        if (emailSent) {
          // Create RetentionCampaign record
          await prisma.retentionCampaign.create({
            data: {
              userId: user.id,
              campaignType: "RE_ENGAGEMENT",
              emailSentAt: new Date(),
              status: "SENT",
              metadata: {
                inactiveDays: inactiveDaysThreshold,
                configuredInactiveDays: effectiveInactiveDaysThreshold,
                lastBookingDate: user.bookings[0]?.createdAt,
              },
            },
          });

          results.sent++;
        } else {
          results.failed++;
        }
      } catch (err) {
        console.error(`[Retention] Error sending re-engagement email to user ${user.id}:`, err);
        results.failed++;
      }
    }

    return results;
  } catch (err) {
    console.error("[Retention] Error processing re-engagement campaigns:", err);
    return { sent: 0, failed: 0 };
  }
}

// ==================== MAIN RETENTION PROCESSOR ====================

/**
 * Main function to run all retention processes
 * Should be called periodically (e.g., via cron job or scheduled task)
 */
export async function runRetentionAutomation() {
  console.log("[Retention] Starting retention automation run at", new Date().toISOString());

  try {
    const settings = await getRetentionSettings();

    if (!settings.enabled) {
      return {
        eventReminders: { sent: 0, failed: 0, updated: 0 },
        postEventFeedback: { sent: 0, failed: 0 },
        reEngagement: { sent: 0, failed: 0 },
        completedAt: new Date().toISOString(),
        skipped: true,
      };
    }

    const reminderResults = await processEventReminders(settings);
    const feedbackResults = await processPostEventFeedbackWithSettings(settings);
    const reEngagementResults = await processReEngagementCampaigns(undefined, settings);

    const summary = {
      eventReminders: reminderResults,
      postEventFeedback: feedbackResults,
      reEngagement: reEngagementResults,
      settings,
      completedAt: new Date().toISOString(),
    };

    console.log("[Retention] Retention automation completed:", summary);
    return summary;
  } catch (err) {
    console.error("[Retention] Error in retention automation:", err);
    throw err;
  }
}
