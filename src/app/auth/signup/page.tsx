"use client";

// User Sign Up Page - Production Ready
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER" as "USER" | "VENUE_OWNER" | "CATERING_OWNER"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Password validation
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Create account
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      // Auto-signin after successful signup
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but failed to sign in. Please sign in manually.");
        setTimeout(() => router.push("/auth/signin"), 2000);
        return;
      }

      // Redirect will be handled by middleware based on role
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create account");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 premium-gradient opacity-5" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card relative w-full max-w-md rounded-3xl p-8 shadow-2xl"
      >
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <Sparkles className="h-12 w-12 text-purple-600 floating" />
          </div>
          <h1 className="text-3xl font-bold text-gradient">Create Account</h1>
          <p className="mt-2 text-gray-600">Join ShubhSpace today</p>
        </div>
        {/* Google Sign Up */}
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="mb-5 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-3.5 font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">or sign up with email</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Full Name</label>
            <div className="flex items-center gap-3 rounded-xl bg-white/60 p-4 shadow-inner backdrop-blur-sm focus-within:bg-white/80">
              <User className="h-5 w-5 text-purple-600" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter your name"
                className="flex-1 bg-transparent text-gray-800 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Email Address</label>
            <div className="flex items-center gap-3 rounded-xl bg-white/60 p-4 shadow-inner backdrop-blur-sm focus-within:bg-white/80">
              <Mail className="h-5 w-5 text-purple-600" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="you@example.com"
                className="flex-1 bg-transparent text-gray-800 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>
            <div className="flex items-center gap-3 rounded-xl bg-white/60 p-4 shadow-inner backdrop-blur-sm focus-within:bg-white/80">
              <Lock className="h-5 w-5 text-purple-600" />
              <input
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                className="flex-1 bg-transparent text-gray-800 outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">I am a</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({...formData, role: "USER"})}
                className={`rounded-xl p-4 font-semibold transition-all ${
                  formData.role === "USER"
                    ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg"
                    : "bg-white/60 text-gray-700 hover:bg-white/80"
                }`}
              >
                🙋 Customer
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, role: "VENUE_OWNER"})}
                className={`rounded-xl p-4 font-semibold transition-all ${
                  formData.role === "VENUE_OWNER"
                    ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg"
                    : "bg-white/60 text-gray-700 hover:bg-white/80"
                }`}
              >
                🏛️ Venue Owner
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, role: "CATERING_OWNER"})}
                className={`rounded-xl p-4 font-semibold transition-all ${
                  formData.role === "CATERING_OWNER"
                    ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg"
                    : "bg-white/60 text-gray-700 hover:bg-white/80"
                }`}
              >
                🍽️ Catering Owner
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="shimmer flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 py-4 font-bold text-white shadow-xl transition-all hover:shadow-2xl disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Sign Up"}
            <ArrowRight className="h-5 w-5" />
          </motion.button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/auth/signin" className="font-semibold text-purple-600 hover:text-purple-700">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
