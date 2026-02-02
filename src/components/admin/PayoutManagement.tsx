"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  Eye,
  Search,
  Filter,
  ChevronRight,
  Building,
  User,
  Calendar,
} from "lucide-react";

interface PayoutSummary {
  pending: { count: number; amount: number };
  processing: { count: number; amount: number };
  completed: { count: number; amount: number };
  failed: { count: number; amount: number };
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  transferMode: string | null;
  periodStart: string;
  periodEnd: string;
  totalBookings: number;
  createdAt: string;
  processedAt: string | null;
  owner: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
  bankAccountNumber?: string;
  bankIfscCode?: string;
  upiId?: string;
}

interface PayoutsData {
  payouts: Payout[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: PayoutSummary;
}

export default function PayoutManagement() {
  const [data, setData] = useState<PayoutsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [selectedPayout, setSelectedPayout] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPayouts();
  }, [filter, page]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter) params.set("status", filter);
      params.set("page", page.toString());

      const response = await fetch(`/api/admin/payouts?${params}`);
      const result = await response.json();

      if (response.ok) {
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching payouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (payoutId: string, action: string, notes?: string, transactionId?: string) => {
    try {
      setActionLoading(payoutId);
      const response = await fetch(`/api/admin/payouts/${payoutId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes, transactionId }),
      });

      if (response.ok) {
        fetchPayouts();
        setSelectedPayout(null);
      } else {
        const error = await response.json();
        alert(error.error || "Action failed");
      }
    } catch (error) {
      console.error("Error processing payout:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    PROCESSING: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-700",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    PENDING: <Clock className="h-4 w-4" />,
    PROCESSING: <Loader2 className="h-4 w-4 animate-spin" />,
    COMPLETED: <CheckCircle className="h-4 w-4" />,
    FAILED: <XCircle className="h-4 w-4" />,
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            title="Pending"
            count={data.summary.pending.count}
            amount={data.summary.pending.amount}
            color="yellow"
            onClick={() => setFilter("PENDING")}
            active={filter === "PENDING"}
          />
          <SummaryCard
            title="Processing"
            count={data.summary.processing.count}
            amount={data.summary.processing.amount}
            color="blue"
            onClick={() => setFilter("PROCESSING")}
            active={filter === "PROCESSING"}
          />
          <SummaryCard
            title="Completed"
            count={data.summary.completed.count}
            amount={data.summary.completed.amount}
            color="green"
            onClick={() => setFilter("COMPLETED")}
            active={filter === "COMPLETED"}
          />
          <SummaryCard
            title="Failed"
            count={data.summary.failed.count}
            amount={data.summary.failed.amount}
            color="red"
            onClick={() => setFilter("FAILED")}
            active={filter === "FAILED"}
          />
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              !filter ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
        </div>
        <button
          onClick={fetchPayouts}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          <Loader2 className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Payouts List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Owner</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Amount</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Period</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Transfer</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.payouts.map((payout) => (
                <tr key={payout.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{payout.owner.name || "Unknown"}</p>
                      <p className="text-sm text-gray-500">{payout.owner.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">
                      ₹{payout.amount.toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-gray-500">{payout.totalBookings} bookings</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        statusColors[payout.status]
                      }`}
                    >
                      {statusIcons[payout.status]}
                      {payout.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(payout.periodStart).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    {" - "}
                    {new Date(payout.periodEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <p>{payout.transferMode || "N/A"}</p>
                    {payout.upiId && <p className="text-xs text-gray-400">{payout.upiId}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedPayout(payout.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {payout.status === "PENDING" && (
                        <button
                          onClick={() => handleAction(payout.id, "approve")}
                          disabled={actionLoading === payout.id}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 disabled:opacity-50"
                        >
                          {actionLoading === payout.id ? "..." : "Approve"}
                        </button>
                      )}
                      {payout.status === "PROCESSING" && (
                        <>
                          <button
                            onClick={() => {
                              const txnId = prompt("Enter transaction ID:");
                              if (txnId) handleAction(payout.id, "complete", undefined, txnId);
                            }}
                            disabled={actionLoading === payout.id}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 disabled:opacity-50"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt("Enter failure reason:");
                              if (reason) handleAction(payout.id, "fail", reason);
                            }}
                            disabled={actionLoading === payout.id}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 disabled:opacity-50"
                          >
                            Fail
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <p className="text-sm text-gray-600">
              Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-gray-100 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
                className="px-3 py-1 bg-gray-100 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Summary Card Component
function SummaryCard({
  title,
  count,
  amount,
  color,
  onClick,
  active,
}: {
  title: string;
  count: number;
  amount: number;
  color: "yellow" | "blue" | "green" | "red";
  onClick: () => void;
  active: boolean;
}) {
  const colors = {
    yellow: "bg-yellow-50 border-yellow-200",
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    red: "bg-red-50 border-red-200",
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border-2 transition-all text-left ${
        active ? `${colors[color]} ring-2 ring-purple-500` : "bg-white border-gray-100 hover:border-gray-200"
      }`}
    >
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{count}</p>
      <p className="text-sm text-gray-600">
        ₹{amount.toLocaleString("en-IN")}
      </p>
    </button>
  );
}
