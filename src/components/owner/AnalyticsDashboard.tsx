"use client";

import { useState, useEffect } from "react";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  Calendar,
  Building,
  UtensilsCrossed,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowUpRight,
  BarChart3,
  Percent,
  CreditCard,
} from "lucide-react";

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    totalBookings: number;
    confirmedBookings: number;
    pendingBookings: number;
    cancelledBookings: number;
    totalViews: number;
    totalInquiries: number;
    conversionRate: number;
    avgBookingValue: number;
    pendingPayoutAmount: number;
    pendingPayoutCount: number;
    completedPayoutAmount: number;
  };
  venues: Array<{
    id: string;
    name: string;
    viewCount: number;
    inquiryCount: number;
    weeklyViews: number;
    revenue: number;
    bookings: number;
  }>;
  caterers: Array<{
    id: string;
    name: string;
    viewCount: number;
    inquiryCount: number;
    weeklyViews: number;
    revenue: number;
    bookings: number;
  }>;
  revenueChart: Array<{
    date: string;
    revenue: number;
    bookings: number;
  }>;
  bookingsByStatus: {
    confirmed: number;
    pending: number;
    cancelled: number;
    completed: number;
  };
  topPerformers: Array<{
    id: string;
    type: string;
    name: string;
    revenue: number;
    bookings: number;
  }>;
  recentBookings: Array<{
    id: string;
    bookingNumber: string;
    type: string;
    status: string;
    customerName: string;
    eventDate: string;
    totalAmount: number;
    entityName: string;
    createdAt: string;
  }>;
  upcomingEvents: Array<{
    id: string;
    bookingNumber: string;
    customerName: string;
    eventDate: string;
    guestCount: number;
    entityName: string;
  }>;
}

export default function OwnerAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/owner/analytics?period=${period}`);
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

  const maxChartValue = Math.max(...(data?.revenueChart.map(d => d.revenue) || [1]));

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Business Analytics</h2>
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
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Total Revenue"
            value={`₹${data.summary.totalRevenue.toLocaleString("en-IN")}`}
            icon={<IndianRupee className="h-5 w-5" />}
            color="green"
            subtitle={`${data.summary.confirmedBookings} confirmed bookings`}
          />
          <MetricCard
            title="Total Views"
            value={data.summary.totalViews.toLocaleString()}
            icon={<Eye className="h-5 w-5" />}
            color="blue"
            subtitle={`${data.summary.totalInquiries} inquiries`}
          />
          <MetricCard
            title="Conversion Rate"
            value={`${data.summary.conversionRate}%`}
            icon={<Percent className="h-5 w-5" />}
            color="purple"
            subtitle="Views → Bookings"
          />
          <MetricCard
            title="Avg Booking Value"
            value={`₹${data.summary.avgBookingValue.toLocaleString("en-IN")}`}
            icon={<BarChart3 className="h-5 w-5" />}
            color="orange"
          />
        </div>
      )}

      {/* Payout Summary */}
      {data && (data.summary.pendingPayoutAmount > 0 || data.summary.completedPayoutAmount > 0) && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Pending Payout</p>
                <p className="text-2xl font-bold text-green-700">
                  ₹{data.summary.pendingPayoutAmount.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Received this period</p>
              <p className="text-lg font-semibold text-gray-700">
                ₹{data.summary.completedPayoutAmount.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Chart */}
      {data && data.revenueChart.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <div className="h-48 flex items-end gap-1">
            {data.revenueChart.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t hover:from-purple-700 hover:to-purple-500 transition-colors cursor-pointer"
                  style={{
                    height: `${Math.max((item.revenue / maxChartValue) * 150, 4)}px`,
                  }}
                  title={`₹${item.revenue.toLocaleString("en-IN")} (${item.bookings} bookings)`}
                />
                <span className="text-xs text-gray-400 truncate w-full text-center">
                  {item.date.slice(-5)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Booking Status */}
        {data && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Booking Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <StatusCard
                label="Confirmed"
                value={data.bookingsByStatus.confirmed}
                icon={<CheckCircle className="h-4 w-4" />}
                color="green"
              />
              <StatusCard
                label="Pending"
                value={data.bookingsByStatus.pending}
                icon={<Clock className="h-4 w-4" />}
                color="yellow"
              />
              <StatusCard
                label="Completed"
                value={data.bookingsByStatus.completed}
                icon={<CheckCircle className="h-4 w-4" />}
                color="blue"
              />
              <StatusCard
                label="Cancelled"
                value={data.bookingsByStatus.cancelled}
                icon={<XCircle className="h-4 w-4" />}
                color="red"
              />
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        {data && data.upcomingEvents.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Upcoming Events</h3>
            <div className="space-y-3">
              {data.upcomingEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">{event.customerName}</p>
                    <p className="text-sm text-gray-500">{event.entityName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-purple-600">
                      {new Date(event.eventDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    <p className="text-xs text-gray-500">{event.guestCount} guests</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Property Performance */}
      {data && (data.venues.length > 0 || data.caterers.length > 0) && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Property Performance</h3>
          <div className="space-y-4">
            {data.venues.map((venue) => (
              <div key={venue.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Building className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{venue.name}</p>
                    <p className="text-sm text-gray-500">
                      {venue.viewCount.toLocaleString()} views • {venue.bookings} bookings
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    ₹{venue.revenue.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-gray-400">
                    +{venue.weeklyViews} views this week
                  </p>
                </div>
              </div>
            ))}
            {data.caterers.map((caterer) => (
              <div key={caterer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <UtensilsCrossed className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{caterer.name}</p>
                    <p className="text-sm text-gray-500">
                      {caterer.viewCount.toLocaleString()} views • {caterer.bookings} bookings
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    ₹{caterer.revenue.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-gray-400">
                    +{caterer.weeklyViews} views this week
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Bookings */}
      {data && data.recentBookings.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="font-semibold text-gray-900">Recent Bookings</h3>
          </div>
          <div className="divide-y">
            {data.recentBookings.map((booking) => (
              <div key={booking.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{booking.customerName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        booking.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
                        booking.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                        booking.status === "COMPLETED" ? "bg-blue-100 text-blue-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {booking.entityName} • {new Date(booking.eventDate).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      ₹{(booking.totalAmount || 0).toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-gray-400">{booking.bookingNumber}</p>
                  </div>
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
  color: "green" | "blue" | "purple" | "orange";
  subtitle?: string;
}) {
  const colors = {
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
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
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "green" | "yellow" | "blue" | "red";
}) {
  const colors = {
    green: "bg-green-50 text-green-700 border-green-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className={`p-4 rounded-xl border ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
