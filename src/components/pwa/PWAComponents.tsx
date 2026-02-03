"use client";

import { useState, useEffect } from "react";
import { usePWA } from "@/hooks/usePWA";
import { Download, X, Smartphone, WifiOff } from "lucide-react";

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, isOnline, install } = usePWA();
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the banner before
    const hasDismissed = localStorage.getItem("pwa-banner-dismissed");
    if (hasDismissed) {
      setDismissed(true);
    }

    // Show banner after a delay if installable
    if (isInstallable && !dismissed && !isInstalled) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 5000); // Show after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [isInstallable, dismissed, isInstalled]);

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem("pwa-banner-dismissed", "true");
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-50 animate-in slide-in-from-bottom duration-500">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex items-start gap-4">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl text-white">
          <Smartphone className="h-6 w-6" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-1">Install BookMyVenue</h3>
          <p className="text-sm text-gray-600 mb-3">
            Add to your home screen for quick access and offline support
          </p>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstall}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Download className="h-4 w-4" />
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-800"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OfflineIndicator() {
  const { isOnline } = usePWA();
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowIndicator(true);
    } else {
      // Hide with delay for smooth transition
      const timer = setTimeout(() => setShowIndicator(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showIndicator) return null;

  return (
    <div
      className={`fixed top-16 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-all ${
        isOnline
          ? "bg-green-500 text-white"
          : "bg-yellow-500 text-yellow-900"
      }`}
    >
      {isOnline ? (
        <>Back online!</>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          You're offline. Some features may be limited.
        </>
      )}
    </div>
  );
}
