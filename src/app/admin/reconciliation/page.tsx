"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Download,
  AlertTriangle,
  IndianRupee,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";

type RangeType = "week" | "month" | "year" | "all";

type ReconciliationResponse = {
  summary: {
    approvedCancellations: number;
    completedRefunds: number;
    pendingOrProcessingRefunds: number;
    failedRefunds: number;
    mismatchCount: number;
    mismatchAmount: number;
    completedPaymentCount: number;
    completedPaymentAmount: number;
    completedOwnerAmount: number;
    completedPlatformFee: number;
  };
  payoutSummary: Record<string, { count: number; amount: number }>;
  mismatches: Array<{
    id: string;
    bookingId: string;
    bookingNumber: string;
    customerName: string;
    customerEmail: string | null;
    bookingTotalAmount: number | null;
    refundAmount: number | null;
    refundStatus: string;
    refundId: string | null;
    approvedAt: string | null;
    refundedAt: string | null;
  }>;
};

function fmt(amount: number) {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export default function ReconciliationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [range, setRange] = useState<RangeType>("month");
  const [data, setData] = useState<ReconciliationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/reconciliation?range=${range}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as ReconciliationResponse | { error?: string };
      if (!res.ok) {
        throw new Error((json as { error?: string }).error || "Failed to load reconciliation");
      }
      setData(json as ReconciliationResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reconciliation");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || session.user.role !== "ADMIN") {
      router.push("/auth/signin");
      return;
    }
    void load();
  }, [status, session, router, load]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await fetch(`/api/admin/reconciliation/export?range=${range}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ||
        `reconciliation-${range}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
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
              <h1 className="text-2xl font-bold text-gray-900">Reconciliation Hub</h1>
              <p className="text-sm text-gray-500">Track refund and payout mismatches across approved cancellations.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as RangeType)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
            <button
              onClick={load}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-60"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export CSV
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
                <p className="text-xs text-gray-500">Approved Cancellations</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{data.summary.approvedCancellations}</p>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <p className="text-xs text-gray-500">Completed Refunds</p>
                <p className="mt-2 text-2xl font-bold text-emerald-600">{data.summary.completedRefunds}</p>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <p className="text-xs text-gray-500">Pending/Processing</p>
                <p className="mt-2 text-2xl font-bold text-amber-600">{data.summary.pendingOrProcessingRefunds}</p>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <p className="text-xs text-gray-500">Failed Refunds</p>
                <p className="mt-2 text-2xl font-bold text-rose-600">{data.summary.failedRefunds}</p>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <p className="text-xs text-gray-500">Mismatch Amount</p>
                <p className="mt-2 text-2xl font-bold text-indigo-700">{fmt(data.summary.mismatchAmount)}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white border rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-800 mb-3">Payment Summary</p>
                <div className="space-y-2 text-sm text-gray-700">
                  <p className="flex justify-between"><span>Completed Payments</span><span className="font-semibold">{data.summary.completedPaymentCount}</span></p>
                  <p className="flex justify-between"><span>Total Collected</span><span className="font-semibold">{fmt(data.summary.completedPaymentAmount)}</span></p>
                  <p className="flex justify-between"><span>Owner Amount</span><span className="font-semibold">{fmt(data.summary.completedOwnerAmount)}</span></p>
                  <p className="flex justify-between"><span>Platform Fee</span><span className="font-semibold">{fmt(data.summary.completedPlatformFee)}</span></p>
                </div>
              </div>

              <div className="bg-white border rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-800 mb-3">Payout Summary</p>
                <div className="space-y-2 text-sm text-gray-700">
                  {Object.keys(data.payoutSummary).length === 0 ? (
                    <p className="text-gray-500">No payouts in selected range.</p>
                  ) : (
                    Object.entries(data.payoutSummary).map(([statusKey, value]) => (
                      <p key={statusKey} className="flex justify-between">
                        <span className="uppercase">{statusKey}</span>
                        <span className="font-semibold">{value.count} ({fmt(value.amount)})</span>
                      </p>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h2 className="text-lg font-semibold text-gray-900">Mismatch Queue</h2>
              </div>

              {data.mismatches.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No mismatches found. Reconciliation is clean.</div>
              ) : (
                <div className="space-y-3">
                  {data.mismatches.map((row) => (
                    <div key={row.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <p className="font-semibold text-gray-900">#{row.bookingNumber} - {row.customerName}</p>
                          <p className="text-xs text-gray-500">Refund amount: {fmt(row.refundAmount || 0)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {row.refundStatus === "COMPLETED" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-3 w-3" />COMPLETED</span>
                          ) : row.refundStatus === "FAILED" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700"><XCircle className="h-3 w-3" />FAILED</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700"><Clock3 className="h-3 w-3" />{row.refundStatus}</span>
                          )}
                          <Link href="/admin/disputes" className="text-xs font-semibold text-indigo-600 hover:underline">Open Disputes</Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
