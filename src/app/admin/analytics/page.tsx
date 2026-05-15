"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Eye, TrendingUp, MapPin, Calendar, Building2,
  Utensils, ArrowLeft, Loader2, RefreshCw,
  DollarSign, BarChart3, Download, CreditCard, CheckCircle, XCircle, Clock
} from "lucide-react";

type ViewAnalyticsData = {
  topVenues: Array<{ id: string; name: string; area: string; viewCount: number; weeklyViews: number }>;
  topCaterers: Array<{ id: string; name: string; area: string; viewCount: number; weeklyViews: number }>;
  topAreas: Array<{ name: string; totalViews: number; venueCount: number; catererCount: number }>;
  totalStats: { totalVenueViews: number; totalCatererViews: number; todayViews: number; weeklyViews: number };
};

type RevenueData = {
  summary: {
    totalRevenue: number;
    totalPlatformFee: number;
    totalOwnerAmount: number;
    transactionCount: number;
    averageTransaction: number;
    pendingPayouts: number;
    pendingPayoutCount: number;
  };
  revenueChart: Array<{ date: string; totalRevenue: number; platformFee: number; ownerAmount: number; transactionCount: number }>;
  paymentMethods: Array<{ method: string; count: number; amount: number; percentage: number }>;
  bookingStats: Array<{ status: string; count: number; amount: number }>;
  largeTransactions: Array<{
    id: string;
    amount: number;
    paidAt: string;
    method: string;
    booking: { bookingNumber: string; customerName: string; propertyName: string };
  }>;
};

function fmt(amount: number) {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "text-green-600 bg-green-50",
  PENDING: "text-yellow-600 bg-yellow-50",
  CANCELLED: "text-red-600 bg-red-50",
  COMPLETED: "text-blue-600 bg-blue-50",
};

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"views" | "revenue">("views");
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "all">("week");
  const [revenuePeriod, setRevenuePeriod] = useState<"week" | "month" | "year" | "all">("month");

  const [viewData, setViewData] = useState<ViewAnalyticsData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchViews = useCallback(async () => {
    const res = await fetch(`/api/admin/analytics?range=${dateRange}`);
    if (!res.ok) throw new Error("Failed to load view analytics");
    return res.json();
  }, [dateRange]);

  const fetchRevenue = useCallback(async () => {
    const res = await fetch(`/api/admin/analytics/revenue?period=${revenuePeriod}&groupBy=day`);
    if (!res.ok) throw new Error("Failed to load revenue analytics");
    return res.json();
  }, [revenuePeriod]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "views") {
        const data = await fetchViews();
        setViewData(data);
      } else {
        const data = await fetchRevenue();
        setRevenueData(data);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [activeTab, fetchViews, fetchRevenue]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      router.push("/");
      return;
    }
    load();
  }, [session, status, router, load]);

  const handleExport = async (type: "bookings" | "revenue") => {
    setExporting(true);
    try {
      const res = await fetch(`/api/admin/analytics/export?type=${type}&period=${revenuePeriod}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ?? `${type}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (status === "loading" || (loading && !viewData && !revenueData)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (error && !viewData && !revenueData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={load} className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/admin")}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
                <p className="text-gray-500 text-sm">Views, revenue &amp; bookings</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Tab switcher */}
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                <button
                  onClick={() => setActiveTab("views")}
                  className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors ${
                    activeTab === "views"
                      ? "bg-pink-500 text-white"
                      : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  Views
                </button>
                <button
                  onClick={() => setActiveTab("revenue")}
                  className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors ${
                    activeTab === "revenue"
                      ? "bg-pink-500 text-white"
                      : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Revenue
                </button>
              </div>

              {activeTab === "views" ? (
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="all">All Time</option>
                </select>
              ) : (
                <>
                  <select
                    value={revenuePeriod}
                    onChange={(e) => setRevenuePeriod(e.target.value as typeof revenuePeriod)}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                    <option value="all">All Time</option>
                  </select>
                  <button
                    onClick={() => handleExport("bookings")}
                    disabled={exporting}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 text-sm font-medium disabled:opacity-50"
                  >
                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Export Bookings
                  </button>
                  <button
                    onClick={() => handleExport("revenue")}
                    disabled={exporting}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 text-sm font-medium disabled:opacity-50"
                  >
                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Export Revenue
                  </button>
                </>
              )}

              <button onClick={load} disabled={loading} className="p-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50">
                <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* ── VIEWS TAB ── */}
        {activeTab === "views" && viewData && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Venue Views", value: viewData.totalStats.totalVenueViews, icon: <Building2 className="w-5 h-5 text-pink-500" /> },
                { label: "Caterer Views", value: viewData.totalStats.totalCatererViews, icon: <Utensils className="w-5 h-5 text-orange-500" /> },
                { label: "Today", value: viewData.totalStats.todayViews, icon: <Calendar className="w-5 h-5 text-blue-500" /> },
                { label: "This Week", value: viewData.totalStats.weeklyViews, icon: <TrendingUp className="w-5 h-5 text-green-500" /> },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 text-sm">{stat.label}</span>
                    {stat.icon}
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value?.toLocaleString() || 0}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-pink-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Viewed Venues</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {viewData.topVenues?.length ? viewData.topVenues.map((venue, idx) => (
                    <div key={venue.id} onClick={() => router.push(`/venues/${venue.id}`)}
                      className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 flex items-center justify-center bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-full font-semibold text-sm">{idx + 1}</span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{venue.name}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{venue.area || "N/A"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1"><Eye className="w-4 h-4" />{venue.viewCount?.toLocaleString()}</p>
                        <p className="text-xs text-green-500">+{venue.weeklyViews || 0} this week</p>
                      </div>
                    </div>
                  )) : <p className="p-4 text-gray-500 text-center">No venue data yet</p>}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Viewed Caterers</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {viewData.topCaterers?.length ? viewData.topCaterers.map((caterer, idx) => (
                    <div key={caterer.id} onClick={() => router.push(`/catering/${caterer.id}`)}
                      className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 flex items-center justify-center bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full font-semibold text-sm">{idx + 1}</span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{caterer.name}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{caterer.area || "N/A"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1"><Eye className="w-4 h-4" />{caterer.viewCount?.toLocaleString()}</p>
                        <p className="text-xs text-green-500">+{caterer.weeklyViews || 0} this week</p>
                      </div>
                    </div>
                  )) : <p className="p-4 text-gray-500 text-center">No caterer data yet</p>}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 md:col-span-2">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Views by Area</h2>
                </div>
                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {viewData.topAreas?.length ? viewData.topAreas.map((area, idx) => (
                    <div key={area.name} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">{area.name}</span>
                        <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded">#{idx + 1}</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{area.totalViews?.toLocaleString() || 0}</p>
                      <p className="text-xs text-gray-500">{area.venueCount} venues &bull; {area.catererCount} caterers</p>
                    </div>
                  )) : <p className="col-span-4 text-gray-500 text-center py-4">No area data yet</p>}
                </div>
              </motion.div>
            </div>
          </>
        )}

        {/* ── REVENUE TAB ── */}
        {activeTab === "revenue" && (
          <>
            {loading && <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>}

            {!loading && revenueData && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Total Revenue", value: fmt(revenueData.summary.totalRevenue), icon: <DollarSign className="w-5 h-5 text-green-500" />, sub: `${revenueData.summary.transactionCount} transactions` },
                    { label: "Platform Fee", value: fmt(revenueData.summary.totalPlatformFee), icon: <BarChart3 className="w-5 h-5 text-blue-500" />, sub: "Net earnings" },
                    { label: "Avg Transaction", value: fmt(revenueData.summary.averageTransaction), icon: <TrendingUp className="w-5 h-5 text-pink-500" />, sub: "per booking" },
                    { label: "Pending Payouts", value: fmt(revenueData.summary.pendingPayouts), icon: <Clock className="w-5 h-5 text-yellow-500" />, sub: `${revenueData.summary.pendingPayoutCount} payouts` },
                  ].map((card, i) => (
                    <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 text-sm">{card.label}</span>
                        {card.icon}
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                      <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-pink-500" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bookings by Status</h2>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {revenueData.bookingStats.length ? revenueData.bookingStats.map((s) => (
                        <div key={s.status} className="p-4 flex items-center justify-between">
                          <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[s.status] || "text-gray-600 bg-gray-100"}`}>
                            {s.status === "CONFIRMED" && <CheckCircle className="w-3 h-3" />}
                            {s.status === "PENDING" && <Clock className="w-3 h-3" />}
                            {s.status === "CANCELLED" && <XCircle className="w-3 h-3" />}
                            {s.status === "COMPLETED" && <CheckCircle className="w-3 h-3" />}
                            {s.status}
                          </span>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900 dark:text-white">{s.count} bookings</p>
                            <p className="text-sm text-gray-500">{fmt(s.amount)}</p>
                          </div>
                        </div>
                      )) : <p className="p-4 text-gray-500 text-center">No booking data</p>}
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-blue-500" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Methods</h2>
                    </div>
                    <div className="p-4 space-y-4">
                      {revenueData.paymentMethods.length ? revenueData.paymentMethods.map((m) => (
                        <div key={m.method}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{m.method}</span>
                            <span className="text-sm text-gray-500">{fmt(m.amount)} ({m.percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-pink-500 to-orange-400 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(m.percentage, 100)}%` }} />
                          </div>
                        </div>
                      )) : <p className="text-gray-500 text-center py-4">No payment data</p>}
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 md:col-span-2">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Timeline</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                            <th className="p-4 font-medium">Date</th>
                            <th className="p-4 font-medium">Total</th>
                            <th className="p-4 font-medium">Platform Fee</th>
                            <th className="p-4 font-medium">Owner Share</th>
                            <th className="p-4 font-medium">Transactions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {revenueData.revenueChart.length ? (
                            [...revenueData.revenueChart].reverse().slice(0, 20).map((row) => (
                              <tr key={row.date} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                <td className="p-4 text-gray-900 dark:text-white font-mono">{row.date}</td>
                                <td className="p-4 text-green-600 font-semibold">{fmt(row.totalRevenue)}</td>
                                <td className="p-4 text-blue-600">{fmt(row.platformFee)}</td>
                                <td className="p-4 text-gray-700 dark:text-gray-300">{fmt(row.ownerAmount)}</td>
                                <td className="p-4 text-gray-500">{row.transactionCount}</td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">No revenue data for this period</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>

                  {revenueData.largeTransactions.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 md:col-span-2">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-yellow-500" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">High-Value Transactions (₹50k+)</h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                              <th className="p-4 font-medium">Booking</th>
                              <th className="p-4 font-medium">Customer</th>
                              <th className="p-4 font-medium">Property</th>
                              <th className="p-4 font-medium">Amount</th>
                              <th className="p-4 font-medium">Method</th>
                              <th className="p-4 font-medium">Paid At</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {revenueData.largeTransactions.map((t) => (
                              <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                <td className="p-4 font-mono text-xs text-gray-900 dark:text-white">{t.booking.bookingNumber}</td>
                                <td className="p-4 text-gray-900 dark:text-white">{t.booking.customerName}</td>
                                <td className="p-4 text-gray-500">{t.booking.propertyName}</td>
                                <td className="p-4 text-green-600 font-bold">{fmt(t.amount)}</td>
                                <td className="p-4 text-gray-500 capitalize">{t.method}</td>
                                <td className="p-4 text-gray-500 text-xs">{t.paidAt ? new Date(t.paidAt).toLocaleDateString("en-IN") : ""}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
