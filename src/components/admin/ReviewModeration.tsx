"use client";

import { useState, useEffect } from "react";
import {
  Star,
  Flag,
  CheckCircle,
  XCircle,
  Trash2,
  AlertTriangle,
  MessageSquare,
  Loader2,
  Eye,
  Building,
  User,
  Calendar,
} from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  isFlagged: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  caterer: {
    id: string;
    businessName: string;
    owner: {
      name: string | null;
      email: string;
    };
  };
  booking: {
    id: string;
    eventDate: string;
    totalAmount: number;
  } | null;
}

interface ReviewsData {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    total: number;
    flagged: number;
    pending: number;
    approved: number;
  };
}

export default function ReviewModeration() {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [filter, page]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("filter", filter);
      params.set("page", page.toString());

      const response = await fetch(`/api/admin/reviews?${params}`);
      const result = await response.json();

      if (response.ok) {
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (reviewId: string, action: string, reason?: string) => {
    try {
      setActionLoading(reviewId);
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });

      if (response.ok) {
        fetchReviews();
        setSelectedReview(null);
      } else {
        const error = await response.json();
        alert(error.error || "Action failed");
      }
    } catch (error) {
      console.error("Error moderating review:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Reviews"
            value={data.stats.total}
            color="gray"
            onClick={() => setFilter("all")}
            active={filter === "all"}
          />
          <StatCard
            label="Flagged"
            value={data.stats.flagged}
            color="red"
            icon={<Flag className="h-4 w-4" />}
            onClick={() => setFilter("flagged")}
            active={filter === "flagged"}
          />
          <StatCard
            label="Pending"
            value={data.stats.pending}
            color="yellow"
            onClick={() => setFilter("pending")}
            active={filter === "pending"}
          />
          <StatCard
            label="Approved"
            value={data.stats.approved}
            color="green"
            icon={<CheckCircle className="h-4 w-4" />}
            onClick={() => setFilter("approved")}
            active={filter === "approved"}
          />
        </div>
      )}

      {/* Reviews List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading && !data ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <>
            <div className="divide-y">
              {data?.reviews.map((review) => (
                <div
                  key={review.id}
                  className={`p-6 ${
                    review.isFlagged ? "bg-red-50" : review.isApproved ? "" : "bg-yellow-50"
                  }`}
                >
                  <div className="flex gap-4">
                    {/* User Avatar */}
                    <div className="flex-shrink-0">
                      {review.user.image ? (
                        <img
                          src={review.user.image}
                          alt={review.user.name || "User"}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {(review.user.name || review.user.email)[0].toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Review Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">
                              {review.user.name || review.user.email.split("@")[0]}
                            </p>
                            {review.isFlagged && (
                              <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                                <Flag className="h-3 w-3" />
                                Flagged
                              </span>
                            )}
                            {!review.isApproved && !review.isFlagged && (
                              <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                                Pending
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex">{renderStars(review.rating)}</div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {!review.isApproved && (
                            <button
                              onClick={() => handleAction(review.id, "approve")}
                              disabled={actionLoading === review.id}
                              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50"
                              title="Approve"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          {!review.isFlagged && (
                            <button
                              onClick={() => {
                                const reason = prompt("Enter flag reason:");
                                if (reason) handleAction(review.id, "flag", reason);
                              }}
                              disabled={actionLoading === review.id}
                              className="p-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 disabled:opacity-50"
                              title="Flag"
                            >
                              <Flag className="h-4 w-4" />
                            </button>
                          )}
                          {review.isFlagged && (
                            <button
                              onClick={() => handleAction(review.id, "unflag")}
                              disabled={actionLoading === review.id}
                              className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                              title="Unflag"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleAction(review.id, "reject")}
                            disabled={actionLoading === review.id}
                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this review?")) {
                                handleAction(review.id, "delete");
                              }
                            }}
                            disabled={actionLoading === review.id}
                            className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Review Comment */}
                      <p className="text-gray-700 mt-3">{review.comment}</p>

                      {/* Caterer Info */}
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{review.caterer.businessName}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500">
                            Owner: {review.caterer.owner.name || review.caterer.owner.email}
                          </span>
                        </div>
                        {review.booking && (
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Event:{" "}
                              {new Date(review.booking.eventDate).toLocaleDateString("en-IN")}
                            </span>
                            <span>
                              Amount: ₹{review.booking.totalAmount.toLocaleString("en-IN")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <p className="text-sm text-gray-600">
                  Page {data.pagination.page} of {data.pagination.totalPages} (
                  {data.pagination.total} reviews)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 bg-gray-100 rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(data.pagination.totalPages, p + 1))
                    }
                    disabled={page === data.pagination.totalPages}
                    className="px-3 py-1 bg-gray-100 rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {data?.reviews.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No reviews found</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  color,
  icon,
  onClick,
  active,
}: {
  label: string;
  value: number;
  color: "gray" | "red" | "yellow" | "green";
  icon?: React.ReactNode;
  onClick: () => void;
  active: boolean;
}) {
  const colors = {
    gray: "bg-gray-50 border-gray-200",
    red: "bg-red-50 border-red-200",
    yellow: "bg-yellow-50 border-yellow-200",
    green: "bg-green-50 border-green-200",
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border-2 transition-all text-left ${
        active ? `${colors[color]} ring-2 ring-purple-500` : "bg-white border-gray-100 hover:border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </button>
  );
}
