"use client";

import { SessionProvider } from "@/components/providers/SessionProvider";

export function SessionProviderGate({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}