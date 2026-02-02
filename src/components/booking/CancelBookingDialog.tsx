"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Info,
  Loader2,
} from "lucide-react";

interface CancellationPolicy {
  daysBeforeEvent: number;
  refundPercentage: number;
  refundAmount: number;
  paidAmount: number;
  message: string;
}

interface CancelBookingDialogProps {
  bookingId: string;
  bookingNumber: string;
  venueName: string;
  eventDate: string;
  totalAmount: number;
  paidAmount: number;
  onCancelled?: () => void;
}

export function CancelBookingDialog({
  bookingId,
  bookingNumber,
  venueName,
  eventDate,
  totalAmount,
  paidAmount,
  onCancelled,
}: CancelBookingDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"policy" | "confirm">("policy");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [policy, setPolicy] = useState<CancellationPolicy | null>(null);

  const fetchCancellationPolicy = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to fetch cancellation details");
        return;
      }

      if (!data.canCancel) {
        setError(data.message || "This booking cannot be cancelled");
        return;
      }

      setPolicy(data.cancellationPolicy);
      setStep("policy");
    } catch {
      setError("Failed to fetch cancellation policy");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason for cancellation");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to cancel booking");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        onCancelled?.();
      }, 2000);
    } catch {
      setError("Failed to cancel booking");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchCancellationPolicy();
    } else {
      // Reset state
      setStep("policy");
      setReason("");
      setError("");
      setSuccess(false);
      setPolicy(null);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
          <XCircle className="h-4 w-4 mr-2" />
          Cancel Booking
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {success ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                Booking Cancelled
              </DialogTitle>
              <DialogDescription>
                Your booking has been cancelled successfully. You will receive a confirmation shortly.
              </DialogDescription>
            </DialogHeader>
            {policy && policy.refundAmount > 0 && (
              <Alert className="bg-green-50 border-green-200">
                <Info className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  Refund of {formatCurrency(policy.refundAmount)} will be processed within 5-7 business days.
                </AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Cancel Booking
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this booking?
              </DialogDescription>
            </DialogHeader>

            {loading && !policy ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : error && !policy ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : policy && (
              <div className="space-y-4">
                {/* Booking Summary */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium text-sm">Booking Details</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="text-gray-500">Booking #:</span>{" "}
                      <span className="font-medium">{bookingNumber}</span>
                    </p>
                    <p>
                      <span className="text-gray-500">Venue:</span> {venueName}
                    </p>
                    <p>
                      <span className="text-gray-500">Event Date:</span>{" "}
                      {new Date(eventDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Cancellation Policy */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Refund Policy</h4>
                    <Badge
                      variant={policy.refundPercentage === 100 ? "default" : 
                              policy.refundPercentage >= 50 ? "secondary" : "destructive"}
                    >
                      {policy.refundPercentage}% Refund
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600">{policy.message}</p>
                  
                  <div className="bg-gray-50 rounded p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Amount Paid</span>
                      <span className="font-medium">{formatCurrency(policy.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Refund Amount</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(policy.refundAmount)}
                      </span>
                    </div>
                    {policy.paidAmount - policy.refundAmount > 0 && (
                      <div className="flex justify-between text-sm border-t pt-2">
                        <span className="text-gray-500">Cancellation Fee</span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(policy.paidAmount - policy.refundAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cancellation Reason */}
                {step === "policy" ? (
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700">
                      This action cannot be undone. Please review the refund policy before proceeding.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Reason for Cancellation <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Please tell us why you're cancelling..."
                      rows={3}
                    />
                    {error && (
                      <p className="text-sm text-red-500">{error}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              {step === "policy" ? (
                <>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Keep Booking
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setStep("confirm")}
                    disabled={!policy}
                  >
                    Proceed to Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setStep("policy")}>
                    Back
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Confirm Cancellation
                  </Button>
                </>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Policy Overview Component for displaying on booking pages
export function CancellationPolicyInfo() {
  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      <h4 className="font-medium text-sm flex items-center gap-2">
        <Info className="h-4 w-4 text-blue-500" />
        Cancellation Policy
      </h4>
      <div className="text-sm text-gray-600 space-y-2">
        <div className="flex justify-between">
          <span>30+ days before event</span>
          <Badge variant="default">100% Refund</Badge>
        </div>
        <div className="flex justify-between">
          <span>15-29 days before event</span>
          <Badge variant="secondary">75% Refund</Badge>
        </div>
        <div className="flex justify-between">
          <span>7-14 days before event</span>
          <Badge variant="secondary">50% Refund</Badge>
        </div>
        <div className="flex justify-between">
          <span>3-6 days before event</span>
          <Badge variant="secondary">25% Refund</Badge>
        </div>
        <div className="flex justify-between">
          <span>Less than 3 days</span>
          <Badge variant="destructive">No Refund</Badge>
        </div>
      </div>
      <p className="text-xs text-gray-500 pt-2 border-t">
        * Owner-initiated cancellations qualify for full refund regardless of timing.
      </p>
    </div>
  );
}
