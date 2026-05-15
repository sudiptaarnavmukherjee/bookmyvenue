"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BellRing,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Mail,
  Smartphone,
  Radio,
  RotateCcw,
} from "lucide-react";

type ReliabilityData = {
  summary: {
    emailSent24h: number;
    emailFailed24h: number;
    smsSent24h: number;
    smsFailed24h: number;
    pushSubscribers: number;
  };
  retryPolicy: {
    maxAttempts: number;
    alertThreshold: number;
  };
  retryQueue: {
    email: number;
    sms: number;
  };
  providerAlerts: Array<{
    channel: "EMAIL" | "SMS";
    provider: string;
    failureCount: number;
  }>;
  failedLogs: {
    email: Array<{
      id: string;
      to: string;
      template: string;
      provider: string;
      error: string | null;
      createdAt: string;
      attemptsUsed: number;
      retryable: boolean;
    }>;
    sms: Array<{
      id: string;
      to: string;
      template: string;
      provider: string;
      error: string | null;
      createdAt: string;
      attemptsUsed: number;
      retryable: boolean;
    }>;
  };
};

function channelBadge(channel: "EMAIL" | "SMS") {
  return channel === "EMAIL"
    ? "bg-blue-100 text-blue-700"
    : "bg-emerald-100 text-emerald-700";
}

export default function NotificationReliabilityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [data, setData] = useState<ReliabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/notification-reliability", { cache: "no-store" });
      const json = (await res.json()) as ReliabilityData | { error?: string };
      if (!res.ok) {
        throw new Error((json as { error?: string }).error || "Failed to load reliability data");
      }
      setData(json as ReliabilityData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reliability data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || session.user.role !== "ADMIN") {
      router.push("/auth/signin");
      return;
    }
    void load();
  }, [status, session, router, load]);

  const retrySingle = async (channel: "EMAIL" | "SMS", logId: string) => {
    try {
      setRetrying(logId);
      const res = await fetch("/api/admin/notification-reliability/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, logId }),
      });
      if (!res.ok) throw new Error("Retry request failed");
      await load();
    } catch {
      setError("Failed to retry selected notification");
    } finally {
      setRetrying(null);
    }
  };

  const retryAll = async () => {
    try {
      setRetrying("bulk");
      const res = await fetch("/api/admin/notification-reliability/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retryAll: true }),
      });
      if (!res.ok) throw new Error("Bulk retry request failed");
      await load();
    } catch {
      setError("Failed to run bulk retry");
    } finally {
      setRetrying(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 rounded-lg hover:bg-gray-100 text-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notification Reliability</h1>
              <p className="text-sm text-gray-500">Track delivery health, retries, and provider failure alerts.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button
              onClick={retryAll}
              disabled={retrying === "bulk"}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
            >
              {retrying === "bulk" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              Retry Queue
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {data ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white border rounded-xl p-4">
                <p className="text-xs text-gray-500">Email Sent (24h)</p>
                <p className="mt-2 text-2xl font-bold text-blue-700">{data.summary.emailSent24h}</p>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <p className="text-xs text-gray-500">Email Failed (24h)</p>
                <p className="mt-2 text-2xl font-bold text-rose-700">{data.summary.emailFailed24h}</p>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <p className="text-xs text-gray-500">SMS Sent (24h)</p>
                <p className="mt-2 text-2xl font-bold text-emerald-700">{data.summary.smsSent24h}</p>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <p className="text-xs text-gray-500">SMS Failed (24h)</p>
                <p className="mt-2 text-2xl font-bold text-rose-700">{data.summary.smsFailed24h}</p>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <p className="text-xs text-gray-500">Push Subscribers</p>
                <p className="mt-2 text-2xl font-bold text-indigo-700">{data.summary.pushSubscribers}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white border rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-900 mb-1">Retry Queue</p>
                <p className="text-sm text-gray-600">Email: {data.retryQueue.email} | SMS: {data.retryQueue.sms}</p>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-900 mb-1">Retry Policy</p>
                <p className="text-sm text-gray-600">Max attempts: {data.retryPolicy.maxAttempts}</p>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-900 mb-1">Alert Threshold</p>
                <p className="text-sm text-gray-600">{data.retryPolicy.alertThreshold}+ failures in 6h</p>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h2 className="text-lg font-semibold text-gray-900">Provider Alerts</h2>
              </div>

              {data.providerAlerts.length === 0 ? (
                <p className="text-sm text-gray-500">No active provider alerts in the last 6 hours.</p>
              ) : (
                <div className="space-y-2">
                  {data.providerAlerts.map((alert, idx) => (
                    <div key={`${alert.channel}-${alert.provider}-${idx}`} className="border rounded-lg p-3 bg-amber-50">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${channelBadge(alert.channel)}`}>
                            {alert.channel}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">{alert.provider}</span>
                        </div>
                        <span className="text-sm font-semibold text-rose-700">{alert.failureCount} failures</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <div className="bg-white border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Failed Email Logs</h2>
                </div>
                {data.failedLogs.email.length === 0 ? (
                  <p className="text-sm text-gray-500">No recent failed emails.</p>
                ) : (
                  <div className="space-y-2 max-h-[480px] overflow-auto pr-1">
                    {data.failedLogs.email.map((row) => (
                      <div key={row.id} className="border rounded-lg p-3 bg-gray-50">
                        <p className="text-sm font-semibold text-gray-900">{row.to}</p>
                        <p className="text-xs text-gray-600">{row.template} | attempts: {row.attemptsUsed}</p>
                        <p className="text-xs text-rose-700 mt-1">{row.error || "Unknown error"}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-gray-500">{new Date(row.createdAt).toLocaleString("en-IN")}</span>
                          <button
                            onClick={() => retrySingle("EMAIL", row.id)}
                            disabled={!row.retryable || retrying === row.id}
                            className="text-xs font-semibold rounded-md px-2 py-1 bg-indigo-600 text-white disabled:opacity-50"
                          >
                            {retrying === row.id ? "Retrying..." : row.retryable ? "Retry" : "Maxed"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Failed SMS Logs</h2>
                </div>
                {data.failedLogs.sms.length === 0 ? (
                  <p className="text-sm text-gray-500">No recent failed SMS.</p>
                ) : (
                  <div className="space-y-2 max-h-[480px] overflow-auto pr-1">
                    {data.failedLogs.sms.map((row) => (
                      <div key={row.id} className="border rounded-lg p-3 bg-gray-50">
                        <p className="text-sm font-semibold text-gray-900">{row.to}</p>
                        <p className="text-xs text-gray-600">{row.template} | attempts: {row.attemptsUsed}</p>
                        <p className="text-xs text-rose-700 mt-1">{row.error || "Unknown error"}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-gray-500">{new Date(row.createdAt).toLocaleString("en-IN")}</span>
                          <button
                            onClick={() => retrySingle("SMS", row.id)}
                            disabled={!row.retryable || retrying === row.id}
                            className="text-xs font-semibold rounded-md px-2 py-1 bg-indigo-600 text-white disabled:opacity-50"
                          >
                            {retrying === row.id ? "Retrying..." : row.retryable ? "Retry" : "Maxed"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 flex items-start gap-2">
              <Radio className="h-4 w-4 mt-0.5" />
              Push channel reliability is enforced during send with automatic retry attempts and alert logging on repeated provider failures.
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
