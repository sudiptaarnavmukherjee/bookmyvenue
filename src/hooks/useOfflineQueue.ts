"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getPendingRequestCount,
  syncPendingRequests,
  queueOfflineRequest,
  OfflineRequest,
} from "@/lib/offline-db";

export interface UseOfflineQueueReturn {
  isOffline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncTime: number | null;
  queueRequest: (request: Omit<OfflineRequest, "id" | "timestamp" | "retries">) => Promise<void>;
  sync: () => Promise<void>;
}

/**
 * Hook to manage offline request queue
 * Monitors online/offline status and syncs automatically when connection restored
 */
export function useOfflineQueue(): UseOfflineQueueReturn {
  const [isOffline, setIsOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  // Check pending requests count
  const updatePendingCount = useCallback(async () => {
    const count = await getPendingRequestCount();
    setPendingCount(count);
  }, []);

  // Sync pending requests
  const sync = useCallback(async () => {
    if (isSyncing || isOffline) return;

    setIsSyncing(true);
    try {
      const result = await syncPendingRequests();
      console.log(
        `[Sync] Completed: ${result.successful} successful, ${result.failed} failed`
      );
      setLastSyncTime(Date.now());
      await updatePendingCount();
    } catch (error) {
      console.error("[Sync] Error during sync:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isOffline, updatePendingCount]);

  // Queue a request
  const queueRequest = useCallback(
    async (request: Omit<OfflineRequest, "id" | "timestamp" | "retries">) => {
      try {
        await queueOfflineRequest(request);
        await updatePendingCount();
      } catch (error) {
        console.error("[Queue] Error queuing request:", error);
      }
    },
    [updatePendingCount]
  );

  // Monitor online/offline status
  useEffect(() => {
    // Initial status
    setIsOffline(!navigator.onLine);
    updatePendingCount();

    const handleOnline = async () => {
      console.log("[Offline] Network restored");
      setIsOffline(false);
      // Auto-sync after 500ms to allow network to stabilize
      setTimeout(() => {
        sync();
      }, 500);
    };

    const handleOffline = () => {
      console.log("[Offline] Network lost");
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [sync, updatePendingCount]);

  return {
    isOffline,
    pendingCount,
    isSyncing,
    lastSyncTime,
    queueRequest,
    sync,
  };
}
