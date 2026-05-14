"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Loader2, Eye, MessageSquare, CalendarCheck2, Percent, TrendingUp, Clock3 } from "lucide-react";

type OwnerMetricsResponse = {
  success: boolean;
  metrics: {
    totalViews: number;
    totalInquiries: number;
    totalBookings: number;
    viewsThisMonth: number;
    inquiriesThisMonth: number;
    bookingsThisMonth: number;
    conversionRate: number | null;
    bookingRate: number | null;
    lastInquiryAt: string | null;
    lastBookingAt: string | null;
  };
  properties: Array<{
    id: string;
    name: string;
    city: string;
    area: string | null;
  }>;
  recentInquiries: Array<{
    id: string;
    message: string;
    status: string;
    createdAt: string;
    eventType: string | null;
    guestCount: number | null;
    budget: number | null;
    email: string | null;
    phoneNumber: string | null;
  }>;
};

function MetricCard({
  label,
  value,
  subtitle,
  icon,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
          {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        <div className="rounded-lg bg-slate-100 p-2 text-slate-700">{icon}</div>
      </div>
    </div>
  );
}

export default function EngagementDashboard() {
  const [data, setData] = useState<OwnerMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/owner/metrics", { cache: "no-store" });
        const json = await res.json();
        if (res.ok && json?.success) {
          setData(json as OwnerMetricsResponse);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-7 w-7 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Unable to load engagement insights right now.
      </div>
    );
  }

  const conversionRate = data.metrics.conversionRate ?? (data.metrics.totalViews > 0
    ? (data.metrics.totalInquiries / data.metrics.totalViews) * 100
    : 0);
  const bookingRate = data.metrics.bookingRate ?? (data.metrics.totalInquiries > 0
    ? (data.metrics.totalBookings / data.metrics.totalInquiries) * 100
    : 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Views"
          value={data.metrics.totalViews.toLocaleString()}
          subtitle={`${data.metrics.viewsThisMonth.toLocaleString()} this month`}
          icon={<Eye className="h-4 w-4" />}
        />
        <MetricCard
          label="Inquiries"
          value={data.metrics.totalInquiries.toLocaleString()}
          subtitle={`${data.metrics.inquiriesThisMonth.toLocaleString()} this month`}
          icon={<MessageSquare className="h-4 w-4" />}
        />
        <MetricCard
          label="Bookings"
          value={data.metrics.totalBookings.toLocaleString()}
          subtitle={`${data.metrics.bookingsThisMonth.toLocaleString()} this month`}
          icon={<CalendarCheck2 className="h-4 w-4" />}
        />
        <MetricCard
          label="Conversion"
          value={`${conversionRate.toFixed(1)}%`}
          subtitle={`Inquiry to booking: ${bookingRate.toFixed(1)}%`}
          icon={<Percent className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
            <TrendingUp className="h-4 w-4" />
            Managed Listings
          </h3>
          {data.properties.length === 0 ? (
            <p className="text-sm text-slate-500">No listings found for this owner account yet.</p>
          ) : (
            <div className="space-y-2">
              {data.properties.slice(0, 8).map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.area ? `${p.area}, ` : ""}{p.city}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
            <Clock3 className="h-4 w-4" />
            Recent Inquiries
          </h3>
          {data.recentInquiries.length === 0 ? (
            <p className="text-sm text-slate-500">No inquiries yet. Share your listing to start receiving leads.</p>
          ) : (
            <div className="space-y-2">
              {data.recentInquiries.slice(0, 6).map((inq) => (
                <div key={inq.id} className="rounded-xl border border-slate-100 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{inq.eventType || "Event"}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{inq.status}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-800">{inq.message}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{new Date(inq.createdAt).toLocaleString("en-IN")}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
