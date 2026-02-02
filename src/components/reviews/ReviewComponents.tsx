"use client";

import { useState } from "react";
import { Star, ThumbsUp, Flag, MessageSquare, CheckCircle, Calendar } from "lucide-react";
import { motion } from "framer-motion";

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

type ReviewStats = {
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
};

// Star rating display
export function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizes[size]} ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

// Interactive star rating input
export function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="p-1 transition-transform hover:scale-110"
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              star <= (hover || value)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-300 hover:text-yellow-300"
            }`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-600">
        {value > 0 && (
          <>
            {value === 1 && "Poor"}
            {value === 2 && "Fair"}
            {value === 3 && "Good"}
            {value === 4 && "Very Good"}
            {value === 5 && "Excellent"}
          </>
        )}
      </span>
    </div>
  );
}

// Review stats summary
export function ReviewStats({ stats }: { stats: ReviewStats }) {
  const maxCount = Math.max(...Object.values(stats.distribution), 1);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start gap-6">
        {/* Average rating */}
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900">
            {stats.averageRating.toFixed(1)}
          </div>
          <StarRating rating={Math.round(stats.averageRating)} size="md" />
          <div className="text-sm text-gray-500 mt-1">
            {stats.totalReviews} review{stats.totalReviews !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Rating distribution */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.distribution[rating] || 0;
            const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

            return (
              <div key={rating} className="flex items-center gap-2 text-sm">
                <span className="w-3 text-gray-600">{rating}</span>
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-gray-500 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Single review card
export function ReviewCard({ review, onFlag }: { review: Review; onFlag?: (id: string) => void }) {
  const [showFullComment, setShowFullComment] = useState(false);
  const images = review.images?.split(",").filter(Boolean) || [];
  const isLongComment = review.comment && review.comment.length > 300;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-semibold">
            {review.user.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{review.user.name || "Anonymous"}</span>
              {review.isVerified && (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <StarRating rating={review.rating} size="sm" />
              <span>•</span>
              <span>{new Date(review.createdAt).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}</span>
            </div>
          </div>
        </div>

        {onFlag && (
          <button
            onClick={() => onFlag(review.id)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Report review"
          >
            <Flag className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Event info */}
      {review.booking && (
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>
            Event on {new Date(review.booking.eventDate).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            {review.booking.eventType && ` • ${review.booking.eventType}`}
          </span>
        </div>
      )}

      {/* Comment */}
      {review.comment && (
        <div className="mb-3">
          <p className="text-gray-700 leading-relaxed">
            {showFullComment || !isLongComment
              ? review.comment
              : `${review.comment.slice(0, 300)}...`}
          </p>
          {isLongComment && (
            <button
              onClick={() => setShowFullComment(!showFullComment)}
              className="text-pink-600 text-sm mt-1 hover:underline"
            >
              {showFullComment ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}

      {/* Images */}
      {images.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`Review image ${idx + 1}`}
              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
            />
          ))}
        </div>
      )}

      {/* Owner response */}
      {review.ownerResponse && (
        <div className="mt-4 ml-4 pl-4 border-l-2 border-pink-200 bg-pink-50/50 rounded-r-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-pink-600" />
            <span className="text-sm font-semibold text-pink-600">Owner&apos;s Response</span>
            {review.ownerRespondedAt && (
              <span className="text-xs text-gray-500">
                • {new Date(review.ownerRespondedAt).toLocaleDateString("en-IN")}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700">{review.ownerResponse}</p>
        </div>
      )}
    </motion.div>
  );
}

// Review list with loading and empty states
export function ReviewList({
  reviews,
  loading,
  onLoadMore,
  hasMore,
}: {
  reviews: Review[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}) {
  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl p-5 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="space-y-2">
                <div className="w-32 h-4 bg-gray-200 rounded" />
                <div className="w-24 h-3 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="w-full h-4 bg-gray-200 rounded" />
              <div className="w-3/4 h-4 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-1">No reviews yet</h3>
        <p className="text-gray-500">Be the first to share your experience!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}

      {hasMore && onLoadMore && (
        <div className="text-center pt-4">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-6 py-2 bg-white border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load more reviews"}
          </button>
        </div>
      )}
    </div>
  );
}
