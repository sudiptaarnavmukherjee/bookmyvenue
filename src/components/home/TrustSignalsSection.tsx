import { CheckCircle2, Award, Zap, Star } from "lucide-react";
import { HomeStats } from "@/lib/home-data";

interface TrustSignalsSectionProps {
  stats: HomeStats;
}

export default function TrustSignalsSection({ stats }: TrustSignalsSectionProps) {
  // Format large numbers for display
  const formatNumber = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K+`;
    return `${n}+`;
  };

  return (
    <section className="px-4 py-5 lg:px-6 lg:py-7">
      <div className="mx-auto max-w-7xl">
        {/* Stat Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Verified Venues */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow lg:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  Verified Venues
                </p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900 lg:text-3xl">
                  {formatNumber(stats.verifiedVenues)}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  out of {formatNumber(stats.totalVenues)} total
                </p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-2.5">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Verified Caterers */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow lg:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  Verified Caterers
                </p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900 lg:text-3xl">
                  {formatNumber(stats.verifiedCaterers)}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  out of {formatNumber(stats.totalCaterers)} total
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 p-2.5">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Completed Bookings */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow lg:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  Successful Events
                </p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900 lg:text-3xl">
                  {formatNumber(stats.completedBookings)}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  events booked & completed
                </p>
              </div>
              <div className="rounded-lg bg-orange-50 p-2.5">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Caterer Rating */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow lg:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  Avg. Caterer Rating
                </p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900 lg:text-3xl">
                  {stats.avgCatererRating ? stats.avgCatererRating.toFixed(1) : "N/A"}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  out of 5 stars
                </p>
              </div>
              <div className="rounded-lg bg-yellow-50 p-2.5">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Trust Messaging */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:p-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-600">
              Your Event Matters
            </p>
            <h3 className="mt-2 text-lg font-extrabold text-slate-900 lg:text-xl">
              Every partner on Happily Eated is vetted for quality
            </h3>
            <p className="mt-2 text-sm text-slate-700 lg:text-[15px]">
              We verify venue ownership, caterer credentials, and collect feedback from every completed booking.
              Compare, shortlist, and book with the confidence that comes from real reviews and transparent pricing.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Ownership Verified
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-200">
                <Award className="h-3.5 w-3.5 text-blue-600" />
                Quality Reviewed
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-200">
                <Star className="h-3.5 w-3.5 text-yellow-600" />
                Real Ratings
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
