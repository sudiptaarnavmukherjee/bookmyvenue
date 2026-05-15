"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Clock,
  Phone,
  Mail,
  Users,
  IndianRupee,
  CalendarDays,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronDown,
  Building,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Inquiry = {
  id: string;
  message: string;
  eventType: string;
  eventDate: string | null;
  guestCount: number | null;
  budget: number | null;
  status: string;
  phoneNumber: string | null;
  email: string | null;
  createdAt: string;
  venue: { id: string; name: string } | null;
  caterer: { id: string; name: string } | null;
  user: { id: string; name: string | null; email: string | null } | null;
};

const STATUS_OPTIONS = ["PENDING", "CONTACTED", "INTERESTED", "BOOKED", "REJECTED"] as const;

const STATUS_META: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-amber-100 text-amber-800" },
  CONTACTED: { label: "Contacted", className: "bg-blue-100 text-blue-800" },
  INTERESTED: { label: "Interested", className: "bg-sky-100 text-sky-800" },
  BOOKED: { label: "Booked", className: "bg-emerald-100 text-emerald-800" },
  REJECTED: { label: "Rejected", className: "bg-rose-100 text-rose-800" },
};

export default function InquiryInbox() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchInquiries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/owner/inquiries", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setInquiries(data.inquiries || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setInquiries((prev) =>
          prev.map((inq) => (inq.id === id ? { ...inq, status } : inq))
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered =
    filterStatus === "ALL"
      ? inquiries
      : inquiries.filter((i) => i.status === filterStatus);

  const pendingCount = inquiries.filter((i) => i.status === "PENDING").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="h-6 w-6 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header + filter row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-600" />
            Inquiry Inbox
            {pendingCount > 0 && (
              <span className="ml-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white leading-none">
                {pendingCount} new
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {inquiries.length} total inquiries across all your listings
          </p>
        </div>
        <button
          onClick={fetchInquiries}
          className="self-start sm:self-auto flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL", ...STATUS_OPTIONS] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-bold transition-all",
              filterStatus === s
                ? "bg-purple-600 text-white shadow"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {s === "ALL" ? `All (${inquiries.length})` : `${STATUS_META[s].label} (${inquiries.filter((i) => i.status === s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-14 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-500">No inquiries yet</p>
          <p className="text-xs text-slate-400 mt-1">When visitors send inquiries on your listings, they&apos;ll appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inq) => {
            const listing = inq.venue || inq.caterer;
            const listingType = inq.venue ? "VENUE" : "CATERER";
            const isExpanded = expandedId === inq.id;
            const meta = STATUS_META[inq.status] ?? STATUS_META.PENDING;

            return (
              <div
                key={inq.id}
                className={cn(
                  "rounded-2xl border bg-white transition-shadow",
                  inq.status === "PENDING"
                    ? "border-amber-200 shadow-sm"
                    : "border-slate-200"
                )}
              >
                {/* Summary row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", meta.className)}>
                        {meta.label}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {listingType === "VENUE" ? (
                          <Building className="h-2.5 w-2.5" />
                        ) : (
                          <UtensilsCrossed className="h-2.5 w-2.5" />
                        )}
                        {listing?.name ?? "Unknown listing"}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                        {inq.eventType}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {inq.user?.name ?? inq.email ?? inq.phoneNumber ?? "Anonymous"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(inq.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Quick contact links */}
                    {inq.phoneNumber && (
                      <a
                        href={`tel:${inq.phoneNumber}`}
                        className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5" /> Call
                      </a>
                    )}
                    {inq.email && (
                      <a
                        href={`mailto:${inq.email}`}
                        className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        <Mail className="h-3.5 w-3.5" /> Email
                      </a>
                    )}

                    {/* Status updater */}
                    <div className="relative">
                      <select
                        value={inq.status}
                        disabled={updatingId === inq.id}
                        onChange={(e) => updateStatus(inq.id, e.target.value)}
                        className="appearance-none rounded-lg border border-slate-200 bg-slate-50 pl-3 pr-7 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-purple-500 cursor-pointer disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_META[s].label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                    </div>

                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : inq.id)}
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"
                      title={isExpanded ? "Collapse" : "View details"}
                    >
                      {isExpanded ? "▲" : "▼"}
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 rounded-b-2xl px-4 py-3 space-y-2">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Inquiry Details</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {inq.guestCount && (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          <span>{inq.guestCount} guests</span>
                        </div>
                      )}
                      {inq.budget && (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
                          <span>₹{inq.budget.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      {inq.eventDate && (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                          <span>{new Date(inq.eventDate).toLocaleDateString("en-IN")}</span>
                        </div>
                      )}
                      {inq.phoneNumber && (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span>{inq.phoneNumber}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm text-slate-800">
                      &ldquo;{inq.message}&rdquo;
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
