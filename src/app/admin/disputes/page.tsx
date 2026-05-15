"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  IndianRupee,
  CalendarDays,
  User,
  Building2,
  Loader2,
} from "lucide-react";

type CancellationStatus = "PENDING" | "APPROVED" | "REJECTED";

interface CancellationRequestRow {
  id: string;
  bookingId: string;
  bookingNumber: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  entityName: string | null;
  entityType: "VENUE" | "CATERER";
  ownerName: string | null;
  ownerEmail: string | null;
  eventDate: string;
  totalAmount: number | null;
  paidAmount: number | null;
  refundAmount: number | null;
  refundPercentage: number | null;
  reason: string;
  requestedBy: string;
  status: CancellationStatus;
  createdAt: string;
  approvedAt: string | null;
  refundedAt: string | null;
}

interface CancellationsResponse {
  cancellations: CancellationRequestRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminDisputesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [filter, setFilter] = useState<CancellationStatus | "ALL">("PENDING");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rows, setRows] = useState<CancellationRequestRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [refundById, setRefundById] = useState<Record<string, string>>({});

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const query = filter === "ALL" ? "" : `?status=${filter}`;
      const response = await fetch(`/api/admin/cancellations${query}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as CancellationsResponse | { error?: string };

      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Failed to load dispute queue");
      }

      setRows((data as CancellationsResponse).cancellations || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load dispute queue");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!session?.user || session.user.role !== "ADMIN") {
      router.push("/auth/signin");
      return;
    }

    void fetchRequests();
  }, [status, session, router, fetchRequests]);

  async function processRequest(id: string, action: "APPROVE" | "REJECT") {
    try {
      setProcessingId(id);
      setError(null);
      setMessage(null);

      const note = (noteById[id] || "").trim();
      const adjustedRefundAmount = refundById[id] ? Number(refundById[id]) : undefined;

      const response = await fetch("/api/admin/cancellations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          action,
          reason: note || undefined,
          adjustedRefundAmount:
            adjustedRefundAmount !== undefined && Number.isFinite(adjustedRefundAmount)
              ? adjustedRefundAmount
              : undefined,
        }),
      });

      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to process dispute");
      }

      setMessage(data.message || `Request ${action === "APPROVE" ? "approved" : "rejected"}`);
      await fetchRequests();
    } catch (processError) {
      setError(processError instanceof Error ? processError.message : "Failed to process dispute");
    } finally {
      setProcessingId(null);
    }
  }

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.total += 1;
        if (row.status === "PENDING") {
          acc.pending += 1;
        }
        if (row.status === "APPROVED") {
          acc.approved += 1;
        }
        if (row.status === "REJECTED") {
          acc.rejected += 1;
        }
        acc.refundExposure += row.refundAmount || 0;
        return acc;
      },
      { total: 0, pending: 0, approved: 0, rejected: 0, refundExposure: 0 }
    );
  }, [rows]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
        <div className="mx-auto max-w-7xl px-4 py-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dispute Resolution</h1>
              <p className="text-sm text-gray-500">Review cancellation disputes and resolve refund decisions.</p>
            </div>
          </div>
          <button
            onClick={fetchRequests}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {message ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>
        ) : null}
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-5">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">Total</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{summary.total}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs text-amber-700">Pending</p>
            <p className="mt-2 text-2xl font-bold text-amber-900">{summary.pending}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs text-emerald-700">Approved</p>
            <p className="mt-2 text-2xl font-bold text-emerald-900">{summary.approved}</p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-xs text-rose-700">Rejected</p>
            <p className="mt-2 text-2xl font-bold text-rose-900">{summary.rejected}</p>
          </div>
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            <p className="text-xs text-indigo-700">Refund Exposure</p>
            <p className="mt-2 text-2xl font-bold text-indigo-900">₹{summary.refundExposure.toLocaleString("en-IN")}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  filter === value
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
              <AlertTriangle className="mx-auto h-10 w-10 text-gray-400" />
              <p className="mt-3 text-gray-600">No disputes found for this filter.</p>
            </div>
          ) : (
            rows.map((row) => {
              const isPending = row.status === "PENDING";
              const isProcessing = processingId === row.id;

              return (
                <div key={row.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">#{row.bookingNumber}</span>
                        <span
                          className={`rounded-md px-2 py-1 text-xs font-semibold ${
                            row.status === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : row.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {row.status}
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{row.entityName || "Unknown listing"}</p>
                      <div className="grid gap-2 text-sm text-gray-600 md:grid-cols-2">
                        <p className="inline-flex items-center gap-2"><User className="h-4 w-4" />{row.customerName || "Unknown customer"}</p>
                        <p className="inline-flex items-center gap-2"><Building2 className="h-4 w-4" />Owner: {row.ownerName || "N/A"}</p>
                        <p className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" />Event: {new Date(row.eventDate).toLocaleDateString("en-IN")}</p>
                        <p className="inline-flex items-center gap-2"><IndianRupee className="h-4 w-4" />Refund: ₹{(row.refundAmount || 0).toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                    <div className="min-w-[260px] flex-1 md:max-w-sm">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Reason</p>
                      <p className="mt-1 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{row.reason}</p>
                    </div>
                  </div>

                  {isPending ? (
                    <div className="mt-4 grid gap-3 border-t border-gray-100 pt-4 md:grid-cols-3">
                      <input
                        type="number"
                        min={0}
                        step="1"
                        value={refundById[row.id] ?? String(row.refundAmount ?? "")}
                        onChange={(event) =>
                          setRefundById((current) => ({ ...current, [row.id]: event.target.value }))
                        }
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                        placeholder="Adjusted refund amount"
                      />
                      <input
                        type="text"
                        value={noteById[row.id] ?? ""}
                        onChange={(event) =>
                          setNoteById((current) => ({ ...current, [row.id]: event.target.value }))
                        }
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                        placeholder="Decision notes (optional)"
                      />
                      <div className="flex items-center gap-2 md:justify-end">
                        <button
                          disabled={isProcessing}
                          onClick={() => processRequest(row.id, "APPROVE")}
                          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          Approve
                        </button>
                        <button
                          disabled={isProcessing}
                          onClick={() => processRequest(row.id, "REJECT")}
                          className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                          Reject
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
