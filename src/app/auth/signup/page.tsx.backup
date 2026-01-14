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
    role: "USER" as "USER" | "VENUE_OWNER" | "CATERING_OWNER" | "ADMIN"
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

          <div>minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                className="flex-1 bg-transparent text-gray-800 outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</pype="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                className="flex-1 bg-transparent text-gray-800 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">I am a</label>
            <div className="grid grid-cols-3 gap-3">
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
