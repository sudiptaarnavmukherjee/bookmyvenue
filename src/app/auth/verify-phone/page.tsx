"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { ShieldCheck, Smartphone, ArrowRight, AlertCircle } from "lucide-react";

function roleHome(role?: string) {
  if (role === "ADMIN") return "/admin";
  if (role === "VENUE_OWNER") return "/venue-owner";
  if (role === "CATERING_OWNER") return "/catering-owner";
  return "/";
}

function sanitizeCallbackUrl(value: string | null): string | null {
  if (!value || !value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}

export default function VerifyPhonePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();

  const callbackUrl = sanitizeCallbackUrl(searchParams.get("callbackUrl"));

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status !== "authenticated") {
      return;
    }

    if (session.user.phoneVerified) {
      router.push(callbackUrl || roleHome(session.user.role));
      return;
    }

    const loadPhone = async () => {
      try {
        const res = await fetch("/api/users/me");
        if (!res.ok) return;
        const json = await res.json();
        if (json?.user?.phone) {
          setPhone(json.user.phone);
        }
      } catch {
        // non-blocking fetch
      }
    };

    loadPhone();
  }, [callbackUrl, router, session, status]);

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      setError("Enter your phone number first.");
      return;
    }

    setError(null);
    setMessage(null);
    setIsSending(true);

    try {
      const res = await fetch("/api/auth/send-phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to send OTP.");
        return;
      }

      setMessage(json.message || "OTP sent successfully.");
    } catch {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter a valid 6-digit OTP.");
      return;
    }

    setError(null);
    setMessage(null);
    setIsVerifying(true);

    try {
      const res = await fetch("/api/auth/verify-phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Verification failed.");
        return;
      }

      await update({
        user: {
          id: session?.user?.id || "",
          role: session?.user?.role || "USER",
          phoneVerified: true,
        },
      });

      router.push(callbackUrl || roleHome(session?.user?.role));
      router.refresh();
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <p className="text-gray-600">Checking your account...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass-card relative w-full max-w-md rounded-3xl p-8 shadow-2xl"
      >
        <div className="mb-6 text-center">
          <div className="mb-3 flex justify-center">
            <ShieldCheck className="h-12 w-12 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gradient">Verify Your Phone</h1>
          <p className="mt-2 text-sm text-gray-600">
            Phone verification is required before you can access your account area.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Phone Number</label>
            <div className="flex items-center gap-3 rounded-xl bg-white/70 p-4 shadow-inner backdrop-blur-sm">
              <Smartphone className="h-5 w-5 text-purple-600" />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full bg-transparent text-gray-800 outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSendOtp}
            disabled={isSending || isVerifying}
            className="w-full rounded-xl border border-purple-200 bg-white py-3 font-semibold text-purple-700 transition hover:bg-purple-50 disabled:opacity-60"
          >
            {isSending ? "Sending OTP..." : "Send OTP"}
          </button>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Enter OTP</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit OTP"
              className="w-full rounded-xl bg-white/70 p-4 text-gray-800 shadow-inner outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleVerifyOtp}
            disabled={isVerifying || isSending}
            className="shimmer flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 py-4 font-bold text-white shadow-xl transition-all hover:shadow-2xl disabled:opacity-60"
          >
            {isVerifying ? "Verifying..." : "Verify & Continue"}
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
