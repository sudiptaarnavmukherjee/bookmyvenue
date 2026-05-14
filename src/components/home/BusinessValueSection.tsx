import { CalendarDays, CheckCircle2, HandCoins, Landmark, PhoneCall, Sparkles } from "lucide-react";

export default function BusinessValueSection() {
  return (
    <section className="px-4 pb-5 lg:px-6 lg:pb-7">
      <div className="mx-auto max-w-7xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#0b5fab]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0b5fab]">
              <Sparkles className="h-3.5 w-3.5" /> Why Happily Eated
            </p>
            <h2 className="text-xl font-extrabold text-slate-900 lg:text-2xl">
              Venue and catering research made transparent for Bengal families
            </h2>
            <p className="mt-2 text-sm text-slate-600 lg:text-[15px]">
              Compare expected pricing by event type, shortlist by area and budget, then call or visit with confidence.
              This platform is designed for informed decisions first, and selective booking for verified partners.
            </p>

            <div className="mt-4 grid gap-2 text-sm text-slate-700">
              <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Transparent price signals for venues and caterers</p>
              <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Better options for non-marriage events and dates</p>
              <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Area-first discovery built for West Bengal users</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-800">How it works</h3>
            <div className="mt-3 space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Landmark className="mt-0.5 h-4 w-4 text-[#0b5fab]" />
                <p><span className="font-bold text-slate-900">Search by event and area:</span> find halls and caterers near your preferred locality.</p>
              </div>
              <div className="flex items-start gap-3">
                <HandCoins className="mt-0.5 h-4 w-4 text-[#0b5fab]" />
                <p><span className="font-bold text-slate-900">Compare expected budgets:</span> evaluate pricing before making calls.</p>
              </div>
              <div className="flex items-start gap-3">
                <PhoneCall className="mt-0.5 h-4 w-4 text-[#0b5fab]" />
                <p><span className="font-bold text-slate-900">Connect confidently:</span> request callback or plan a property visit.</p>
              </div>
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 text-[#0b5fab]" />
                <p><span className="font-bold text-slate-900">Fill non-prime dates:</span> owners get more utilization beyond peak marriage slots.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
