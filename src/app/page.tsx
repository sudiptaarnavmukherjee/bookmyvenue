import { Suspense } from "react";
import { Star, Navigation, Sparkles, ChefHat } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getFeaturedVenues, getFeaturedCaterers } from "@/lib/home-data";
import HomeInteractive from "@/components/home/HomeInteractive";
import {
  VenueCardServer,
  HorizontalVenueCardServer,
  CatererCardServer,
  HorizontalCatererCardServer,
  SectionHeader,
  VenueCardSkeleton,
  CatererCardSkeleton,
} from "@/components/home/HomeCards";
import Logo from "@/components/layout/Logo";

// Lazy-load NearbySection client component (requires localStorage)
const NearbySection = dynamic(
  () => import("@/components/home/NearbySection"),
  { ssr: false, loading: () => null }
);

// ============================================
// ISR Configuration - Revalidate every 5 minutes
// ============================================
export const revalidate = 300;

// ============================================
// Venues Section - Server Component
// ============================================
async function VenuesSection() {
  const venues = await getFeaturedVenues(12);
  
  const bestVenues = venues.slice(0, 6);
  const featuredVenues = venues.slice(6, 12);

  return (
    <>
      {/* Best in Town */}
      <section className="mb-6">
        <SectionHeader 
          title="Best in Town" 
          icon={Star}
          viewAllHref="/venues?sort=popular"
          accentColor="purple"
        />
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {bestVenues.map(venue => (
            <HorizontalVenueCardServer key={venue.id} venue={venue} />
          ))}
        </div>
      </section>

      {/* Featured Venues Grid */}
      <section className="mb-6">
        <SectionHeader 
          title="Featured Venues" 
          subtitle={`${venues.length} venues`}
          icon={Navigation}
          viewAllHref="/venues"
          accentColor="purple"
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {venues.slice(0, 8).map(venue => (
            <VenueCardServer key={venue.id} venue={venue} />
          ))}
        </div>
      </section>

      {/* More Featured - Horizontal */}
      {featuredVenues.length > 0 && (
        <section className="mb-6">
          <SectionHeader 
            title="More to Explore" 
            icon={Sparkles}
            viewAllHref="/venues"
            accentColor="purple"
          />
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {featuredVenues.map(venue => (
              <HorizontalVenueCardServer key={venue.id} venue={venue} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

// ============================================
// Caterers Section - Server Component
// ============================================
async function CaterersSection() {
  const caterers = await getFeaturedCaterers(12);
  
  const topRated = caterers.filter(c => c.rating && c.rating >= 4).slice(0, 6);

  return (
    <>
      {/* Top Rated - Horizontal */}
      {topRated.length > 0 && (
        <section className="mb-6">
          <SectionHeader 
            title="Top Rated" 
            icon={Star}
            viewAllHref="/catering?sort=rating"
            accentColor="orange"
          />
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {topRated.map(caterer => (
              <HorizontalCatererCardServer key={caterer.id} caterer={caterer} />
            ))}
          </div>
        </section>
      )}

      {/* All Caterers - List */}
      <section>
        <SectionHeader 
          title="All Caterers" 
          subtitle={`${caterers.length} caterers`}
          icon={ChefHat}
          viewAllHref="/catering"
          accentColor="orange"
        />
        <div className="space-y-3">
          {caterers.map(caterer => (
            <CatererCardServer key={caterer.id} caterer={caterer} />
          ))}
        </div>
      </section>
    </>
  );
}

// ============================================
// Loading Skeletons
// ============================================
function VenuesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-64 h-48 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => (
          <VenueCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function CaterersSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <CatererCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ============================================
// Tab Content Wrapper - Uses searchParams
// ============================================
async function TabContent({ mode }: { mode: string }) {
  const isVenues = mode !== "catering";
  
  return (
    <div className="px-4 py-4 max-w-7xl mx-auto">
      {isVenues ? (
        <Suspense fallback={<VenuesSkeleton />}>
          <VenuesSection />
        </Suspense>
      ) : (
        <Suspense fallback={<CaterersSkeleton />}>
          <CaterersSection />
        </Suspense>
      )}
    </div>
  );
}

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
  // Get mode from URL (default: venues)
  const params = await searchParams;
  const mode = params.mode || "venues";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Interactive Header - Client Component */}
      <Suspense fallback={<div className="h-[52px] bg-white border-b" />}>
        <HomeInteractive initialMode={mode as "venues" | "catering"} />
      </Suspense>

      {/* Nearby Section - Client-side, reads GPS from localStorage */}
      <NearbySection />

      {/* Content - Server Rendered with Suspense */}
      <TabContent mode={mode} />

      {/* Footer - Server Component */}
      <Footer />
    </div>
  );
}
