"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Star, Filter } from "lucide-react";
import { ReviewStats, ReviewList, ReviewCard } from "./ReviewComponents";
import { ReviewForm } from "./ReviewForm";

type ReviewsSectionProps = {
  venueId?: string;
  catererId?: string;
  venueName?: string;
  catererName?: string;
  userBookingId?: string; // If user has a completed booking, show review form
};

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  images: string | null;
  ownerResponse: string | null;
  ownerRespondedAt: string | null;
  isVerified: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  booking?: {
    eventDate: string;
    eventType: string | null;
  } | null;
};

type ReviewStatsType = {
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
};

export function ReviewsSection({
  venueId,
  catererId,
  venueName,
  catererName,
  userBookingId,
}: ReviewsSectionProps) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const fetchReviews = async (pageNum: number, append = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: "10",
        sortBy,
        ...(venueId ? { venueId } : { catererId: catererId! }),
      });

      const res = await fetch(`/api/reviews?${params}`);
      const data = await res.json();

      if (res.ok) {
        if (append) {
          setReviews((prev) => [...prev, ...data.reviews]);
        } else {
          setReviews(data.reviews);
        }
        setStats(data.stats);
        setHasMore(pageNum < data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchReviews(1);
  }, [venueId, catererId, sortBy]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(nextPage, true);
  };

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    fetchReviews(1);
  };

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Reviews & Ratings
        </h2>
        
        {/* Sort dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
          <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Stats */}
      {stats && stats.totalReviews > 0 && (
        <div className="mb-6">
          <ReviewStats stats={stats} />
        </div>
      )}

      {/* Write review CTA */}
      {session?.user && userBookingId && !showReviewForm && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 mb-6 border border-pink-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Share your experience!
              </h3>
              <p className="text-sm text-gray-600">
                You've completed a booking. Help others by writing a review.
              </p>
            </div>
            <button
              onClick={() => setShowReviewForm(true)}
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-full hover:opacity-90 transition-opacity"
            >
              Write Review
            </button>
          </div>
        </motion.div>
      )}

      {/* Review form */}
      {showReviewForm && userBookingId && (
        <div className="mb-6">
          <ReviewForm
            bookingId={userBookingId}
            venueId={venueId}
            catererId={catererId}
            venueName={venueName}
            catererName={catererName}
            onSuccess={handleReviewSuccess}
            onCancel={() => setShowReviewForm(false)}
          />
        </div>
      )}

      {/* Reviews list */}
      <ReviewList
        reviews={reviews}
        loading={loading}
        onLoadMore={loadMore}
        hasMore={hasMore}
      />
    </section>
  );
}

// Compact review summary for cards
export function ReviewSummary({
  rating,
  totalReviews,
  size = "md",
}: {
  rating: number;
  totalReviews: number;
  size?: "sm" | "md";
}) {
  if (totalReviews === 0) return null;

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
  };

  return (
    <div className={`flex items-center gap-1 ${sizeClasses[size]}`}>
      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      <span className="font-semibold text-gray-900">{rating.toFixed(1)}</span>
      <span className="text-gray-500">
        ({totalReviews} review{totalReviews !== 1 ? "s" : ""})
      </span>
    </div>
  );
}
