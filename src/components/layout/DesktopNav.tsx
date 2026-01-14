"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles, Heart, Calendar, User, LogOut, Settings, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";

export default function DesktopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const user = session?.user;
  const loading = status === "loading";

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
    setShowProfileMenu(false);
  };

  return (
    <nav className="hidden lg:block glass-card sticky top-0 z-50 border-b border-white/20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <span className="text-2xl font-bold text-gradient">ShubhSpace</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            {/* Show venue/catering/wishlist only for regular users */}
            {(!user || user.role === "USER") && (
              <>
                <Link
                  href="/venues"
                  className={`font-medium transition-colors ${
                    pathname === "/venues" ? "text-purple-600" : "text-gray-700 hover:text-purple-600"
                  }`}
                >
                  Venues
                </Link>
                <Link
                  href="/catering"
                  className={`font-medium transition-colors ${
                    pathname === "/catering" ? "text-purple-600" : "text-gray-700 hover:text-purple-600"
                  }`}
                >
                  Catering
                </Link>
                <Link
                  href="/wishlist"
                  className={`font-medium transition-colors ${
                    pathname === "/wishlist" ? "text-purple-600" : "text-gray-700 hover:text-purple-600"
                  }`}
                >
                  <Heart className="inline h-5 w-5 mr-1" />
                  Wishlist
                </Link>
              </>
            )}
            
            {/* Show bookings for everyone except admin */}
            {user && user.role !== "ADMIN" && (
              <Link
                href="/bookings"
                className={`font-medium transition-colors ${
                  pathname === "/bookings" ? "text-purple-600" : "text-gray-700 hover:text-purple-600"
                }`}
              >
                <Calendar className="inline h-5 w-5 mr-1" />
                {user.role === "VENUE_OWNER" ? "My Venue Bookings" : 
                 user.role === "CATERING_OWNER" ? "My Catering Bookings" : 
                 "My Bookings"}
              </Link>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="h-10 w-24 animate-pulse rounded-full bg-gray-200" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-white font-medium hover:shadow-lg transition-all"
                >
                  <User className="h-5 w-5" />
                  <span>{user.name || "User"}</span>
                </button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-56 glass-card rounded-2xl shadow-xl overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-200">
                        <p className="font-semibold text-gray-900">{user.name || "User"}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <span className="mt-1 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-600">
                          {user.role}
                        </span>
                      </div>

                      <div className="p-2">
                        <Link
                          href="/profile"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-gray-700 hover:bg-purple-50 transition-colors"
                        >
                          <User className="h-5 w-5" />
                          <span>My Profile</span>
                        </Link>

                        {user.role === "ADMIN" && (
                          <Link
                            href="/dashboard"
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-gray-700 hover:bg-purple-50 transition-colors"
                          >
                            <LayoutDashboard className="h-5 w-5" />
                            <span>Admin Dashboard</span>
                          </Link>
                        )}

                        {user.role === "VENUE_OWNER" && (
                          <Link
                            href="/venue-owner"
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-gray-700 hover:bg-purple-50 transition-colors"
                          >
                            <LayoutDashboard className="h-5 w-5" />
                            <span>Venue Dashboard</span>
                          </Link>
                        )}

                        {user.role === "CATERING_OWNER" && (
                          <Link
                            href="/catering-owner"
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-gray-700 hover:bg-purple-50 transition-colors"
                          >
                            <LayoutDashboard className="h-5 w-5" />
                            <span>Catering Dashboard</span>
                          </Link>
                        )}

                        <Link
                          href="/settings"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-gray-700 hover:bg-purple-50 transition-colors"
                        >
                          <Settings className="h-5 w-5" />
                          <span>Settings</span>
                        </Link>

                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 rounded-lg px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-5 w-5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/signin"
                  className="font-medium text-gray-700 hover:text-purple-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2 font-semibold text-white hover:shadow-lg transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
