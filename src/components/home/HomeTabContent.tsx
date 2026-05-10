"use client";

import { useState, useEffect } from "react";
import { Star, Navigation, Sparkles, ChefHat } from "lucide-react";
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

  // Listen for tab change events dispatched by HomeInteractive
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ tab: "venues" | "catering" }>).detail;
      setMode(detail.tab);
    };
    window.addEventListener("home:tabChanged", handler);
    return () => window.removeEventListener("home:tabChanged", handler);
  }, []);

  if (mode === "catering") {
    const topRated = caterers.filter((c) => c.rating && c.rating >= 4).slice(0, 6);
    return (
      <div className="px-4 py-4 max-w-7xl mx-auto">
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
            subtitle={`${caterers.length} caterers`}
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

  // Venues mode
  const bestVenues = venues.slice(0, 6);
  const featuredVenues = venues.slice(6, 12);

  return (
    <div className="px-4 py-4 max-w-7xl mx-auto">
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

      <section className="mb-6">
        <SectionHeader
          title="Featured Venues"
          subtitle={`${venues.length} venues`}
          icon={Navigation}
          viewAllHref="/venues"
          accentColor="purple"
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {venues.slice(0, 8).map((v) => (
            <VenueCardServer key={v.id} venue={v} />
          ))}
        </div>
      </section>

      {featuredVenues.length > 0 && (
        <section className="mb-6">
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
