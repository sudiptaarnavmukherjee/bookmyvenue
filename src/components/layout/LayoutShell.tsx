"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Heart } from "lucide-react";
import Footer from "@/components/layout/Footer";

// Dynamic imports with ssr: false - only allowed in client components
const MobileNav = dynamic(
  () => import("@/components/layout/MobileNav").then(m => ({ default: m.MobileNav })),
  { ssr: false }
);

const DesktopNav = dynamic(
  () => import("@/components/layout/DesktopNav"),
  { ssr: false }
);

const CompareBar = dynamic(
  () => import("@/components/ui/CompareBar").then(m => ({ default: m.CompareBar })),
  { ssr: false }
);

const PWAInstallBanner = dynamic(
  () => import("@/components/pwa/PWAComponents").then(m => ({ default: m.PWAInstallBanner })),
  { ssr: false }
);

const OfflineIndicator = dynamic(
  () => import("@/components/pwa/PWAComponents").then(m => ({ default: m.OfflineIndicator })),
  { ssr: false }
);

/**
 * Fixed mobile-only top bar shown on every page except the homepage.
 * Homepage renders its own header inside HomeInteractive.
 */
function GlobalMobileHeader() {
  const pathname = usePathname();
  // Homepage has its own fixed header inside HomeInteractive
  if (pathname === "/") return null;

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <span className="text-base font-bold text-gray-900">ShubhSpace</span>
        </Link>
        <Link href="/wishlist" className="p-2 hover:bg-gray-100 rounded-full">
          <Heart className="w-5 h-5 text-gray-600" />
        </Link>
      </div>
    </header>
  );
}

/**
 * Client-side layout shell that loads AFTER main content
 * This wrapper allows us to use ssr: false for performance
 */
export function LayoutShell() {
  return (
    <Suspense fallback={null}>
      <OfflineIndicator />
      <GlobalMobileHeader />
      <DesktopNav />
      <CompareBar />
      <PWAInstallBanner />
      <MobileNav />
    </Suspense>
  );
}

/**
 * Server-safe footer wrapper
 */
export function FooterShell() {
  return <Footer />;
}
