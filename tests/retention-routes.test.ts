import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetServerSession = vi.fn();
const mockRunRetentionAutomation = vi.fn();
const mockGetRetentionSettings = vi.fn();
const mockSaveRetentionSettings = vi.fn();
const mockPrisma = {
  retentionCampaign: {
    count: vi.fn(),
    groupBy: vi.fn(),
    findFirst: vi.fn(),
  },
};

vi.mock("next-auth", () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/retention", () => ({
  getRetentionSettings: mockGetRetentionSettings,
  saveRetentionSettings: mockSaveRetentionSettings,
  runRetentionAutomation: mockRunRetentionAutomation,
}));

vi.mock("@/lib/db", () => ({
  __esModule: true,
  default: mockPrisma,
  prisma: mockPrisma,
}));

describe("admin retention routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.RETENTION_AUTOMATION_SECRET = "test-secret";

    mockGetRetentionSettings.mockResolvedValue({
      enabled: true,
      sendEventReminders: true,
      reminderDaysAhead: [7, 3, 1],
      sendPostEventFeedback: true,
      feedbackDelayDays: 2,
      sendReEngagement: true,
      reEngagementDays: 60,
    });
    mockSaveRetentionSettings.mockResolvedValue({
      enabled: true,
      sendEventReminders: true,
      reminderDaysAhead: [7, 3, 1],
      sendPostEventFeedback: true,
      feedbackDelayDays: 2,
      sendReEngagement: true,
      reEngagementDays: 60,
    });
    mockRunRetentionAutomation.mockResolvedValue({ success: true });
    mockPrisma.retentionCampaign.count.mockResolvedValue(0);
    mockPrisma.retentionCampaign.groupBy.mockResolvedValue([]);
    mockPrisma.retentionCampaign.findFirst.mockResolvedValue(null);
  });

  it("rejects retention settings reads for non-admin sessions", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const settingsRoute = await import("../src/app/api/admin/retention/settings/route");
    const response = await settingsRoute.GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("normalizes and saves retention settings from the admin API", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });

    const settingsRoute = await import("../src/app/api/admin/retention/settings/route");
    const response = await settingsRoute.PATCH(
      new Request("http://localhost/api/admin/retention/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: false,
          sendEventReminders: true,
          reminderDaysAhead: "10, 5, 2",
          feedbackDelayDays: 4,
          sendReEngagement: false,
          reEngagementDays: 90,
        }),
      })
    );

    expect(mockSaveRetentionSettings).toHaveBeenCalledWith({
      enabled: false,
      sendEventReminders: true,
      reminderDaysAhead: [10, 5, 2],
      feedbackDelayDays: 4,
      sendReEngagement: false,
      reEngagementDays: 90,
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        success: true,
        message: "Retention settings updated successfully",
      })
    );
  });

  it("allows an admin session to trigger retention automation without a bearer token", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });
    mockRunRetentionAutomation.mockResolvedValue({
      eventReminders: { sent: 1, failed: 0, updated: 0 },
      postEventFeedback: { sent: 0, failed: 0 },
      reEngagement: { sent: 0, failed: 0 },
    });

    const triggerRoute = await import("../src/app/api/admin/retention/trigger/route");
    const response = await triggerRoute.POST(
      new Request("http://localhost/api/admin/retention/trigger", {
        method: "POST",
      }) as any
    );

    expect(mockRunRetentionAutomation).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        success: true,
        message: "Retention automation completed successfully",
      })
    );
  });

  it("rejects trigger requests without an admin session or valid secret", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const triggerRoute = await import("../src/app/api/admin/retention/trigger/route");
    const response = await triggerRoute.POST(
      new Request("http://localhost/api/admin/retention/trigger", {
        method: "POST",
      }) as any
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Unauthorized: Invalid admin session or retention secret",
    });
  });
});