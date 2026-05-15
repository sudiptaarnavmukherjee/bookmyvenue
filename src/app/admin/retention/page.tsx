"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BellRing,
  Clock3,
  Loader2,
  MailCheck,
  Play,
  Repeat2,
  Save,
  Settings2,
} from "lucide-react";

type RetentionSettings = {
  enabled: boolean;
  sendEventReminders: boolean;
  reminderDaysAhead: number[];
  sendPostEventFeedback: boolean;
  feedbackDelayDays: number;
  sendReEngagement: boolean;
  reEngagementDays: number;
};

type RetentionStats = {
  totalCampaigns: number;
  recentCampaigns: number;
  latestCampaign: {
    campaignType: string;
    status: string;
    emailSentAt: string | null;
    createdAt: string;
  } | null;
  campaignBreakdown: Record<string, number>;
};

const defaultSettings: RetentionSettings = {
  enabled: true,
  sendEventReminders: true,
  reminderDaysAhead: [7, 3, 1],
  sendPostEventFeedback: true,
  feedbackDelayDays: 2,
  sendReEngagement: true,
  reEngagementDays: 60,
};

export default function AdminRetentionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<RetentionSettings>(defaultSettings);
  const [stats, setStats] = useState<RetentionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!session?.user || session.user.role !== "ADMIN") {
      router.push("/auth/signin");
      return;
    }

    void fetchSettings();
  }, [router, session, status]);

  async function fetchSettings() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/retention/settings");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load retention settings");
      }

      setSettings(data.settings ?? defaultSettings);
      setStats(data.stats ?? null);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load retention settings");
    } finally {
      setLoading(false);
    }
  }

  function updateSetting<Key extends keyof RetentionSettings>(key: Key, value: RetentionSettings[Key]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function saveSettings() {
    try {
      setSaving(true);
      setMessage(null);
      setError(null);

      const response = await fetch("/api/admin/retention/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save retention settings");
      }

      setSettings(data.settings);
      setMessage("Retention settings saved.");
      await fetchSettings();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save retention settings");
    } finally {
      setSaving(false);
    }
  }

  async function runAutomation() {
    try {
      setRunning(true);
      setMessage(null);
      setError(null);

      const response = await fetch("/api/admin/retention/trigger", {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to run retention automation");
      }

      setMessage(data.results?.skipped ? "Automation is disabled. No campaigns were sent." : "Retention automation run completed.");
      await fetchSettings();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Failed to run retention automation");
    } finally {
      setRunning(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Retention Automation</h1>
              <p className="text-sm text-gray-500">Tune reminder timing, feedback nudges, and re-engagement windows.</p>
            </div>
          </div>
          <button
            onClick={runAutomation}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run Now
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {message ? (
          <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>
        ) : null}
        {error ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Automation</span>
              <Settings2 className="h-5 w-5 text-rose-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{settings.enabled ? "On" : "Off"}</p>
            <p className="mt-1 text-xs text-gray-500">Master switch for all retention jobs</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Campaigns Sent</span>
              <BellRing className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalCampaigns ?? 0}</p>
            <p className="mt-1 text-xs text-gray-500">All-time retention campaign records</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Last 7 Days</span>
              <MailCheck className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.recentCampaigns ?? 0}</p>
            <p className="mt-1 text-xs text-gray-500">Recent sends across all campaign types</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Latest Activity</span>
              <Repeat2 className="h-5 w-5 text-violet-500" />
            </div>
            <p className="text-sm font-semibold text-gray-900">{stats?.latestCampaign?.campaignType ?? "No runs yet"}</p>
            <p className="mt-1 text-xs text-gray-500">
              {stats?.latestCampaign
                ? new Date(stats.latestCampaign.emailSentAt ?? stats.latestCampaign.createdAt).toLocaleString("en-IN")
                : "Campaign history will appear here"}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          <div className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Campaign Controls</h2>
                <p className="text-sm text-gray-500">These settings are read by the automated retention job on every run.</p>
              </div>
              <button
                onClick={saveSettings}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </button>
            </div>

            <label className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
              <div>
                <p className="font-semibold text-gray-900">Enable retention automation</p>
                <p className="text-sm text-gray-500">Turn the entire lifecycle workflow on or off.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(event) => updateSetting("enabled", event.target.checked)}
                className="mt-1 h-5 w-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
              />
            </label>

            <div className="rounded-2xl border border-gray-200 p-5">
              <div className="mb-4 flex items-center gap-3">
                <Clock3 className="h-5 w-5 text-amber-500" />
                <div>
                  <h3 className="font-semibold text-gray-900">Event reminders</h3>
                  <p className="text-sm text-gray-500">Send countdown emails before confirmed bookings.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-[auto,1fr] md:items-center">
                <label className="inline-flex items-center gap-3 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={settings.sendEventReminders}
                    onChange={(event) => updateSetting("sendEventReminders", event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  Enabled
                </label>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Reminder days before event</label>
                  <input
                    type="text"
                    value={settings.reminderDaysAhead.join(", ")}
                    onChange={(event) => {
                      const reminderDaysAhead = event.target.value
                        .split(",")
                        .map((item) => Number(item.trim()))
                        .filter((item) => Number.isInteger(item) && item > 0)
                        .sort((left, right) => right - left);
                      updateSetting("reminderDaysAhead", reminderDaysAhead.length > 0 ? reminderDaysAhead : []);
                    }}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100"
                    placeholder="7, 3, 1"
                  />
                  <p className="mt-2 text-xs text-gray-500">Comma-separated positive integers. Example: 7, 3, 1</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 p-5">
              <div className="mb-4 flex items-center gap-3">
                <MailCheck className="h-5 w-5 text-emerald-500" />
                <div>
                  <h3 className="font-semibold text-gray-900">Post-event feedback</h3>
                  <p className="text-sm text-gray-500">Ask customers for reviews after completed bookings.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="inline-flex items-center gap-3 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={settings.sendPostEventFeedback}
                    onChange={(event) => updateSetting("sendPostEventFeedback", event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Enabled
                </label>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Days after event</label>
                  <input
                    type="number"
                    min={1}
                    value={settings.feedbackDelayDays}
                    onChange={(event) => updateSetting("feedbackDelayDays", Number(event.target.value) || 1)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 p-5">
              <div className="mb-4 flex items-center gap-3">
                <Repeat2 className="h-5 w-5 text-violet-500" />
                <div>
                  <h3 className="font-semibold text-gray-900">Re-engagement</h3>
                  <p className="text-sm text-gray-500">Bring inactive users back with browse-again campaigns.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="inline-flex items-center gap-3 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={settings.sendReEngagement}
                    onChange={(event) => updateSetting("sendReEngagement", event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  Enabled
                </label>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Inactive after days</label>
                  <input
                    type="number"
                    min={1}
                    value={settings.reEngagementDays}
                    onChange={(event) => updateSetting("reEngagementDays", Number(event.target.value) || 1)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">What runs today</h2>
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="font-medium text-gray-900">Pre-event reminders</p>
                  <p className="mt-1">Current windows: {settings.reminderDaysAhead.length > 0 ? settings.reminderDaysAhead.join(", ") : "none configured"} day(s) before each confirmed event.</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="font-medium text-gray-900">Feedback requests</p>
                  <p className="mt-1">Triggered {settings.feedbackDelayDays} day(s) after a completed event when no review exists yet.</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="font-medium text-gray-900">Re-engagement</p>
                  <p className="mt-1">Targets active users with no recent booking activity for at least {settings.reEngagementDays} day(s).</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Campaign mix</h2>
              <div className="mt-4 space-y-3 text-sm">
                {Object.entries(stats?.campaignBreakdown ?? {}).length === 0 ? (
                  <p className="text-gray-500">No retention campaigns have been recorded yet.</p>
                ) : (
                  Object.entries(stats?.campaignBreakdown ?? {}).map(([campaignType, count]) => (
                    <div key={campaignType} className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
                      <span className="font-medium text-gray-700">{campaignType}</span>
                      <span className="text-gray-900">{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Automated Schedule</h2>
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
                  <p className="font-semibold text-amber-900">Vercel Cron</p>
                  <p className="mt-1 text-amber-800">Runs daily at <strong>12:00 AM IST</strong> via <code className="bg-amber-100 px-1 rounded text-xs">/api/cron/retention</code>.</p>
                  <p className="mt-2 text-xs text-amber-700">Set <code className="bg-amber-100 px-1 rounded">CRON_SECRET</code> in your Vercel environment variables to protect this endpoint.</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="font-medium text-gray-900">Manual trigger</p>
                  <p className="mt-1">Use the &ldquo;Run Now&rdquo; button above to trigger all retention campaigns immediately, regardless of schedule.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
