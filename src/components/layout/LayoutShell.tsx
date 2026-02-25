"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

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
 * Client-side layout shell that loads AFTER main content
 * This wrapper allows us to use ssr: false for performance
 */
export function LayoutShell() {
  return (
    <Suspense fallback={null}>
      <OfflineIndicator />
      <DesktopNav />
      <CompareBar />
      <PWAInstallBanner />
      <MobileNav />
    </Suspense>
  );
}
