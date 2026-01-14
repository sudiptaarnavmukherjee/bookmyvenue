"use client";

import { useState } from "react";
import { X, Calendar, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";

interface BlockDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  venueId?: string;
  catererId?: string;
  isBlocked?: boolean;
  blockedDateId?: string;
  isOnlineBooking?: boolean;
  onSuccess: () => void;
}

export default function BlockDateModal({
  isOpen,
  onClose,
  date,
  venueId,
  catererId,
  isBlocked,
  blockedDateId,
  isOnlineBooking,
  onSuccess,
}: BlockDateModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !date) return null;

  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleBlock = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason for blocking this date");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error: apiError } = await api.blockDate({
        venueId,
        catererId,
        date: date.toISOString().split("T")[0],
        reason: reason.trim(),
      });

      if (apiError) {
        setError(apiError);
      } else {
        onSuccess();
        onClose();
        setReason("");
      }
    } catch (err) {
      setError("Failed to block date. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async () => {
    if (!blockedDateId) return;

    setLoading(true);
    setError("");

    try {
      const { error: apiError } = await api.unblockDate(blockedDateId);

      if (apiError) {
        setError(apiError);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError("Failed to unblock date. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-rose-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {isBlocked ? "Unblock Date" : "Block Date"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Date Display */}
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Selected Date:</p>
            <p className="text-lg font-semibold text-gray-900">{dateStr}</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Unblock Warning for Online Bookings */}
          {isBlocked && isOnlineBooking && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                This date is blocked by an online booking. To unblock it, you
                must cancel the booking first.
              </p>
            </div>
          )}

          {/* Block Form */}
          {!isBlocked && (
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-1 block">
                  Reason for blocking <span className="text-red-500">*</span>
                </span>
                <textarea
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g., Booked offline, Maintenance work, Personal event..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 resize-none"
                  rows={3}
                  disabled={loading}
                />
              </label>
              <p className="text-xs text-gray-500">
                This will prevent new online bookings for this date.
              </p>
            </div>
          )}

          {/* Unblock Info */}
          {isBlocked && !isOnlineBooking && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                This date is currently blocked manually. Unblocking it will
                allow customers to book online again.
              </p>
              <p className="text-sm font-medium text-gray-700">
                Are you sure you want to unblock this date?
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            Cancel
          </button>
          {!isBlocked ? (
            <button
              onClick={handleBlock}
              disabled={loading || !reason.trim()}
              className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Blocking...
                </>
              ) : (
                "Block Date"
              )}
            </button>
          ) : (
            !isOnlineBooking && (
              <button
                onClick={handleUnblock}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Unblocking...
                  </>
                ) : (
                  "Unblock Date"
                )}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
