"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Upload, X, Loader2, CheckCircle } from "lucide-react";
import { StarRatingInput } from "./ReviewComponents";

type ReviewFormProps = {
  bookingId: string;
  venueId?: string;
  catererId?: string;
  venueName?: string;
  catererName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function ReviewForm({
  bookingId,
  venueId,
  catererId,
  venueName,
  catererName,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 5) {
      setError("Maximum 5 images allowed");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload/image", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");

        const data = await res.json();
        setImages((prev) => [...prev, data.url]);
      }
    } catch (err) {
      setError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (comment.trim().length < 10) {
      setError("Please write at least 10 characters");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
          images: images.join(","),
          bookingId,
          venueId,
          catererId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 text-center"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Thank you!</h3>
        <p className="text-gray-600">Your review has been submitted successfully.</p>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
    >
      <h3 className="text-xl font-bold text-gray-900 mb-1">Write a Review</h3>
      <p className="text-gray-500 text-sm mb-6">
        Share your experience at {venueName || catererName}
      </p>

      {/* Rating */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Rating *
        </label>
        <StarRatingInput value={rating} onChange={setRating} />
      </div>

      {/* Comment */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Review *
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell others about your experience... What did you like? What could be better?"
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
        />
        <div className="text-xs text-gray-400 mt-1 text-right">
          {comment.length} / 1000 characters
        </div>
      </div>

      {/* Image Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add Photos (optional)
        </label>
        <div className="flex flex-wrap gap-3">
          {images.map((img, index) => (
            <div key={index} className="relative">
              <img
                src={img}
                alt={`Upload ${index + 1}`}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {images.length < 5 && (
            <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-pink-500 hover:bg-pink-50 transition-colors">
              {uploading ? (
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              ) : (
                <>
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-xs text-gray-400 mt-1">Add</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2">Max 5 images, JPG/PNG up to 5MB each</p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Review"
          )}
        </button>
      </div>
    </motion.form>
  );
}

// Owner response form
export function OwnerResponseForm({
  reviewId,
  onSuccess,
  onCancel,
}: {
  reviewId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [response, setResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (response.trim().length < 10) {
      setError("Response must be at least 10 characters");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/reviews/${reviewId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: response.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit response");
      }

      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-pink-50 rounded-xl p-4 mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Your Response
      </label>
      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Thank the reviewer or address their concerns professionally..."
        rows={3}
        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none text-sm"
      />

      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}

      <div className="flex gap-2 mt-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-pink-600 text-white text-sm font-semibold rounded-lg hover:bg-pink-700 disabled:opacity-50"
        >
          {submitting ? "Sending..." : "Send Response"}
        </button>
      </div>
    </form>
  );
}
