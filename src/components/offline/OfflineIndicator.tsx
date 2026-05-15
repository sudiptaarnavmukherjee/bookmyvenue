"use client";

import { useEffect, useState } from "react";
import { WifiOff, Cloud, AlertCircle } from "lucide-react";

interface OfflineIndicatorProps {
  showPendingCount?: boolean;
  pendingCount?: number;
  isSyncing?: boolean;
}

/**
 * Offline indicator component
 * Shows when user is offline and displays pending sync requests
 */
export function OfflineIndicator({
  showPendingCount = true,
  pendingCount = 0,
  isSyncing = false,
}: OfflineIndicatorProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!mounted || !isOffline) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border-2 border-amber-300 rounded-lg shadow-lg">
        <div className="flex-shrink-0 mt-0.5">
          <WifiOff className="h-5 w-5 text-amber-600" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-amber-900">You&apos;re Offline</h3>
            {isSyncing && (
              <Cloud className="h-4 w-4 text-amber-600 animate-bounce" />
            )}
          </div>

          <p className="text-sm text-amber-700 mt-1">
            Your changes will be synced automatically when connection is restored.
          </p>

          {showPendingCount && pendingCount > 0 && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium text-amber-700">
                {pendingCount} change{pendingCount !== 1 ? "s" : ""} waiting to sync
              </span>
            </div>
          )}

          {isSyncing && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-amber-200">
              <div className="h-3 w-3 bg-amber-600 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-amber-700">
                Syncing now...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact offline indicator (minimal)
 */
export function OfflineIndicatorCompact() {
  const [isOffline, setIsOffline] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!mounted || !isOffline) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-100 border border-amber-300 rounded-full shadow-md">
        <WifiOff className="h-4 w-4 text-amber-600 animate-pulse" />
        <span className="text-xs font-semibold text-amber-700">Offline</span>
      </div>
    </div>
  );
}
