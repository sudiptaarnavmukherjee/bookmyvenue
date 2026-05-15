"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Sparkles, Apple } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent) && !/windows phone/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Check if already installed (PWA mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check localStorage for dismissal
    const dismissedKey = `pwa-install-dismissed-${Date.now().toString().slice(0, -5)}`;
    const wasDismissed = localStorage.getItem(dismissedKey);
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // iOS does not fire beforeinstallprompt, so show manual install guidance.
    if (/iphone|ipad|ipod/.test(userAgent) && !/windows phone/.test(userAgent)) {
      setTimeout(() => setShowBanner(true), 3000);
    }

    // Listen for beforeinstallprompt (Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log("[PWA] beforeinstallprompt event captured");
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      // Show banner after a delay
      setTimeout(() => setShowBanner(true), 3000);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      console.log("[PWA] App installed successfully");
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowBanner(false);
      localStorage.removeItem(dismissedKey);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      console.log("[PWA] User choice:", outcome);

      if (outcome === "accepted") {
        setIsInstalled(true);
        setIsInstallable(false);
      }

      setDeferredPrompt(null);
      setShowBanner(false);
    } catch (error) {
      console.error("[PWA] Install error:", error);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    // Dismiss for current day
    const dismissKey = `pwa-install-dismissed-${Date.now().toString().slice(0, -5)}`;
    localStorage.setItem(dismissKey, "true");
  };

  // Don't show if already installed or dismissed
  if (isInstalled || dismissed) {
    return null;
  }

  // Android: Show install prompt if available
  if (isAndroid && isInstallable && showBanner) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", damping: 20 }}
          className="fixed bottom-20 left-4 right-4 md:right-6 md:left-auto md:w-96 bg-white rounded-2xl shadow-2xl border border-pink-200/30 p-5 z-50"
        >
          <button
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-start gap-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="p-3 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 rounded-xl text-white shrink-0"
            >
              <Download className="h-6 w-6" />
            </motion.div>

            <div className="flex-1 pr-2">
              <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-pink-500" />
                Install BookMyVenue
              </h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Get instant access from your home screen. Fast, offline-capable, and no app store needed.
              </p>

              <div className="flex gap-2">
                <motion.button
                  onClick={handleInstall}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-shadow"
                >
                  <Download className="h-4 w-4" />
                  Install Now
                </motion.button>
                <button
                  onClick={handleDismiss}
                  className="flex-1 px-4 py-2.5 text-gray-700 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // iOS: Show manual installation instructions
  if (isIOS && !isInstalled && !dismissed && showBanner) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", damping: 20 }}
          className="fixed bottom-20 left-4 right-4 md:right-6 md:left-auto md:w-96 bg-white rounded-2xl shadow-2xl border border-blue-200/30 p-5 z-50"
        >
          <button
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl text-white shrink-0">
              <Apple className="h-6 w-6" />
            </div>

            <div className="flex-1 pr-2">
              <h3 className="font-bold text-gray-900 mb-1">Add to Home Screen</h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Tap the Share button below, then &quot;Add to Home Screen&quot; for quick access.
              </p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
                  <span className="text-lg">1.</span>
                  <span>Tap the Share icon at the bottom</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
                  <span className="text-lg">2.</span>
                  <span>Select &quot;Add to Home Screen&quot;</span>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="w-full mt-4 px-4 py-2.5 text-gray-700 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
}
