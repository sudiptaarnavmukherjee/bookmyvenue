"use client";

import { useState, useEffect, useCallback } from "react";

interface PWAConfig {
  enableInstallPrompt: boolean;
  enableOffline: boolean;
  enableNotifications: boolean;
  cacheStrategy: "aggressive" | "moderate" | "minimal";
  maxCacheSize: number;
}

const DEFAULT_CONFIG: PWAConfig = {
  enableInstallPrompt: true,
  enableOffline: true,
  enableNotifications: true,
  cacheStrategy: "moderate",
  maxCacheSize: 50 * 1024 * 1024, // 50MB
};

export function usePWAConfig(customConfig?: Partial<PWAConfig>) {
  const [config] = useState<PWAConfig>({
    ...DEFAULT_CONFIG,
    ...customConfig,
  });

  return config;
}

export async function clearPWACache() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log("[PWA] Cache cleared successfully");
    return true;
  } catch (error) {
    console.error("[PWA] Cache clear error:", error);
    return false;
  }
}

export async function getCacheSize() {
  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();

      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }

    return totalSize;
  } catch (error) {
    console.error("[PWA] Cache size calculation error:", error);
    return 0;
  }
}

export async function updateServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    console.log("[PWA] Service worker update checked");
    return true;
  } catch (error) {
    console.error("[PWA] Service worker update error:", error);
    return false;
  }
}

export function usePWAUpdateListener(onUpdate?: () => void) {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const handleControllerChange = () => {
      console.log("[PWA] Service worker controller changed");
      if (onUpdate) {
        onUpdate();
      }
      // Optionally show update notification
      showUpdateNotification();
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    // Check for updates periodically (every hour)
    const updateInterval = setInterval(() => {
      updateServiceWorker();
    }, 60 * 60 * 1000);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      clearInterval(updateInterval);
    };
  }, [onUpdate]);
}

function showUpdateNotification() {
  // Only show in non-app contexts
  if (!window.matchMedia("(display-mode: standalone)").matches) {
    console.log("[PWA] Update available - user can refresh");
  }
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("[PWA] Notifications not supported");
    return false;
  }

  try {
    const permission = Notification.permission;

    if (permission === "granted") {
      return true;
    }

    if (permission !== "denied") {
      const result = await Notification.requestPermission();
      return result === "granted";
    }

    return false;
  } catch (error) {
    console.error("[PWA] Notification permission error:", error);
    return false;
  }
}

export async function registerBackgroundSync(tag: string, minInterval?: number) {
  if (!("serviceWorker" in navigator) || !("SyncManager" in window)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await (registration as any).sync.register(tag);
    console.log(`[PWA] Background sync registered: ${tag}`);
    return true;
  } catch (error) {
    console.error("[PWA] Background sync registration error:", error);
    return false;
  }
}

export function usePWAOfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      console.log("[PWA] App is online");
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log("[PWA] App is offline");
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline };
}

export function usePWAInstallState() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if already in standalone mode
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      console.log("[PWA] App running in standalone mode");
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log("[PWA] beforeinstallprompt event captured");
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log("[PWA] appinstalled event captured");
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("[PWA] Installation accepted");
        setIsInstalled(true);
        setIsInstallable(false);
      } else {
        console.log("[PWA] Installation dismissed");
      }

      setDeferredPrompt(null);
      return outcome === "accepted";
    } catch (error) {
      console.error("[PWA] Installation error:", error);
      return false;
    }
  }, [deferredPrompt]);

  return {
    isInstallable,
    isInstalled,
    deferredPrompt,
    install,
  };
}
