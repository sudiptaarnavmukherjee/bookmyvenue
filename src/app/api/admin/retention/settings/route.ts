import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import {
  getRetentionSettings,
  saveRetentionSettings,
  type RetentionSettings,
} from "@/lib/retention";

function parseReminderDays(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && item > 0)
      .sort((left, right) => right - left);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isInteger(item) && item > 0)
      .sort((left, right) => right - left);
  }

  return [];
}

function normalizeSettings(body: Record<string, unknown>): Partial<RetentionSettings> {
  const updates: Partial<RetentionSettings> = {};

  if (typeof body.enabled === "boolean") {
    updates.enabled = body.enabled;
  }

  if (typeof body.sendEventReminders === "boolean") {
    updates.sendEventReminders = body.sendEventReminders;
  }

  if (body.reminderDaysAhead !== undefined) {
    const reminderDaysAhead = parseReminderDays(body.reminderDaysAhead);
    if (reminderDaysAhead.length > 0) {
      updates.reminderDaysAhead = reminderDaysAhead;
    }
  }

  if (typeof body.sendPostEventFeedback === "boolean") {
    updates.sendPostEventFeedback = body.sendPostEventFeedback;
  }

  if (body.feedbackDelayDays !== undefined) {
    const feedbackDelayDays = Number(body.feedbackDelayDays);
    if (Number.isInteger(feedbackDelayDays) && feedbackDelayDays > 0) {
      updates.feedbackDelayDays = feedbackDelayDays;
    }
  }

  if (typeof body.sendReEngagement === "boolean") {
    updates.sendReEngagement = body.sendReEngagement;
  }

  if (body.reEngagementDays !== undefined) {
    const reEngagementDays = Number(body.reEngagementDays);
    if (Number.isInteger(reEngagementDays) && reEngagementDays > 0) {
      updates.reEngagementDays = reEngagementDays;
    }
  }

  return updates;
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  return session;
}

export async function GET() {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [settings, totalCampaigns, recentCampaigns, groupedCampaigns] = await Promise.all([
      getRetentionSettings(),
      prisma.retentionCampaign.count(),
      prisma.retentionCampaign.count({
        where: {
          emailSentAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.retentionCampaign.groupBy({
        by: ["campaignType"],
        _count: {
          _all: true,
        },
      }),
    ]);

    const latestCampaign = await prisma.retentionCampaign.findFirst({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        campaignType: true,
        status: true,
        emailSentAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      settings,
      stats: {
        totalCampaigns,
        recentCampaigns,
        latestCampaign,
        campaignBreakdown: groupedCampaigns.reduce<Record<string, number>>((accumulator, item) => {
          accumulator[item.campaignType] = item._count._all;
          return accumulator;
        }, {}),
      },
    });
  } catch (error) {
    console.error("Error fetching retention settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch retention settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const updates = normalizeSettings(body);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid retention settings provided" },
        { status: 400 }
      );
    }

    const settings = await saveRetentionSettings(updates);

    return NextResponse.json({
      success: true,
      message: "Retention settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Error updating retention settings:", error);
    return NextResponse.json(
      { error: "Failed to update retention settings" },
      { status: 500 }
    );
  }
}
