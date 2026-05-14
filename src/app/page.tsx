import { Suspense } from "react";
import Link from "next/link";
import { getFeaturedVenues, getFeaturedCaterers, getHomeStats } from "@/lib/home-data";
import HomeInteractive from "@/components/home/HomeInteractive";
import HomeTabContent from "@/components/home/HomeTabContent";
import NearbySection from "@/components/home/NearbySection";
import BusinessValueSection from "@/components/home/BusinessValueSection";
import TrustSignalsSection from "@/components/home/TrustSignalsSection";
import CallToActionSection from "@/components/home/CallToActionSection";
import Logo from "@/components/layout/Logo";

// ============================================
// ISR Configuration - Revalidate every 5 minutes
// ============================================
export const revalidate = 300;

// ============================================
// Footer
// ============================================
function Footer() {
  return (
    <footer className="mt-8 border-t border-slate-200 bg-white py-6 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <Logo size="sm" className="mx-auto mb-3" />
        <p className="mb-3 text-xs text-slate-500">
          Discover and book venues and caterers across Kolkata.
        </p>
        <div className="flex justify-center gap-4 text-xs text-slate-400">
          <Link href="/venues" className="hover:text-[#0b5fab]" prefetch={true}>Venues</Link>
          <Link href="/catering" className="hover:text-[#0b5fab]" prefetch={true}>Catering</Link>
          <Link href="/bookings" className="hover:text-[#0b5fab]" prefetch={false}>Bookings</Link>
        </div>
        <p className="mt-4 text-[10px] text-slate-300">© 2026 Happily Eated</p>
      </div>
    </footer>
  );
}

// ============================================
// Main Page - Server Component with ISR
// ============================================
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const mode = params.mode || "venues";

  // Pre-fetch both tabs server-side so client switching is instant (no extra API calls)
  let venues: Awaited<ReturnType<typeof getFeaturedVenues>> = [];
  let caterers: Awaited<ReturnType<typeof getFeaturedCaterers>> = [];
  let stats: Awaited<ReturnType<typeof getHomeStats>> = { totalVenues: 0, totalCaterers: 0, completedBookings: 0, verifiedVenues: 0, verifiedCaterers: 0, avgCatererRating: null };
  try {
    [venues, caterers, stats] = await Promise.all([
      getFeaturedVenues(12),
      getFeaturedCaterers(12),
      getHomeStats(),
    ]);
  } catch {
    // DB unavailable - render empty state gracefully
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      {/* Interactive Header - Client Component */}
      <Suspense fallback={<div className="h-[52px] bg-white border-b" />}>
        <HomeInteractive initialMode={mode as "venues" | "catering"} />
      </Suspense>

      {/* Phase 1 foundation: clear value proposition for users and owners */}
      <BusinessValueSection />

      {/* Trust signals: showcase verified partners and completed events */}
      <TrustSignalsSection stats={stats} />

      {/* CTA: dual conversion funnel for users and owners */}
      <CallToActionSection />

      {/* Nearby Section - Client-side, reads GPS from localStorage */}
      <NearbySection />

      {/* Tab Content - Client component, switches instantly via custom event */}
      <HomeTabContent initialMode={mode} venues={venues} caterers={caterers} />

      {/* Footer */}
      <Footer />
    </div>
  );
}
