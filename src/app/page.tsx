import { Suspense } from "react";
import Link from "next/link";
import { getFeaturedVenues, getFeaturedCaterers } from "@/lib/home-data";
import HomeInteractive from "@/components/home/HomeInteractive";
import HomeTabContent from "@/components/home/HomeTabContent";
import NearbySection from "@/components/home/NearbySection";
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
    <footer className="bg-white border-t py-6 px-4 mt-8">
      <div className="max-w-7xl mx-auto text-center">
        <Logo size="sm" className="mx-auto mb-3" />
        <p className="text-gray-500 text-xs mb-3">
          Find the perfect venue and catering for your events
        </p>
        <div className="flex justify-center gap-4 text-xs text-gray-400">
          <Link href="/venues" className="hover:text-gray-600" prefetch={true}>Venues</Link>
          <Link href="/catering" className="hover:text-gray-600" prefetch={true}>Catering</Link>
          <Link href="/bookings" className="hover:text-gray-600" prefetch={false}>Bookings</Link>
        </div>
        <p className="text-gray-300 text-[10px] mt-4">© 2024 BookMyVenue</p>
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
  try {
    [venues, caterers] = await Promise.all([
      getFeaturedVenues(12),
      getFeaturedCaterers(12),
    ]);
  } catch {
    // DB unavailable - render empty state gracefully
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Interactive Header - Client Component */}
      <Suspense fallback={<div className="h-[52px] bg-white border-b" />}>
        <HomeInteractive initialMode={mode as "venues" | "catering"} />
      </Suspense>

      {/* Nearby Section - Client-side, reads GPS from localStorage */}
      <NearbySection />

      {/* Tab Content - Client component, switches instantly via custom event */}
      <HomeTabContent initialMode={mode} venues={venues} caterers={caterers} />

      {/* Footer */}
      <Footer />
    </div>
  );
}
