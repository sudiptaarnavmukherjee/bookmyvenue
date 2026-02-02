"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CreditCard,
  Smartphone,
  Building,
  Wallet,
  IndianRupee,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Lock,
  Receipt,
} from "lucide-react";

// Types
interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: PaymentResult) => void;
  bookingId: string;
  bookingNumber: string;
  venueName: string;
  paymentType: "ADVANCE" | "BALANCE" | "FULL";
  totalAmount: number;
  advancePaid?: number;
}

interface PaymentResult {
  paymentId: string;
  amount: number;
  method: string;
  bookingStatus: string;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: Record<string, string>;
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
}

// Payment Modal Component
export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  bookingId,
  bookingNumber,
  venueName,
  paymentType,
  totalAmount,
  advancePaid = 0,
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<{
    orderId: string;
    amount: number;
    keyId: string;
    booking: {
      customerName: string;
      customerEmail: string;
      customerPhone: string;
    };
  } | null>(null);

  // Calculate payment amount
  const advancePercent = 25; // 25% advance
  const advanceAmount = Math.round(totalAmount * (advancePercent / 100));
  const balanceAmount = totalAmount - advancePaid;

  const paymentAmount =
    paymentType === "ADVANCE"
      ? advanceAmount
      : paymentType === "BALANCE"
      ? balanceAmount
      : totalAmount;

  // Load Razorpay script
  useEffect(() => {
    if (isOpen && !window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [isOpen]);

  // Create order when modal opens
  useEffect(() => {
    if (isOpen && !orderData) {
      createPaymentOrder();
    }
  }, [isOpen]);

  const createPaymentOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          paymentType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment order");
      }

      setOrderData({
        orderId: data.orderId,
        amount: data.amount,
        keyId: data.keyId,
        booking: data.booking,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!orderData || !window.Razorpay) {
      setError("Payment gateway not ready. Please try again.");
      return;
    }

    setLoading(true);
    setError(null);

    const options: RazorpayOptions = {
      key: orderData.keyId,
      amount: orderData.amount * 100, // In paise
      currency: "INR",
      name: "ShubhSpace",
      description: `${paymentType} Payment - ${bookingNumber}`,
      order_id: orderData.orderId,
      handler: async (response: RazorpayResponse) => {
        try {
          // Verify payment
          const verifyResponse = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyResponse.json();

          if (!verifyResponse.ok) {
            throw new Error(verifyData.error || "Payment verification failed");
          }

          onSuccess({
            paymentId: verifyData.payment.id,
            amount: verifyData.payment.amount,
            method: verifyData.payment.method,
            bookingStatus: verifyData.booking.status,
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : "Payment verification failed");
        } finally {
          setLoading(false);
        }
      },
      prefill: {
        name: orderData.booking.customerName,
        email: orderData.booking.customerEmail,
        contact: orderData.booking.customerPhone,
      },
      notes: {
        bookingNumber,
        paymentType,
      },
      theme: {
        color: "#8B5CF6",
      },
      modal: {
        ondismiss: () => {
          setLoading(false);
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Payment</h2>
                  <p className="text-white/80 text-sm">{bookingNumber}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Venue Info */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Booking for</p>
              <p className="font-semibold text-gray-900">{venueName}</p>
            </div>

            {/* Payment Breakdown */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Total Amount</span>
                <span>₹{totalAmount.toLocaleString("en-IN")}</span>
              </div>
              {advancePaid > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Already Paid</span>
                  <span>- ₹{advancePaid.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                <span>
                  {paymentType === "ADVANCE"
                    ? `Advance (${advancePercent}%)`
                    : paymentType === "BALANCE"
                    ? "Balance Due"
                    : "Pay Now"}
                </span>
                <span className="text-purple-600">
                  ₹{paymentAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-3">Accepted Payment Methods</p>
              <div className="flex gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                  <CreditCard className="h-4 w-4" />
                  <span>Cards</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                  <Smartphone className="h-4 w-4" />
                  <span>UPI</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                  <Building className="h-4 w-4" />
                  <span>Net Banking</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                  <Wallet className="h-4 w-4" />
                  <span>Wallets</span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={loading || !orderData}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5" />
                  Pay ₹{paymentAmount.toLocaleString("en-IN")}
                </>
              )}
            </button>

            {/* Security Badge */}
            <div className="mt-4 flex items-center justify-center gap-2 text-gray-400 text-sm">
              <Shield className="h-4 w-4" />
              <span>Secured by Razorpay</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Payment Success Component
interface PaymentSuccessProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  bookingNumber: string;
  venueName: string;
  bookingStatus: string;
  onViewBooking: () => void;
}

export function PaymentSuccess({
  isOpen,
  onClose,
  amount,
  bookingNumber,
  venueName,
  bookingStatus,
  onViewBooking,
}: PaymentSuccessProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-sm mx-4 bg-white rounded-3xl shadow-2xl p-8 text-center"
        >
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center"
          >
            <CheckCircle className="h-12 w-12 text-green-500" />
          </motion.div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h2>
          <p className="text-gray-500 mb-6">
            Your payment of ₹{amount.toLocaleString("en-IN")} has been received.
          </p>

          {/* Booking Info */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left">
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">Booking</span>
              <span className="font-medium">{bookingNumber}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">Venue</span>
              <span className="font-medium">{venueName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                {bookingStatus}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={onViewBooking}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              View Booking Details
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Payment History Component
interface Payment {
  id: string;
  amount: number;
  status: string;
  type: string;
  method?: string;
  paidAt?: string;
  receiptNumber?: string;
  refundAmount?: number;
}

interface PaymentHistoryProps {
  payments: Payment[];
  onDownloadReceipt?: (paymentId: string) => void;
}

export function PaymentHistory({ payments, onDownloadReceipt }: PaymentHistoryProps) {
  const statusColors: Record<string, string> = {
    COMPLETED: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    FAILED: "bg-red-100 text-red-700",
    REFUNDED: "bg-blue-100 text-blue-700",
    PARTIALLY_REFUNDED: "bg-purple-100 text-purple-700",
  };

  const methodIcons: Record<string, React.ReactNode> = {
    card: <CreditCard className="h-4 w-4" />,
    upi: <Smartphone className="h-4 w-4" />,
    netbanking: <Building className="h-4 w-4" />,
    wallet: <Wallet className="h-4 w-4" />,
  };

  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <IndianRupee className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>No payments yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gray-100 rounded-lg">
                {payment.method ? methodIcons[payment.method] || <IndianRupee className="h-4 w-4" /> : <IndianRupee className="h-4 w-4" />}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  ₹{payment.amount.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {payment.type.toLowerCase()} Payment
                </p>
              </div>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                statusColors[payment.status] || "bg-gray-100 text-gray-700"
              }`}
            >
              {payment.status}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              {payment.paidAt && (
                <span>
                  {new Date(payment.paidAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
              {payment.method && (
                <span className="capitalize">{payment.method}</span>
              )}
            </div>
            {payment.receiptNumber && onDownloadReceipt && (
              <button
                onClick={() => onDownloadReceipt(payment.id)}
                className="flex items-center gap-1 text-purple-600 hover:text-purple-700"
              >
                <Receipt className="h-4 w-4" />
                Receipt
              </button>
            )}
          </div>

          {payment.refundAmount && payment.refundAmount > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2 text-sm text-blue-600">
              <span>Refunded: ₹{payment.refundAmount.toLocaleString("en-IN")}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Pay Now Button Component
interface PayNowButtonProps {
  bookingId: string;
  bookingNumber: string;
  venueName: string;
  totalAmount: number;
  advancePaid?: number;
  status: string;
  onPaymentSuccess?: () => void;
  className?: string;
}

export function PayNowButton({
  bookingId,
  bookingNumber,
  venueName,
  totalAmount,
  advancePaid = 0,
  status,
  onPaymentSuccess,
  className = "",
}: PayNowButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<PaymentResult | null>(null);

  const advancePercent = 25;
  const advanceAmount = Math.round(totalAmount * (advancePercent / 100));
  const isPendingAdvance = status === "PENDING" && advancePaid < advanceAmount;
  const hasBalance = advancePaid < totalAmount && status !== "CANCELLED";

  const paymentType = isPendingAdvance
    ? "ADVANCE"
    : hasBalance
    ? "BALANCE"
    : "FULL";

  const buttonText = isPendingAdvance
    ? `Pay Advance (₹${advanceAmount.toLocaleString("en-IN")})`
    : hasBalance
    ? `Pay Balance (₹${(totalAmount - advancePaid).toLocaleString("en-IN")})`
    : "Paid";

  const handleSuccess = (data: PaymentResult) => {
    setShowModal(false);
    setSuccessData(data);
    setShowSuccess(true);
  };

  const handleViewBooking = () => {
    setShowSuccess(false);
    onPaymentSuccess?.();
  };

  if (!isPendingAdvance && !hasBalance) {
    return (
      <span className="px-4 py-2 bg-green-100 text-green-700 rounded-xl font-medium flex items-center gap-2">
        <CheckCircle className="h-4 w-4" />
        Fully Paid
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2 ${className}`}
      >
        <CreditCard className="h-4 w-4" />
        {buttonText}
      </button>

      <PaymentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
        bookingId={bookingId}
        bookingNumber={bookingNumber}
        venueName={venueName}
        paymentType={paymentType}
        totalAmount={totalAmount}
        advancePaid={advancePaid}
      />

      {successData && (
        <PaymentSuccess
          isOpen={showSuccess}
          onClose={() => setShowSuccess(false)}
          amount={successData.amount}
          bookingNumber={bookingNumber}
          venueName={venueName}
          bookingStatus={successData.bookingStatus}
          onViewBooking={handleViewBooking}
        />
      )}
    </>
  );
}
