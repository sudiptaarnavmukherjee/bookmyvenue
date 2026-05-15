"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Siren,
  TimerReset,
} from "lucide-react";

type ProbeStatus = "healthy" | "degraded" | "critical";

type ObservabilityData = {
  generatedAt: string;
  requestId: string;
  overview: {
    status: ProbeStatus;
    healthyProbeCount: number;
    degradedProbeCount: number;
    criticalProbeCount: number;
    totalProbeCount: number;
    syntheticAvailabilityPercent: number;
    staleCancellationRequests: number;
    openCancellationRequests: number;
    providerAlertCount: number;
  };
  latency: {
    probes: Array<{
      key: string;
      name: string;
      description: string;
      targetMs: number;
      latencyMs: number;
      status: ProbeStatus;
    }>;
  };
  serviceLevels: Array<{
    key: string;
    name: string;
    window: string;
    description: string;
    targetPercent: number;
    status: ProbeStatus;
    errorBudget: {
      actualPercent: number;
      remainingPercent: number;
      consumedPercent: number;
      allowedFailurePercent: number;
      consumedFailurePercent: number;
      remainingFailurePercent: number;
    };
  }>;
  operationalRisks: {
    failedNotifications24h: number;
    notificationSuccess24h: number;
    openCancellationRequests: number;
    staleCancellationRequests: number;
    providerAlerts: Array<{
      channel: "EMAIL" | "SMS";
      provider: string;
      failureCount: number;
    }>;
  };
  incidentChecklist: Array<{
    severity: string;
    trigger: string;
    responseTarget: string;
    actions: string[];
  }>;
};

function statusClasses(status: ProbeStatus) {
  if (status === "healthy") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (status === "degraded") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-rose-100 text-rose-700 border-rose-200";
}

function budgetBarClasses(status: ProbeStatus) {
  if (status === "healthy") return "bg-emerald-500";
  if (status === "degraded") return "bg-amber-500";
  return "bg-rose-500";
}

export default function ObservabilityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<ObservabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/observability", { cache: "no-store" });
      const json = (await res.json()) as ObservabilityData | { error?: string };
      if (!res.ok) {
        throw new Error((json as { error?: string }).error || "Failed to load observability data");
      }
      setData(json as ObservabilityData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load observability data");
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
              <h1 className="text-2xl font-bold text-gray-900">Observability &amp; SLOs</h1>
              <p className="text-sm text-gray-500">Synthetic latency, error budgets, and incident response cues for admin operations.</p>
            </div>
          </div>

          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {data ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Activity className="h-4 w-4 text-indigo-600" />
                  Synthetic Availability
                </div>
                <p className="mt-3 text-3xl font-bold text-gray-900">{data.overview.syntheticAvailabilityPercent}%</p>
                <p className="text-sm text-gray-500 mt-1">{data.overview.healthyProbeCount}/{data.overview.totalProbeCount} probes healthy</p>
              </div>

              <div className="bg-white border rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Siren className="h-4 w-4 text-rose-600" />
                  Provider Alerts
                </div>
                <p className="mt-3 text-3xl font-bold text-gray-900">{data.overview.providerAlertCount}</p>
                <p className="text-sm text-gray-500 mt-1">Active in the last 6 hours</p>
              </div>

              <div className="bg-white border rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock3 className="h-4 w-4 text-amber-600" />
                  Open Cancellations
                </div>
                <p className="mt-3 text-3xl font-bold text-gray-900">{data.overview.openCancellationRequests}</p>
                <p className="text-sm text-gray-500 mt-1">{data.overview.staleCancellationRequests} beyond 48h SLA</p>
              </div>

              <div className="bg-white border rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <ShieldAlert className="h-4 w-4 text-emerald-600" />
                  Snapshot Status
                </div>
                <div className={`mt-3 inline-flex px-3 py-1 rounded-full border text-sm font-semibold uppercase ${statusClasses(data.overview.status)}`}>
                  {data.overview.status}
                </div>
                <p className="text-sm text-gray-500 mt-2">Request ID: {data.requestId.slice(0, 8)}</p>
              </div>
            </div>

            <div className="grid xl:grid-cols-[1.35fr,0.95fr] gap-6">
              <div className="bg-white border rounded-2xl p-5">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Latency Dashboard</h2>
                    <p className="text-sm text-gray-500">Live synthetic timings for the most important admin workloads.</p>
                  </div>
                  <p className="text-xs text-gray-400">Updated {new Date(data.generatedAt).toLocaleString()}</p>
                </div>

                <div className="space-y-3">
                  {data.latency.probes.map((probe) => (
                    <div key={probe.key} className="border rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{probe.name}</p>
                            <span className={`px-2 py-1 rounded-full border text-xs font-semibold uppercase ${statusClasses(probe.status)}`}>
                              {probe.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{probe.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">{probe.latencyMs} ms</p>
                          <p className="text-xs text-gray-500">Target {probe.targetMs} ms</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white border rounded-2xl p-5">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Error Budgets</h2>
                  <div className="space-y-4">
                    {data.serviceLevels.map((item) => (
                      <div key={item.key} className="border rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">{item.name}</p>
                              <span className={`px-2 py-1 rounded-full border text-xs font-semibold uppercase ${statusClasses(item.status)}`}>
                                {item.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                            <p className="text-xs text-gray-400 mt-2">Window: {item.window}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-900">{item.errorBudget.actualPercent}%</p>
                            <p className="text-xs text-gray-500">Target {item.targetPercent}%</p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className={`h-full ${budgetBarClasses(item.status)}`}
                              style={{ width: `${Math.max(4, item.errorBudget.remainingPercent)}%` }}
                            />
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                            <span>Remaining budget {item.errorBudget.remainingPercent}%</span>
                            <span>Consumed {item.errorBudget.consumedPercent}%</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
                            <span>Allowed failures {item.errorBudget.allowedFailurePercent}%</span>
                            <span>Observed failures {item.errorBudget.consumedFailurePercent}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border rounded-2xl p-5">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Operational Risks</h2>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center justify-between gap-3">
                      <span>Failed notifications in 24h</span>
                      <strong className="text-gray-900">{data.operationalRisks.failedNotifications24h}</strong>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Successful notifications in 24h</span>
                      <strong className="text-gray-900">{data.operationalRisks.notificationSuccess24h}</strong>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Open cancellation reviews</span>
                      <strong className="text-gray-900">{data.operationalRisks.openCancellationRequests}</strong>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {data.operationalRisks.providerAlerts.length === 0 ? (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        No active provider alerts in the last 6 hours.
                      </div>
                    ) : (
                      data.operationalRisks.providerAlerts.map((alert, index) => (
                        <div key={`${alert.provider}-${alert.channel}-${index}`} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="font-semibold text-amber-900">{alert.channel} / {alert.provider}</span>
                            <span className="text-amber-700">{alert.failureCount} failures</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TimerReset className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">Incident Classification &amp; Response Checklist</h2>
              </div>

              <div className="grid lg:grid-cols-3 gap-4">
                {data.incidentChecklist.map((item) => (
                  <div key={item.severity} className="rounded-xl border p-4 bg-gray-50">
                    <div className="flex items-center gap-2 mb-3">
                      {item.severity === "SEV-1" ? (
                        <AlertTriangle className="h-5 w-5 text-rose-600" />
                      ) : item.severity === "SEV-2" ? (
                        <Clock3 className="h-5 w-5 text-amber-600" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{item.severity}</p>
                        <p className="text-xs text-gray-500">{item.responseTarget}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{item.trigger}</p>
                    <div className="space-y-2">
                      {item.actions.map((action) => (
                        <div key={action} className="text-sm text-gray-700 flex gap-2">
                          <span className="text-indigo-600">•</span>
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}