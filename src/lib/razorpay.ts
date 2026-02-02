import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Platform commission percentage (e.g., 5%)
export const PLATFORM_COMMISSION_PERCENT = parseFloat(
  process.env.PLATFORM_COMMISSION_PERCENT || "5"
);

// Advance payment percentage required
export const ADVANCE_PAYMENT_PERCENT = parseFloat(
  process.env.ADVANCE_PAYMENT_PERCENT || "25"
);

interface CreateOrderParams {
  amount: number; // In INR (will be converted to paise)
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

interface OrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

// Create Razorpay order
export async function createOrder(params: CreateOrderParams): Promise<OrderResponse> {
  const { amount, currency = "INR", receipt, notes = {} } = params;

  // Razorpay expects amount in paise (1 INR = 100 paise)
  const amountInPaise = Math.round(amount * 100);

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency,
    receipt,
    notes,
  });

  return order as OrderResponse;
}

interface VerifyPaymentParams {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

// Verify payment signature
export function verifyPaymentSignature(params: VerifyPaymentParams): boolean {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;

  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body.toString())
    .digest("hex");

  return expectedSignature === razorpaySignature;
}

// Fetch payment details
export async function fetchPayment(paymentId: string) {
  return razorpay.payments.fetch(paymentId);
}

// Fetch order details
export async function fetchOrder(orderId: string) {
  return razorpay.orders.fetch(orderId);
}

interface RefundParams {
  paymentId: string;
  amount?: number; // In INR (partial refund). If not provided, full refund
  notes?: Record<string, string>;
}

// Initiate refund
export async function initiateRefund(params: RefundParams) {
  const { paymentId, amount, notes = {} } = params;

  const refundOptions: Record<string, unknown> = { notes };
  
  if (amount) {
    // Convert to paise for partial refund
    refundOptions.amount = Math.round(amount * 100);
  }

  return razorpay.payments.refund(paymentId, refundOptions);
}

// Calculate amounts
export function calculateAmounts(totalAmount: number) {
  const advanceAmount = Math.round(totalAmount * (ADVANCE_PAYMENT_PERCENT / 100));
  const balanceAmount = totalAmount - advanceAmount;
  const platformFee = Math.round(totalAmount * (PLATFORM_COMMISSION_PERCENT / 100));
  const ownerAmount = totalAmount - platformFee;

  return {
    totalAmount,
    advanceAmount,
    balanceAmount,
    platformFee,
    ownerAmount,
    advancePercent: ADVANCE_PAYMENT_PERCENT,
    commissionPercent: PLATFORM_COMMISSION_PERCENT,
  };
}

// Generate receipt number
export function generateReceiptNumber(bookingNumber: string, paymentType: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  return `RCP-${bookingNumber}-${paymentType}-${timestamp}`;
}

// Format amount for display
export function formatAmount(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Payment status mapping
export const PAYMENT_STATUS_MAP = {
  created: "PENDING",
  authorized: "PROCESSING",
  captured: "COMPLETED",
  refunded: "REFUNDED",
  failed: "FAILED",
} as const;

export default razorpay;
