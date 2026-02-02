"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Eye, TrendingUp, MapPin, Calendar, Building2, 
  Utensils, ArrowLeft, Loader2, RefreshCw, ChevronDown
} from "lucide-react";

type AnalyticsData = {
  topVenues: Array<{
    id: string;
    name: string;
    area: string;
    viewCount: number;
    weeklyViews: number;
  }>;
  topCaterers: Array<{
    id: string;
    name: string;
    area: string;
    viewCount: number;
    weeklyViews: number;
  }>;
  topAreas: Array<{
    name: string;
    totalViews: number;
    venueCount: number;
    catererCount: number;
  }>;
  recentViews: Array<{
    id: string;
    venueId?: string;
    catererId?: string;
    venueName?: string;
    catererName?: string;
    area?: string;
    date: string;
    viewCount: number;
  }>;
  totalStats: {
    totalVenueViews: number;
    totalCatererViews: number;
    todayViews: number;
    weeklyViews: number;
  };
};

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "all">("week");

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      router.push("/");
      return;
    }
    fetchAnalytics();
  }, [session, status, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/analytics?range=${dateRange}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to load analytics");
      }
      
      setAnalytics(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/admin")}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  View Analytics
                </h1>
                <p className="text-gray-500 text-sm">Track views and engagement</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
              
              <button
                onClick={fetchAnalytics}
                className="p-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">Venue Views</span>
              <Building2 className="w-5 h-5 text-pink-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {analytics?.totalStats.totalVenueViews?.toLocaleString() || 0}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">Caterer Views</span>
              <Utensils className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {analytics?.totalStats.totalCatererViews?.toLocaleString() || 0}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">Today</span>
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {analytics?.totalStats.todayViews?.toLocaleString() || 0}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">This Week</span>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {analytics?.totalStats.weeklyViews?.toLocaleString() || 0}
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Venues */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-pink-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Top Viewed Venues
                </h2>
              </div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {analytics?.topVenues?.length ? (
                analytics.topVenues.map((venue, index) => (
                  <div
                    key={venue.id}
                    className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    onClick={() => router.push(`/venues/${venue.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 flex items-center justify-center bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-full font-semibold">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {venue.name}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {venue.area || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {venue.viewCount?.toLocaleString()}
                      </p>
                      <p className="text-xs text-green-500">
                        +{venue.weeklyViews || 0} this week
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-4 text-gray-500 text-center">No venue data yet</p>
              )}
            </div>
          </motion.div>

          {/* Top Caterers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Top Viewed Caterers
                </h2>
              </div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {analytics?.topCaterers?.length ? (
                analytics.topCaterers.map((caterer, index) => (
                  <div
                    key={caterer.id}
                    className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    onClick={() => router.push(`/catering/${caterer.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 flex items-center justify-center bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full font-semibold">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {caterer.name}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {caterer.area || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {caterer.viewCount?.toLocaleString()}
                      </p>
                      <p className="text-xs text-green-500">
                        +{caterer.weeklyViews || 0} this week
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-4 text-gray-500 text-center">No caterer data yet</p>
              )}
            </div>
          </motion.div>

          {/* Top Areas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 md:col-span-2"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Views by Area
                </h2>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {analytics?.topAreas?.length ? (
                  analytics.topAreas.map((area, index) => (
                    <div
                      key={area.name}
                      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {area.name}
                        </span>
                        <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded">
                          #{index + 1}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {area.totalViews?.toLocaleString() || 0}
                      </p>
                      <p className="text-xs text-gray-500">
                        {area.venueCount} venues • {area.catererCount} caterers
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="col-span-4 text-gray-500 text-center py-4">No area data yet</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
