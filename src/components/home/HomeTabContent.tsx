"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Star,
  Navigation,
  ChefHat,
  Shield,
  Zap,
  Lock,
  BadgeIndianRupee,
  ArrowRight,
  MapPin,
} from "lucide-react";
import {
  VenueCardServer,
  HorizontalVenueCardServer,
  CatererCardServer,
  HorizontalCatererCardServer,
  SectionHeader,
  VenueCardSkeleton,
  CatererCardSkeleton,
} from "@/components/home/HomeCards";
import { getBmvLocation } from "@/components/home/LocationPermissionModal";
import type { VenueCard, CatererCard } from "@/lib/home-data";

const VENUE_TRUST = [
  { icon: Shield, text: "Verified Venues" },
  { icon: BadgeIndianRupee, text: "Transparent Pricing" },
  { icon: Zap, text: "Instant Confirmation" },
  { icon: Lock, text: "Secure Payments" },
];

const CATERING_TRUST = [
  { icon: Shield, text: "Verified Caterers" },
  { icon: BadgeIndianRupee, text: "Price Match" },
  { icon: Zap, text: "Quick Response" },
  { icon: Lock, text: "Secure Payments" },
];

const DISCOVER_EVENTS = [
  { label: "Wedding", href: "/venues?search=wedding" },
  { label: "Birthday", href: "/venues?search=birthday" },
  { label: "Corporate", href: "/venues?search=corporate" },
  { label: "Reception", href: "/venues?search=reception" },
  { label: "Engagement", href: "/venues?search=engagement" },
  { label: "Party", href: "/venues?search=party" },
];

const CUISINE_CHIPS = [
  { label: "Bengali", href: "/catering?search=Bengali" },
  { label: "North Indian", href: "/catering?search=North+Indian" },
  { label: "South Indian", href: "/catering?search=South+Indian" },
  { label: "Continental", href: "/catering?search=Continental" },
  { label: "Chinese", href: "/catering?search=Chinese" },
  { label: "Jain", href: "/catering?search=Jain" },
];

export default function HomeTabContent({
  initialMode,
  venues: initialVenues,
  caterers: initialCaterers,
}: {
  initialMode: string;
  venues: VenueCard[];
  caterers: CatererCard[];
}) {
  const [mode, setMode] = useState<"venues" | "catering">(
    initialMode === "catering" ? "catering" : "venues"
  );
  const [venues, setVenues] = useState<VenueCard[]>(initialVenues);
  const [caterers, setCaterers] = useState<CatererCard[]>(initialCaterers);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);

  // Hydrate with location-aware results after first paint
  useEffect(() => {
    const stored = getBmvLocation();
    if (!stored?.lat || !stored?.lng) return;

    setLocationLabel(stored.label || null);

    // Fetch location-sorted venues in background — swap ISR data silently
    const params = new URLSearchParams({
      lat: String(stored.lat),
      lng: String(stored.lng),
      sortBy: "nearby",
      limit: "12",
    });

    Promise.all([
      fetch(`/api/venues?${params}`).then((r) => r.json()).catch(() => null),
      fetch(`/api/catering?${params}`).then((r) => r.json()).catch(() => null),
    ]).then(([venueData, catererData]) => {
      if (venueData?.venues?.length) setVenues(venueData.venues);
      if (catererData?.caterers?.length) setCaterers(catererData.caterers);
    });
  }, []);

  // Listen for location updates mid-session
  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent<{ lat: number; lng: number; label: string }>).detail;
      if (!d?.lat || !d?.lng) return;
      setLocationLabel(d.label || null);
      const params = new URLSearchParams({
        lat: String(d.lat),
        lng: String(d.lng),
        sortBy: "nearby",
        limit: "12",
      });
      Promise.all([
        fetch(`/api/venues?${params}`).then((r) => r.json()).catch(() => null),
        fetch(`/api/catering?${params}`).then((r) => r.json()).catch(() => null),
      ]).then(([venueData, catererData]) => {
        if (venueData?.venues?.length) setVenues(venueData.venues);
        if (catererData?.caterers?.length) setCaterers(catererData.caterers);
      });
    };
    window.addEventListener("bmv:locationUpdated", handler);
    return () => window.removeEventListener("bmv:locationUpdated", handler);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ tab: "venues" | "catering" }>).detail;
      setMode(detail.tab);
    };
    window.addEventListener("home:tabChanged", handler);
    return () => window.removeEventListener("home:tabChanged", handler);
  }, []);

  if (mode === "catering") {
    const topRated = caterers.filter((c) => c.rating && c.rating >= 4).slice(0, 8);

    return (
      <div className="min-h-screen bg-[#f4f7fb]">
        <div className="border-b border-slate-200 bg-white px-4 py-3">
          <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto scrollbar-hide">
            {CATERING_TRUST.map((item) => (
              <div
                key={item.text}
                className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-[#0b5fab]"
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.text}
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-5">
          <div className="mb-6 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {CUISINE_CHIPS.map((c) => (
              <Link
                key={c.label}
                href={c.href}
                className="flex-shrink-0 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-[#0b5fab]/30 hover:bg-[#0b5fab]/5 hover:text-[#0b5fab]"
              >
                {c.label}
              </Link>
            ))}
          </div>

          {topRated.length > 0 && (
            <section className="mb-7">
              <SectionHeader
                title="Top Rated Caterers"
                icon={Star}
                viewAllHref="/catering?sort=rating"
                accentColor="blue"
              />
              <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
                {topRated.map((c) => (
                  <HorizontalCatererCardServer key={c.id} caterer={c} />
                ))}
              </div>
            </section>
          )}

          <section>
            <SectionHeader
              title="All Caterers"
            subtitle={locationLabel ? `Sorted by distance from ${locationLabel}` : `${caterers.length} caterers available`}
              accentColor="blue"
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
      </div>
    );
  }

  const bestVenues = venues.slice(0, 8);
  const featuredVenues = venues.slice(8, 12);

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto scrollbar-hide">
          {VENUE_TRUST.map((item) => (
            <div
              key={item.text}
              className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-[#0b5fab]"
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.text}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-5">
        <section className="mb-7">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Discover by Event</h2>
              <p className="text-xs text-slate-500">Popular categories for your celebration</p>
            </div>
            <Link href="/venues" className="flex items-center gap-1 text-xs font-bold text-[#0b5fab]">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-2 scrollbar-hide">
            {DISCOVER_EVENTS.map((event) => (
              <Link
                key={event.label}
                href={event.href}
                className="flex h-[78px] w-[108px] flex-shrink-0 items-end rounded-2xl bg-gradient-to-br from-[#0b5fab] to-[#1f86d9] p-3 text-xs font-bold text-white shadow-sm"
              >
                {event.label}
              </Link>
            ))}
          </div>
        </section>

        {bestVenues.length > 0 && (
          <section className="mb-7">
            <SectionHeader
              title={locationLabel ? "Nearest Venues" : "Trending Venues"}
              subtitle={locationLabel ? `Closest to ${locationLabel}` : "Hand-picked for this week"}
              icon={Star}
              viewAllHref="/venues?sort=popular"
              accentColor="blue"
            />
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
              {bestVenues.map((v) => (
                <HorizontalVenueCardServer key={v.id} venue={v} />
              ))}
            </div>
          </section>
        )}

        <section className="mb-7">
          <SectionHeader
            title="All Venues"
            subtitle={locationLabel ? `Sorted by distance from ${locationLabel}` : `${venues.length}+ venues in Kolkata`}
            icon={Navigation}
            viewAllHref="/venues"
            accentColor="blue"
          />

          {venues.length === 0 ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <VenueCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {venues.slice(0, 8).map((v) => (
                <VenueCardServer key={v.id} venue={v} />
              ))}
            </div>
          )}

          {venues.length > 8 && (
            <Link
              href="/venues"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#0b5fab] py-3 text-sm font-bold text-[#0b5fab] transition-colors hover:bg-[#0b5fab]/5"
            >
              View All {venues.length} Venues <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </section>

        {featuredVenues.length > 0 && (
          <section className="mb-5">
            <SectionHeader
              title="More to Explore"
              icon={MapPin}
              viewAllHref="/venues"
              accentColor="blue"
            />
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
              {featuredVenues.map((v) => (
                <HorizontalVenueCardServer key={v.id} venue={v} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

