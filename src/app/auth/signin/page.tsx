"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      // Redirect will be handled by middleware based on role
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
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
          <h1 className="text-3xl font-bold text-gradient">Welcome Back</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

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
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                className="flex-1 bg-transparent text-gray-800 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span className="text-gray-600">Remember me</span>
            </label>
            <Link href="/auth/forgot-password" className="text-purple-600 hover:text-purple-700">
              Forgot password?
            </Link>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="shimmer flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 py-4 font-bold text-white shadow-xl transition-all hover:shadow-2xl disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"}
            <ArrowRight className="h-5 w-5" />
          </motion.button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link href="/auth/signup" className="font-semibold text-purple-600 hover:text-purple-700">
            Sign Up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
