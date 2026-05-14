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

// ==================== EVENT REMINDERS ====================

/**
 * Find bookings that need event reminders (1, 3, or 7 days before event)
 * Send reminders that haven't been sent yet
 */
export async function processEventReminders() {
  const now = new Date();

  // Define reminder windows: send 7, 3, and 1 day(s) before event
  const reminders = [
    { daysAhead: 7, name: "7-day reminder" },
    { daysAhead: 3, name: "3-day reminder" },
    { daysAhead: 1, name: "1-day reminder" },
  ];

  const results = {
    sent: 0,
    failed: 0,
    updated: 0,
  };

  for (const reminder of reminders) {
    try {
      // Calculate the date window for this reminder
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + reminder.daysAhead);
      targetDate.setHours(0, 0, 0, 0);

      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Find confirmed bookings in PENDING state that haven't had reminder sent
      const bookingsToRemind = await prisma.booking.findMany({
        where: {
          status: "CONFIRMED", // Only send to confirmed bookings
          eventDate: {
            gte: targetDate,
            lt: nextDay,
          },
          reminderEmailSentAt: null, // Only if reminder hasn't been sent
        },
        include: {
          user: true,
          venue: true,
          caterer: true,
        },
      });

      console.log(
        `[Retention] Found ${bookingsToRemind.length} bookings for ${reminder.name}`
      );

      for (const booking of bookingsToRemind) {
        try {
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
  const now = new Date();

  try {
    // Find bookings that were completed 1-2 days ago and haven't had feedback request sent
    const oneDaysAgo = new Date(now);
    oneDaysAgo.setDate(oneDaysAgo.getDate() - 1);
    oneDaysAgo.setHours(0, 0, 0, 0);

    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0);

    const bookingsForFeedback = await prisma.booking.findMany({
      where: {
        status: "COMPLETED",
        eventDate: {
          gte: twoDaysAgo,
          lte: oneDaysAgo,
        },
        feedbackEmailSentAt: null, // Only if feedback request hasn't been sent
        review: null, // Only if no review has been submitted yet (optional: change based on requirements)
      },
      include: {
        user: true,
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
export async function processReEngagementCampaigns(inactiveDaysThreshold: number = 60) {
  const now = new Date();

  try {
    // Find users who last booked 60+ days ago
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - inactiveDaysThreshold);

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
          inactiveDaysThreshold
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
    const reminderResults = await processEventReminders();
    const feedbackResults = await processPostEventFeedback();
    const reEngagementResults = await processReEngagementCampaigns();

    const summary = {
      eventReminders: reminderResults,
      postEventFeedback: feedbackResults,
      reEngagement: reEngagementResults,
      completedAt: new Date().toISOString(),
    };

    console.log("[Retention] Retention automation completed:", summary);
    return summary;
  } catch (err) {
    console.error("[Retention] Error in retention automation:", err);
    throw err;
  }
}
