"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

export function usePushNotifications() {
  const { data: session } = useSession();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Check current subscription status on mount
  useEffect(() => {
    if (!isSupported || !session?.user) return;

    async function checkSubscription() {
      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        setIsSubscribed(!!existing);
      } catch {
        // SW not ready
      }
    }
    checkSubscription();
  }, [isSupported, session?.user]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !session?.user) return false;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      console.warn("[push] No VAPID public key");
      return false;
    }

    setIsLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return false;

      const reg = await navigator.serviceWorker.ready;

      // Unsubscribe old subscription first (so we always get a fresh one)
      const existing = await reg.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as ArrayBuffer,
      });

      const json = subscription.toJSON();
      const keys = json.keys as { p256dh: string; auth: string };

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys,
        }),
      });

      if (res.ok) {
        setIsSubscribed(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error("[push] Subscribe error:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, session?.user]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (!existing) {
        setIsSubscribed(false);
        return true;
      }

      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: existing.endpoint }),
      });

      await existing.unsubscribe();
      setIsSubscribed(false);
      return true;
    } catch (err) {
      console.error("[push] Unsubscribe error:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return { isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe };
}

// VAPID helper: base64url → Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
