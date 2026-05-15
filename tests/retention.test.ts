import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockPrisma,
  mockSendEventReminder,
  mockSendPostEventFeedback,
  mockSendReEngagementEmail,
} = vi.hoisted(() => ({
  mockPrisma: {
    systemConfig: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    booking: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    retentionCampaign: {
      create: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
  mockSendEventReminder: vi.fn(),
  mockSendPostEventFeedback: vi.fn(),
  mockSendReEngagementEmail: vi.fn(),
}));

vi.mock("../src/lib/db", () => ({
  prisma: mockPrisma,
  default: mockPrisma,
}));

vi.mock("../src/lib/email", () => ({
  sendEventReminder: mockSendEventReminder,
  sendPostEventFeedback: mockSendPostEventFeedback,
  sendReEngagementEmail: mockSendReEngagementEmail,
}));

import {
  getRetentionSettings,
  processEventReminders,
  runRetentionAutomation,
  saveRetentionSettings,
} from "../src/lib/retention";

describe("retention automation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.systemConfig.findMany.mockResolvedValue([]);
    mockPrisma.systemConfig.upsert.mockResolvedValue(undefined);
    mockPrisma.booking.findMany.mockResolvedValue([]);
    mockPrisma.booking.update.mockResolvedValue(undefined);
    mockPrisma.retentionCampaign.create.mockResolvedValue(undefined);
    mockPrisma.user.findMany.mockResolvedValue([]);
    mockSendEventReminder.mockResolvedValue(true);
    mockSendPostEventFeedback.mockResolvedValue(true);
    mockSendReEngagementEmail.mockResolvedValue(true);
  });

  it("returns default settings when no persisted config exists", async () => {
    const settings = await getRetentionSettings();

    expect(settings).toEqual({
      enabled: true,
      sendEventReminders: true,
      reminderDaysAhead: [7, 3, 1],
      sendPostEventFeedback: true,
      feedbackDelayDays: 2,
      sendReEngagement: true,
      reEngagementDays: 60,
    });
  });

  it("persists settings through system config upserts", async () => {
    mockPrisma.systemConfig.findMany.mockResolvedValueOnce([
      { key: "retention.enabled", value: "false" },
      { key: "retention.reminderDaysAhead", value: "[10,5,2]" },
      { key: "retention.reEngagementDays", value: "45" },
    ]);

    const settings = await saveRetentionSettings({
      enabled: false,
      reminderDaysAhead: [10, 5, 2],
      reEngagementDays: 45,
    });

    expect(mockPrisma.systemConfig.upsert).toHaveBeenCalledTimes(3);
    expect(mockPrisma.systemConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: "retention.reminderDaysAhead" },
        create: expect.objectContaining({
          value: "[10,5,2]",
          type: "json",
        }),
      })
    );
    expect(settings.enabled).toBe(false);
    expect(settings.reminderDaysAhead).toEqual([10, 5, 2]);
    expect(settings.reEngagementDays).toBe(45);
  });

  it("dedupes reminders per window and still sends later windows for the same booking", async () => {
    mockPrisma.booking.findMany
      .mockResolvedValueOnce([
        {
          id: "booking-7",
          userId: "user-1",
          bookingNumber: "BMV-7",
          customerEmail: "user@example.com",
          customerName: "Test User",
          eventDate: new Date("2026-05-22T10:00:00.000Z"),
          guestCount: 200,
          venue: { name: "Lotus Palace" },
          caterer: null,
          retentionCampaigns: [{ metadata: { daysAhead: 7 } }],
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "booking-3",
          userId: "user-1",
          bookingNumber: "BMV-3",
          customerEmail: "user@example.com",
          customerName: "Test User",
          eventDate: new Date("2026-05-18T10:00:00.000Z"),
          guestCount: 200,
          venue: { name: "Lotus Palace" },
          caterer: null,
          retentionCampaigns: [{ metadata: { daysAhead: 7 } }],
        },
      ]);

    const result = await processEventReminders({
      enabled: true,
      sendEventReminders: true,
      reminderDaysAhead: [7, 3],
      sendPostEventFeedback: true,
      feedbackDelayDays: 2,
      sendReEngagement: true,
      reEngagementDays: 60,
    });

    expect(mockSendEventReminder).toHaveBeenCalledTimes(1);
    expect(mockSendEventReminder).toHaveBeenCalledWith(
      "user@example.com",
      "Test User",
      "Lotus Palace",
      "BMV-3",
      expect.any(Date),
      200,
      "booking-3",
      3
    );
    expect(mockPrisma.booking.update).toHaveBeenCalledTimes(1);
    expect(mockPrisma.retentionCampaign.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bookingId: "booking-3",
          campaignType: "EVENT_REMINDER",
          metadata: expect.objectContaining({ daysAhead: 3 }),
        }),
      })
    );
    expect(result).toEqual({ sent: 1, failed: 0, updated: 0 });
  });

  it("skips the orchestration when retention is globally disabled", async () => {
    mockPrisma.systemConfig.findMany.mockResolvedValue([
      { key: "retention.enabled", value: "false" },
    ]);

    const result = await runRetentionAutomation();

    expect(mockPrisma.booking.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.user.findMany).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        skipped: true,
        eventReminders: { sent: 0, failed: 0, updated: 0 },
        postEventFeedback: { sent: 0, failed: 0 },
        reEngagement: { sent: 0, failed: 0 },
      })
    );
  });
});