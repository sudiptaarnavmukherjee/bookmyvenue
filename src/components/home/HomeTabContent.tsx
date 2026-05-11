"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Star, Navigation, Sparkles, ChefHat, Shield, Zap, Lock, BadgeIndianRupee } from "lucide-react";
import {
  VenueCardServer,
  HorizontalVenueCardServer,
  CatererCardServer,
  HorizontalCatererCardServer,
  SectionHeader,
  VenueCardSkeleton,
  CatererCardSkeleton,
} from "@/components/home/HomeCards";
import type { VenueCard, CatererCard } from "@/lib/home-data";

// ── Trust strip data ──────────────────────────────────────────
const VENUE_TRUST = [
  { icon: Shield, text: "Verified Venues", color: "text-purple-700 bg-purple-50 border-purple-100" },
  { icon: BadgeIndianRupee, text: "Transparent Pricing", color: "text-purple-700 bg-purple-50 border-purple-100" },
  { icon: Zap, text: "Instant Booking", color: "text-purple-700 bg-purple-50 border-purple-100" },
  { icon: Lock, text: "Secure Payments", color: "text-purple-700 bg-purple-50 border-purple-100" },
];

const CATERING_TRUST = [
  { icon: Shield, text: "Verified Caterers", color: "text-orange-700 bg-orange-50 border-orange-100" },
  { icon: BadgeIndianRupee, text: "Best Price", color: "text-orange-700 bg-orange-50 border-orange-100" },
  { icon: Zap, text: "Quick Booking", color: "text-orange-700 bg-orange-50 border-orange-100" },
  { icon: Lock, text: "Secure Payments", color: "text-orange-700 bg-orange-50 border-orange-100" },
];

// ── Category/Cuisine chip data ────────────────────────────────
const VENUE_CATEGORIES = [
  { label: "💍 Marriage Hall", href: "/venues?search=marriage" },
  { label: "🎂 Birthday Party", href: "/venues?search=birthday" },
  { label: "🏢 Corporate Event", href: "/venues?search=corporate" },
  { label: "🙏 Ceremony", href: "/venues?search=ceremony" },
  { label: "🎉 Reception", href: "/venues?search=reception" },
  { label: "🌿 Open Lawn", href: "/venues?search=lawn" },
];

const CUISINE_CHIPS = [
  { label: "🍚 Bengali", href: "/catering?search=Bengali" },
  { label: "🍛 North Indian", href: "/catering?search=North+Indian" },
  { label: "🥘 South Indian", href: "/catering?search=South+Indian" },
  { label: "🍕 Continental", href: "/catering?search=Continental" },
  { label: "🍜 Chinese", href: "/catering?search=Chinese" },
  { label: "🍱 Jain", href: "/catering?search=Jain" },
];

export default function HomeTabContent({
  initialMode,
  venues,
  caterers,
}: {
  initialMode: string;
  venues: VenueCard[];
  caterers: CatererCard[];
}) {
  const [mode, setMode] = useState<"venues" | "catering">(
    initialMode === "catering" ? "catering" : "venues"
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ tab: "venues" | "catering" }>).detail;
      setMode(detail.tab);
    };
    window.addEventListener("home:tabChanged", handler);
    return () => window.removeEventListener("home:tabChanged", handler);
  }, []);

  // ── Catering tab ─────────────────────────────────────────────
  if (mode === "catering") {
    const topRated = caterers.filter((c) => c.rating && c.rating >= 4).slice(0, 8);

    return (
      <div className="px-4 py-4 max-w-7xl mx-auto">
        {/* Trust strip */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide mb-4">
          {CATERING_TRUST.map((t) => (
            <div
              key={t.text}
              className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${t.color}`}
            >
              <t.icon className="w-3 h-3" />
              {t.text}
            </div>
          ))}
        </div>

        {/* Cuisine chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide mb-5">
          {CUISINE_CHIPS.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 hover:border-orange-300 hover:text-orange-700 hover:bg-orange-50 transition-colors shadow-sm"
            >
              {c.label}
            </Link>
          ))}
        </div>

        {topRated.length > 0 && (
          <section className="mb-6">
            <SectionHeader
              title="Top Rated"
              icon={Star}
              viewAllHref="/catering?sort=rating"
              accentColor="orange"
            />
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {topRated.map((c) => (
                <HorizontalCatererCardServer key={c.id} caterer={c} />
              ))}
            </div>
          </section>
        )}

        <section>
          <SectionHeader
            title="All Caterers"
            subtitle={`${caterers.length} caterers in Kolkata`}
            icon={ChefHat}
            viewAllHref="/catering"
            accentColor="orange"
          />
          {caterers.length === 0 ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <CatererCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {caterers.map((c) => (
                <CatererCardServer key={c.id} caterer={c} />
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  // ── Venues tab ───────────────────────────────────────────────
  const bestVenues = venues.slice(0, 8);
  const featuredVenues = venues.slice(8, 12);

  return (
    <div className="px-4 py-4 max-w-7xl mx-auto">
      {/* Trust strip */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide mb-4">
        {VENUE_TRUST.map((t) => (
          <div
            key={t.text}
            className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${t.color}`}
          >
            <t.icon className="w-3 h-3" />
            {t.text}
          </div>
        ))}
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide mb-5">
        {VENUE_CATEGORIES.map((cat) => (
          <Link
            key={cat.label}
            href={cat.href}
            className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 hover:border-purple-300 hover:text-purple-700 hover:bg-purple-50 transition-colors shadow-sm whitespace-nowrap"
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {/* Best in Town — horizontal scroll */}
      <section className="mb-6">
        <SectionHeader
          title="Best in Town"
          icon={Star}
          viewAllHref="/venues?sort=popular"
          accentColor="purple"
        />
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {bestVenues.map((v) => (
            <HorizontalVenueCardServer key={v.id} venue={v} />
          ))}
        </div>
      </section>

      {/* Featured grid */}
      <section className="mb-6">
        <SectionHeader
          title="Featured Venues"
          subtitle={`${venues.length}+ venues in Kolkata`}
          icon={Navigation}
          viewAllHref="/venues"
          accentColor="purple"
        />
        {venues.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <VenueCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {venues.slice(0, 8).map((v) => (
              <VenueCardServer key={v.id} venue={v} />
            ))}
          </div>
        )}
      </section>

      {/* More to Explore — horizontal scroll */}
      {featuredVenues.length > 0 && (
        <section className="mb-4">
          <SectionHeader
            title="More to Explore"
            icon={Sparkles}
            viewAllHref="/venues"
            accentColor="purple"
          />
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {featuredVenues.map((v) => (
              <HorizontalVenueCardServer key={v.id} venue={v} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
