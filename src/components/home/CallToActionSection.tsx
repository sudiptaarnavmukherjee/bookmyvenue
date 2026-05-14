import Link from "next/link";
import { Building2, ChefHat, ArrowRight } from "lucide-react";

export default function CallToActionSection() {
  return (
    <section className="px-4 py-6 lg:px-6 lg:py-8">
      <div className="mx-auto max-w-7xl">
        {/* Dual CTA - User vs Owner Flows */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* For Event Planners */}
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-slate-50 p-6 shadow-sm transition-all hover:shadow-lg lg:p-8">
            {/* Decorative background */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute right-0 top-0 h-32 w-32 bg-blue-400 blur-3xl" />
            </div>

            <div className="relative">
              <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-blue-100 p-2.5">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>

              <h3 className="mb-2 text-lg font-extrabold text-slate-900 lg:text-xl">
                Planning an Event?
              </h3>

              <p className="mb-4 text-sm text-slate-700 lg:text-[15px]">
                Compare transparent pricing from verified venues and caterers. Build your perfect event shortlist today.
              </p>

              <ul className="mb-6 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  View pricing by event type (marriage, birthday, etc.)
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  Search by area and guest count
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  Read verified reviews and ratings
                </li>
              </ul>

              <Link
                href="/venues"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-700 group-hover:gap-3"
              >
                Start Searching
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* For Venue/Caterer Owners */}
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-orange-50 to-slate-50 p-6 shadow-sm transition-all hover:shadow-lg lg:p-8">
            {/* Decorative background */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute right-0 top-0 h-32 w-32 bg-orange-400 blur-3xl" />
            </div>

            <div className="relative">
              <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-orange-100 p-2.5">
                <ChefHat className="h-5 w-5 text-orange-600" />
              </div>

              <h3 className="mb-2 text-lg font-extrabold text-slate-900 lg:text-xl">
                Running a Venue or Catering?
              </h3>

              <p className="mb-4 text-sm text-slate-700 lg:text-[15px]">
                Reach high-intent event planners in your area. Fill your non-prime dates with shortlist bookings.
              </p>

              <ul className="mb-6 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-600" />
                  Set transparent, event-type pricing
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-600" />
                  Showcase verified reviews and ratings
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-600" />
                  Earn bookings from planners who researched first
                </li>
              </ul>

              <Link
                href="/auth/signin?redirect=owner"
                className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-orange-700 group-hover:gap-3"
              >
                List Your Venue
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Secondary Trust CTA */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-center md:p-6 lg:mt-8 lg:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            Questions or Support
          </p>
          <p className="mt-2 text-sm text-slate-700 lg:text-[15px]">
            Email us at <span className="font-bold text-slate-900">support@happilyeated.com</span> or call during business hours for assistance.
          </p>
        </div>
      </div>
    </section>
  );
}
