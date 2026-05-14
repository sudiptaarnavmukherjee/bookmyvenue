"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { usePathname } from "next/navigation";

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

export function LayoutShell() {
  const pathname = usePathname();

  const hideGlobalNav =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/venue-owner") ||
    pathname?.startsWith("/catering-owner") ||
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/auth/");

  const showCompareBar =
    pathname?.startsWith("/venues") || pathname?.startsWith("/catering");

  return (
    <Suspense fallback={null}>
      <OfflineIndicator />
      {!hideGlobalNav && <DesktopNav />}
      {!hideGlobalNav && showCompareBar && <CompareBar />}
      {!hideGlobalNav && <PWAInstallBanner />}
      {!hideGlobalNav && <MobileNav />}
    </Suspense>
  );
}
