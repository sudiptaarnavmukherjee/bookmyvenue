"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IndianRupee,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Building,
  Calendar,
  ChevronRight,
  Download,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface EarningsSummary {
  totalEarnings: number;
  pendingPayout: number;
  completedPayouts: number;
  platformFeePercent: number;
}

interface PaymentRecord {
  id: string;
  amount: number;
  ownerAmount: number | null;
  platformFee: number | null;
  status: string;
  paidAt: string;
  method: string | null;
  booking: {
    id: string;
    bookingNumber: string;
    customerName: string;
    eventDate: string;
    propertyName: string;
  };
}

interface MonthlyStats {
  month: string;
  year: number;
  earnings: number;
  bookings: number;
}

interface PayoutRecord {
  id: string;
  amount: number;
  status: string;
  processedAt: string | null;
  periodStart: string;
  periodEnd: string;
  transferMode: string | null;
}

interface EarningsData {
  summary: EarningsSummary;
  payments: PaymentRecord[];
  monthlyStats: MonthlyStats[];
  payouts: PayoutRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function EarningsDashboard() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [period, setPeriod] = useState<"all" | "month" | "year">("all");

  useEffect(() => {
    fetchEarnings();
  }, [period]);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/owner/earnings?period=${period}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch earnings");
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchEarnings}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { summary, payments, monthlyStats, payouts } = data;

  // Calculate growth (mock for now)
  const lastMonth = monthlyStats[monthlyStats.length - 2]?.earnings || 0;
  const thisMonth = monthlyStats[monthlyStats.length - 1]?.earnings || 0;
  const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

  // Find max earnings for chart scaling
  const maxEarnings = Math.max(...monthlyStats.map((m) => m.earnings), 1);

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex justify-end">
        <div className="inline-flex bg-gray-100 rounded-xl p-1">
          {(["all", "month", "year"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === p
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {p === "all" ? "All Time" : p === "month" ? "This Month" : "This Year"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Earnings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <IndianRupee className="h-6 w-6 text-green-600" />
            </div>
            {growth !== 0 && (
              <div
                className={`flex items-center gap-1 text-sm ${
                  growth > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {growth > 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                {Math.abs(growth).toFixed(1)}%
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-1">Total Earnings</p>
          <p className="text-3xl font-bold text-gray-900">
            ₹{summary.totalEarnings.toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            After {summary.platformFeePercent}% platform fee
          </p>
        </motion.div>

        {/* Pending Payout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">Available for Payout</p>
          <p className="text-3xl font-bold text-gray-900">
            ₹{summary.pendingPayout.toLocaleString("en-IN")}
          </p>
          {summary.pendingPayout >= 1000 && (
            <button
              onClick={() => setShowPayoutModal(true)}
              className="mt-3 text-sm text-purple-600 font-medium flex items-center gap-1 hover:text-purple-700"
            >
              Request Payout
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </motion.div>

        {/* Completed Payouts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">Total Withdrawn</p>
          <p className="text-3xl font-bold text-gray-900">
            ₹{summary.completedPayouts.toLocaleString("en-IN")}
          </p>
        </motion.div>
      </div>

      {/* Earnings Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Earnings</h3>
          <TrendingUp className="h-5 w-5 text-gray-400" />
        </div>

        <div className="flex items-end gap-2 h-40">
          {monthlyStats.map((stat, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-lg transition-all hover:opacity-80"
                style={{
                  height: `${(stat.earnings / maxEarnings) * 100}%`,
                  minHeight: stat.earnings > 0 ? "8px" : "0",
                }}
                title={`₹${stat.earnings.toLocaleString("en-IN")}`}
              />
              <span className="text-xs text-gray-500">{stat.month}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
            View All
          </button>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Wallet className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {payment.booking.propertyName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {payment.booking.bookingNumber} • {payment.booking.customerName}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">
                    +₹{(payment.ownerAmount || 0).toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(payment.paidAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Payout History */}
      {payouts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payout History</h3>
          <div className="space-y-3">
            {payouts.map((payout) => (
              <div
                key={payout.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg">
                    <Download className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      ₹{payout.amount.toLocaleString("en-IN")}
                    </p>
                    <p className="text-sm text-gray-500">
                      {payout.transferMode || "Bank Transfer"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      payout.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : payout.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {payout.status}
                  </span>
                  {payout.processedAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(payout.processedAt).toLocaleDateString("en-IN")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Payout Request Modal */}
      {showPayoutModal && (
        <PayoutRequestModal
          availableAmount={summary.pendingPayout}
          onClose={() => setShowPayoutModal(false)}
          onSuccess={() => {
            setShowPayoutModal(false);
            fetchEarnings();
          }}
        />
      )}
    </div>
  );
}

// Payout Request Modal
interface PayoutRequestModalProps {
  availableAmount: number;
  onClose: () => void;
  onSuccess: () => void;
}

function PayoutRequestModal({
  availableAmount,
  onClose,
  onSuccess,
}: PayoutRequestModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transferMode, setTransferMode] = useState<"NEFT" | "IMPS" | "UPI">("NEFT");
  const [formData, setFormData] = useState({
    amount: availableAmount,
    bankAccountNumber: "",
    bankIfscCode: "",
    bankAccountName: "",
    upiId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/owner/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          transferMode,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to request payout");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">Request Payout</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                ₹
              </span>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                }
                max={availableAmount}
                min={1000}
                className="w-full pl-8 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Available: ₹{availableAmount.toLocaleString("en-IN")} • Min: ₹1,000
            </p>
          </div>

          {/* Transfer Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transfer Mode
            </label>
            <div className="flex gap-2">
              {(["NEFT", "IMPS", "UPI"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTransferMode(mode)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    transferMode === mode
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Bank Details */}
          {(transferMode === "NEFT" || transferMode === "IMPS") && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={formData.bankAccountName}
                  onChange={(e) =>
                    setFormData({ ...formData, bankAccountName: e.target.value })
                  }
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.bankAccountNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, bankAccountNumber: e.target.value })
                  }
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={formData.bankIfscCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankIfscCode: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </>
          )}

          {/* UPI Details */}
          {transferMode === "UPI" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UPI ID
              </label>
              <input
                type="text"
                value={formData.upiId}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                placeholder="yourname@upi"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Request Payout"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
