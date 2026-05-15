"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Loader2, CalendarDays, Wallet, Heart, MessageSquare, CheckCircle2, Clock, XCircle, Building, UtensilsCrossed } from "lucide-react";

type UserInquiry = {
  id: string;
  message: string;
  eventType: string;
  eventDate: string | null;
  guestCount: number | null;
  budget: number | null;
  status: string;
  createdAt: string;
  venue: { id: string; name: string; city: string; slug: string | null } | null;
  caterer: { id: string; name: string; city: string; slug: string | null } | null;
};

const INQUIRY_STATUS_META: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-amber-100 text-amber-800" },
  CONTACTED: { label: "Contacted", className: "bg-blue-100 text-blue-800" },
  INTERESTED: { label: "Interested", className: "bg-sky-100 text-sky-800" },
  BOOKED: { label: "Booked", className: "bg-emerald-100 text-emerald-800" },
  REJECTED: { label: "Rejected", className: "bg-rose-100 text-rose-800" },
};

type AnalyticsResponse = {
  stats: {
    totalBookings: number;
    upcomingBookings: number;
    completedBookings: number;
    confirmedBookings: number;
    pendingBookings: number;
    cancelledBookings: number;
    totalSpend: number;
    wishlistCount: number;
    inquiryCount: number;
  };
  monthlyTrend: Array<{ month: string; bookings: number; spend: number }>;
  inquiryByStatus: Record<string, number>;
  eventTypePreference: Array<{ eventType: string; count: number }>;
  recentBookings: Array<{
    id: string;
    bookingNumber: string;
    status: string;
    type: string;
    eventDate: string;
    totalAmount: number | null;
    venue: { name: string; city: string } | null;
    caterer: { name: string; city: string } | null;
  }>;
};

function StatCard({ title, value, subtitle, icon }: { title: string; value: string; subtitle?: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
          {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        <div className="rounded-lg bg-slate-100 p-2 text-slate-700">{icon}</div>
      </div>
    </div>
  );
}

export default function TripsPage() {
  const router = useRouter();
  const { status } = useSession();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [inquiries, setInquiries] = useState<UserInquiry[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status !== "authenticated") return;

    const load = async () => {
      try {
        setLoading(true);
        const [analyticsRes, inquiriesRes] = await Promise.all([
          fetch("/api/users/analytics", { cache: "no-store" }),
          fetch("/api/users/inquiries", { cache: "no-store" }),
        ]);
        if (analyticsRes.ok) {
          setData(await analyticsRes.json());
        } else if (analyticsRes.status === 401) {
          router.push("/auth/signin");
        }
        if (inquiriesRes.ok) {
          const d = await inquiriesRes.json();
          setInquiries(d.inquiries || []);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [status, router]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">My Trips & Insights</h1>
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-600">Unable to load your analytics right now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 pb-24">
      <h1 className="mb-2 text-3xl font-bold text-slate-900">My Trips & Insights</h1>
      <p className="mb-6 text-sm text-slate-500">Track bookings, spend, inquiries, and planning trends.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Upcoming Events" value={String(data.stats.upcomingBookings)} subtitle={`${data.stats.confirmedBookings} confirmed`} icon={<CalendarDays className="h-4 w-4" />} />
        <StatCard title="Total Spend" value={`₹${data.stats.totalSpend.toLocaleString("en-IN")}`} subtitle={`${data.stats.totalBookings} total bookings`} icon={<Wallet className="h-4 w-4" />} />
        <StatCard title="Saved Listings" value={String(data.stats.wishlistCount)} subtitle="wishlist items" icon={<Heart className="h-4 w-4" />} />
        <StatCard title="Inquiries Sent" value={String(data.stats.inquiryCount)} subtitle="venue and caterer leads" icon={<MessageSquare className="h-4 w-4" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">Booking Status</h2>
          <div className="space-y-2 text-sm">
            <p className="flex items-center justify-between"><span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-amber-500" /> Pending</span><strong>{data.stats.pendingBookings}</strong></p>
            <p className="flex items-center justify-between"><span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Confirmed</span><strong>{data.stats.confirmedBookings}</strong></p>
            <p className="flex items-center justify-between"><span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-sky-600" /> Completed</span><strong>{data.stats.completedBookings}</strong></p>
            <p className="flex items-center justify-between"><span className="inline-flex items-center gap-2"><XCircle className="h-4 w-4 text-rose-600" /> Cancelled</span><strong>{data.stats.cancelledBookings}</strong></p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">Event Preference</h2>
          {data.eventTypePreference.length === 0 ? (
            <p className="text-sm text-slate-500">No event preference data yet.</p>
          ) : (
            <div className="space-y-2">
              {data.eventTypePreference.slice(0, 5).map((e) => (
                <div key={e.eventType} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-medium text-slate-700">{e.eventType}</span>
                  <span className="font-bold text-slate-900">{e.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">Recent Bookings</h2>
        {data.recentBookings.length === 0 ? (
          <p className="text-sm text-slate-500">No bookings yet. Start exploring venues and caterers.</p>
        ) : (
          <div className="space-y-2">
            {data.recentBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-900">{b.bookingNumber}</p>
                  <p className="text-slate-500">{b.venue?.name || b.caterer?.name || "Listing"} • {new Date(b.eventDate).toLocaleDateString("en-IN")}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">₹{(b.totalAmount || 0).toLocaleString("en-IN")}</p>
                  <p className="text-xs font-semibold text-slate-500">{b.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Inquiries */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" /> My Inquiries
        </h2>
        {inquiries.length === 0 ? (
          <p className="text-sm text-slate-500">No inquiries sent yet. Explore venues and caterers to get started.</p>
        ) : (
          <div className="space-y-2">
            {inquiries.map((inq) => {
              const listing = inq.venue || inq.caterer;
              const href = inq.venue
                ? `/venues/${inq.venue.slug || inq.venue.id}`
                : `/catering/${inq.caterer?.slug || inq.caterer?.id}`;
              const meta = INQUIRY_STATUS_META[inq.status] ?? INQUIRY_STATUS_META.PENDING;
              return (
                <div key={inq.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      {inq.venue ? (
                        <Building className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      ) : (
                        <UtensilsCrossed className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      )}
                      <Link href={href} className="font-semibold text-slate-900 hover:underline truncate">
                        {listing?.name ?? "Listing"}
                      </Link>
                    </div>
                    <p className="text-xs text-slate-500">
                      {inq.eventType} • {new Date(inq.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <span className={`ml-3 flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.className}`}>
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
