"use client";

import { useEffect } from "react";

export function PWAInitializer() {
  useEffect(() => {
    initializePWA();
  }, []);

  return null;
}

async function initializePWA() {
  try {
    // 1. Register Service Worker
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        console.log("[PWA] Service Worker registered successfully:", registration.scope);

        // 2. Check for SW updates periodically
        setInterval(async () => {
          try {
            await registration.update();
            console.log("[PWA] Service Worker checked for updates");
          } catch (error) {
            console.error("[PWA] Update check failed:", error);
          }
        }, 60 * 60 * 1000); // Check every hour

        // 3. Handle SW controller change
        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (!refreshing) {
            refreshing = true;
            console.log("[PWA] Service Worker controller changed - update available");
            // Notify user (optional)
          }
        });

        // 4. Handle SW messaging
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data && event.data.type === "SKIP_WAITING") {
            console.log("[PWA] Skip waiting message received");
          }
        });
      } catch (error) {
        console.error("[PWA] Service Worker registration failed:", error);
      }
    }

    // 5. Register Background Sync if available
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register("sync-offline-requests");
        console.log("[PWA] Background sync registered");
      } catch (error) {
        console.error("[PWA] Background sync registration failed:", error);
      }
    }

    // 6. Setup Periodic Background Sync (if available)
    if (
      "serviceWorker" in navigator &&
      "PeriodicSyncManager" in window
    ) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const periodicSync = (registration as any).periodicSync;

        if (periodicSync) {
          // Register hourly background sync
          await periodicSync.register("update-notifications", {
            minInterval: 60 * 60 * 1000, // 1 hour
          });
          console.log("[PWA] Periodic background sync registered");
        }
      } catch (error) {
        console.error("[PWA] Periodic background sync registration failed:", error);
      }
    }

    // 7. Request notification permission if not already requested
    if ("Notification" in window && Notification.permission === "default") {
      // Silently check, don't actively request
      console.log("[PWA] Notification permission:", Notification.permission);
    }

    // 8. Setup online/offline listeners
    const handleOnline = () => {
      console.log("[PWA] App is online");
      // Could trigger background sync here
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          if ((registration as any).sync) {
            (registration as any).sync
              .register("sync-offline-requests")
              .catch(() => {});
          }
        });
      }
    };

    const handleOffline = () => {
      console.log("[PWA] App is offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 9. Log PWA installation status
    if (window.matchMedia("(display-mode: standalone)").matches) {
      console.log("[PWA] App running in standalone/installed mode");
      document.documentElement.setAttribute("data-pwa-installed", "true");
    } else {
      console.log("[PWA] App running in browser mode");
    }

    // 10. Setup visibilitychange to update SW when app comes to foreground
    document.addEventListener("visibilitychange", async () => {
      if (document.hidden === false && "serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.update();
        } catch (error) {
          console.error("[PWA] Update on visibility change failed:", error);
        }
      }
    });

    console.log("[PWA] Initialization complete");
  } catch (error) {
    console.error("[PWA] Initialization error:", error);
  }
}
