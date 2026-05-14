"use client";

import { usePathname } from "next/navigation";
import { CompareProvider } from "@/components/providers/CompareProvider";

export function CompareProviderGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const needsCompareProvider =
    pathname?.startsWith("/venues") || pathname?.startsWith("/catering");

  if (!needsCompareProvider) {
    return children;
  }

  return <CompareProvider>{children}</CompareProvider>;
}