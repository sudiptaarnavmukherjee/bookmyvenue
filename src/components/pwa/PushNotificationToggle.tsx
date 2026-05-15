"use client";

import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Bell, BellOff, Loader2 } from "lucide-react";

export function PushNotificationToggle() {
  const { isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe } =
    usePushNotifications();

  if (!isSupported) return null;

  if (permission === "denied") {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
        <BellOff className="w-5 h-5 text-red-500 shrink-0" />
        <div>
          <p className="text-sm font-medium text-red-700">Notifications blocked</p>
          <p className="text-xs text-red-500 mt-0.5">Enable them in your browser settings.</p>
        </div>
      </div>
    );
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl">
      <div className="flex items-center gap-3">
        {isSubscribed ? (
          <Bell className="w-5 h-5 text-pink-500 shrink-0" />
        ) : (
          <BellOff className="w-5 h-5 text-gray-400 shrink-0" />
        )}
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Push Notifications
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {isSubscribed
              ? "You'll receive booking updates and reminders"
              : "Get notified about bookings, confirmations & more"}
          </p>
        </div>
      </div>

      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
          isSubscribed ? "bg-pink-500" : "bg-gray-300 dark:bg-gray-600"
        }`}
        aria-label={isSubscribed ? "Disable push notifications" : "Enable push notifications"}
      >
        {isLoading ? (
          <Loader2 className="absolute left-1 w-4 h-4 text-white animate-spin" />
        ) : (
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
              isSubscribed ? "translate-x-6" : "translate-x-1"
            }`}
          />
        )}
      </button>
    </div>
  );
}
