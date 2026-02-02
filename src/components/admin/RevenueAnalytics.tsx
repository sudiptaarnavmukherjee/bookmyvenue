"use client";

import { useState, useEffect } from "react";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Smartphone,
  Building,
  Loader2,
  Download,
  ArrowUpRight,
  BarChart3,
} from "lucide-react";

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    platformEarnings: number;
    ownerEarnings: number;
    totalBookings: number;
    avgBookingValue: number;
    refundedAmount: number;
    pendingPayouts: number;
  };
  revenueChart: Array<{
    period: string;
    total: number;
    platform: number;
    owners: number;
    bookings: number;
  }>;
  paymentMethods: Array<{
    method: string;
    _sum: { amount: number };
    _count: { id: number };
  }>;
  bookingStats: {
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
    completed: number;
  };
  largeTransactions: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    booking: {
      id: string;
      venue?: { name: string };
      caterer?: { businessName: string };
    };
  }>;
}

export default function RevenueAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");
  const [groupBy, setGroupBy] = useState("day");

  useEffect(() => {
    fetchAnalytics();
  }, [period, groupBy]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/analytics/revenue?period=${period}&groupBy=${groupBy}`
      );
      const result = await response.json();

      if (response.ok) {
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const maxRevenue = Math.max(...(data?.revenueChart.map((d) => d.total) || [1]));

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {[
            { value: "7d", label: "7 Days" },
            { value: "30d", label: "30 Days" },
            { value: "90d", label: "90 Days" },
            { value: "1y", label: "1 Year" },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                period === p.value
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value)}
          className="px-4 py-2 bg-gray-100 rounded-lg border-0"
        >
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
        </select>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Total Revenue"
            value={`₹${data.summary.totalRevenue.toLocaleString("en-IN")}`}
            icon={<IndianRupee className="h-5 w-5" />}
            color="purple"
          />
          <MetricCard
            title="Platform Earnings"
            value={`₹${data.summary.platformEarnings.toLocaleString("en-IN")}`}
            icon={<TrendingUp className="h-5 w-5" />}
            color="green"
            subtitle="Commission earned"
          />
          <MetricCard
            title="Owner Earnings"
            value={`₹${data.summary.ownerEarnings.toLocaleString("en-IN")}`}
            icon={<Building className="h-5 w-5" />}
            color="blue"
          />
          <MetricCard
            title="Avg Booking Value"
            value={`₹${Math.round(data.summary.avgBookingValue).toLocaleString("en-IN")}`}
            icon={<BarChart3 className="h-5 w-5" />}
            color="orange"
          />
        </div>
      )}

      {/* Revenue Chart */}
      {data && data.revenueChart.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <div className="h-64 flex items-end gap-1">
            {data.revenueChart.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col gap-0.5">
                  {/* Owner earnings portion */}
                  <div
                    className="w-full bg-blue-400 rounded-t"
                    style={{
                      height: `${(item.owners / maxRevenue) * 200}px`,
                    }}
                    title={`Owner: ₹${item.owners.toLocaleString("en-IN")}`}
                  />
                  {/* Platform earnings portion */}
                  <div
                    className="w-full bg-purple-500 rounded-b"
                    style={{
                      height: `${(item.platform / maxRevenue) * 200}px`,
                    }}
                    title={`Platform: ₹${item.platform.toLocaleString("en-IN")}`}
                  />
                </div>
                <span className="text-xs text-gray-500 truncate w-full text-center">
                  {item.period.slice(-5)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded" />
              <span className="text-sm text-gray-600">Platform</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-400 rounded" />
              <span className="text-sm text-gray-600">Owner</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Payment Methods */}
        {data && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Payment Methods</h3>
            <div className="space-y-4">
              {data.paymentMethods.map((method, index) => {
                const totalPayments = data.paymentMethods.reduce(
                  (sum, m) => sum + (m._sum.amount || 0),
                  0
                );
                const percentage = totalPayments > 0 
                  ? ((method._sum.amount || 0) / totalPayments) * 100 
                  : 0;

                return (
                  <div key={method.method || index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {method.method === "UPI" ? (
                          <Smartphone className="h-4 w-4 text-purple-600" />
                        ) : (
                          <CreditCard className="h-4 w-4 text-blue-600" />
                        )}
                        <span className="font-medium">{method.method || "Other"}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ₹{(method._sum.amount || 0).toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-gray-500">
                          {method._count.id} transactions
                        </p>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Booking Stats */}
        {data && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Booking Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <StatusCard
                label="Total"
                value={data.bookingStats.total}
                color="gray"
              />
              <StatusCard
                label="Confirmed"
                value={data.bookingStats.confirmed}
                color="green"
              />
              <StatusCard
                label="Pending"
                value={data.bookingStats.pending}
                color="yellow"
              />
              <StatusCard
                label="Completed"
                value={data.bookingStats.completed}
                color="blue"
              />
            </div>
          </div>
        )}
      </div>

      {/* Large Transactions */}
      {data && data.largeTransactions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Large Transactions (&gt;₹50,000)
          </h3>
          <div className="divide-y">
            {data.largeTransactions.map((txn) => (
              <div key={txn.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {txn.booking.venue?.name || txn.booking.caterer?.businessName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(txn.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    ₹{txn.amount.toLocaleString("en-IN")}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      txn.status === "CAPTURED"
                        ? "bg-green-100 text-green-700"
                        : txn.status === "REFUNDED"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {txn.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Metric Card Component
function MetricCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "purple" | "green" | "blue" | "orange";
  subtitle?: string;
}) {
  const colors = {
    purple: "bg-purple-100 text-purple-600",
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
        <span className="text-sm text-gray-500">{title}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

// Status Card Component
function StatusCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "gray" | "green" | "yellow" | "blue";
}) {
  const colors = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    blue: "bg-blue-100 text-blue-700",
  };

  return (
    <div className={`p-4 rounded-xl ${colors[color]}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
