// SMS Service using Twilio
// To use this service, add to .env:
// TWILIO_ACCOUNT_SID=your_account_sid
// TWILIO_AUTH_TOKEN=your_auth_token  
// TWILIO_PHONE_NUMBER=your_twilio_phone

import { prisma } from "@/lib/prisma";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Check if Twilio is configured
export function isTwilioConfigured(): boolean {
  return !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER);
}

// Send SMS via Twilio
export async function sendSMS(
  to: string,
  message: string,
  template: string,
  metadata?: {
    bookingId?: string;
    userId?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Log the SMS attempt
  const smsLog = await prisma.smsLog.create({
    data: {
      to: formatPhoneNumber(to),
      message,
      template,
      provider: "twilio",
      bookingId: metadata?.bookingId,
      userId: metadata?.userId,
      status: "PENDING",
    },
  });

  if (!isTwilioConfigured()) {
    // Update log with error
    await prisma.smsLog.update({
      where: { id: smsLog.id },
      data: {
        status: "FAILED",
        error: "Twilio not configured",
      },
    });

    console.log("SMS (Twilio not configured):", { to, message });
    return { success: false, error: "SMS service not configured" };
  }

  try {
    const formattedPhone = formatPhoneNumber(to);
    
    // Twilio API call
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: formattedPhone,
          From: TWILIO_PHONE_NUMBER!,
          Body: message,
        }),
      }
    );

    const result = await response.json();

    if (response.ok) {
      // Update log with success
      await prisma.smsLog.update({
        where: { id: smsLog.id },
        data: {
          status: "SENT",
          messageId: result.sid,
          sentAt: new Date(),
        },
      });

      return { success: true, messageId: result.sid };
    } else {
      // Update log with error
      await prisma.smsLog.update({
        where: { id: smsLog.id },
        data: {
          status: "FAILED",
          error: result.message || "Unknown error",
        },
      });

      return { success: false, error: result.message };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Update log with error
    await prisma.smsLog.update({
      where: { id: smsLog.id },
      data: {
        status: "FAILED",
        error: errorMessage,
      },
    });

    console.error("SMS send error:", error);
    return { success: false, error: errorMessage };
  }
}

// Format phone number for India
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, "");
  
  // If starts with 0, remove it
  if (digits.startsWith("0")) {
    digits = digits.substring(1);
  }
  
  // If doesn't have country code, add India's +91
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  
  // If has 91 prefix but no +
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }
  
  // If already has + prefix, return as is
  if (phone.startsWith("+")) {
    return phone;
  }
  
  return `+${digits}`;
}

// ==================== SMS Templates ====================

export const SMS_TEMPLATES = {
  // Booking Confirmation
  BOOKING_CONFIRMED: (data: {
    customerName: string;
    bookingNumber: string;
    venueName: string;
    eventDate: string;
    amount: number;
  }) => `Hi ${data.customerName}! Your booking #${data.bookingNumber} at ${data.venueName} for ${data.eventDate} is confirmed. Total: ₹${data.amount.toLocaleString("en-IN")}. Thank you for choosing ShubhSpace! 🎉`,

  // Payment Received
  PAYMENT_RECEIVED: (data: {
    customerName: string;
    amount: number;
    bookingNumber: string;
  }) => `Hi ${data.customerName}, we've received ₹${data.amount.toLocaleString("en-IN")} for booking #${data.bookingNumber}. Thank you! - ShubhSpace`,

  // Booking Reminder (1 day before)
  BOOKING_REMINDER: (data: {
    customerName: string;
    venueName: string;
    eventDate: string;
  }) => `Reminder: Your event at ${data.venueName} is tomorrow (${data.eventDate}). We wish you a wonderful celebration! - ShubhSpace ✨`,

  // Booking Reminder (3 days before)
  BOOKING_REMINDER_3DAY: (data: {
    customerName: string;
    venueName: string;
    eventDate: string;
    guestCount: number;
  }) => `Hi ${data.customerName}! Just 3 days until your event at ${data.venueName} on ${data.eventDate}. Please confirm final guest count (currently ${data.guestCount}). - ShubhSpace`,

  // Booking Cancelled
  BOOKING_CANCELLED: (data: {
    customerName: string;
    bookingNumber: string;
    refundAmount?: number;
  }) => `Hi ${data.customerName}, your booking #${data.bookingNumber} has been cancelled.${data.refundAmount ? ` Refund of ₹${data.refundAmount.toLocaleString("en-IN")} will be processed in 5-7 days.` : ""} - ShubhSpace`,

  // Owner: New Booking Alert
  OWNER_NEW_BOOKING: (data: {
    ownerName: string;
    venueName: string;
    bookingNumber: string;
    eventDate: string;
    customerName: string;
  }) => `New booking alert! ${data.venueName} booked by ${data.customerName} for ${data.eventDate}. Booking #${data.bookingNumber}. Log in to ShubhSpace to view details.`,

  // Owner: Payment Received
  OWNER_PAYMENT_RECEIVED: (data: {
    ownerName: string;
    amount: number;
    venueName: string;
  }) => `₹${data.amount.toLocaleString("en-IN")} received for ${data.venueName}. Your earnings will be transferred in the next payout cycle. - ShubhSpace`,

  // Owner: Payout Processed
  OWNER_PAYOUT_PROCESSED: (data: {
    ownerName: string;
    amount: number;
    transactionId?: string;
  }) => `Hi ${data.ownerName}! ₹${data.amount.toLocaleString("en-IN")} has been transferred to your bank account.${data.transactionId ? ` Ref: ${data.transactionId}` : ""} - ShubhSpace`,

  // OTP Verification
  OTP_VERIFICATION: (data: { otp: string }) => 
    `Your ShubhSpace verification code is ${data.otp}. Valid for 10 minutes. Do not share with anyone.`,

  // Welcome Message
  WELCOME: (data: { name: string }) => 
    `Welcome to ShubhSpace, ${data.name}! 🎊 Your perfect wedding destination awaits. Start exploring venues and caterers now!`,
};

// ==================== Send Notification Functions ====================

export async function sendBookingConfirmationSMS(booking: {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  eventDate: Date;
  totalAmount: number;
  venue?: { name: string; owner: { phone?: string | null; name?: string | null } } | null;
  caterer?: { name: string; owner: { phone?: string | null; name?: string | null } } | null;
}) {
  const entityName = booking.venue?.name || booking.caterer?.name || "ShubhSpace";
  const eventDate = new Date(booking.eventDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Send to customer
  await sendSMS(
    booking.customerPhone,
    SMS_TEMPLATES.BOOKING_CONFIRMED({
      customerName: booking.customerName,
      bookingNumber: booking.bookingNumber,
      venueName: entityName,
      eventDate,
      amount: booking.totalAmount || 0,
    }),
    "BOOKING_CONFIRMED",
    { bookingId: booking.id }
  );

  // Send to owner
  const ownerPhone = booking.venue?.owner.phone || booking.caterer?.owner.phone;
  const ownerName = booking.venue?.owner.name || booking.caterer?.owner.name || "Owner";
  
  if (ownerPhone) {
    await sendSMS(
      ownerPhone,
      SMS_TEMPLATES.OWNER_NEW_BOOKING({
        ownerName,
        venueName: entityName,
        bookingNumber: booking.bookingNumber,
        eventDate,
        customerName: booking.customerName,
      }),
      "OWNER_NEW_BOOKING",
      { bookingId: booking.id }
    );
  }
}

export async function sendPaymentReceivedSMS(data: {
  bookingId: string;
  customerPhone: string;
  customerName: string;
  amount: number;
  bookingNumber: string;
  ownerPhone?: string;
  ownerName?: string;
  venueName?: string;
}) {
  // Send to customer
  await sendSMS(
    data.customerPhone,
    SMS_TEMPLATES.PAYMENT_RECEIVED({
      customerName: data.customerName,
      amount: data.amount,
      bookingNumber: data.bookingNumber,
    }),
    "PAYMENT_RECEIVED",
    { bookingId: data.bookingId }
  );

  // Send to owner
  if (data.ownerPhone && data.venueName) {
    await sendSMS(
      data.ownerPhone,
      SMS_TEMPLATES.OWNER_PAYMENT_RECEIVED({
        ownerName: data.ownerName || "Owner",
        amount: data.amount,
        venueName: data.venueName,
      }),
      "OWNER_PAYMENT_RECEIVED",
      { bookingId: data.bookingId }
    );
  }
}

export async function sendBookingReminderSMS(booking: {
  id: string;
  customerName: string;
  customerPhone: string;
  eventDate: Date;
  guestCount?: number | null;
  venue?: { name: string } | null;
  caterer?: { name: string } | null;
}, daysBeforeEvent: number = 1) {
  const entityName = booking.venue?.name || booking.caterer?.name || "your venue";
  const eventDate = new Date(booking.eventDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  const template = daysBeforeEvent === 1 
    ? SMS_TEMPLATES.BOOKING_REMINDER({
        customerName: booking.customerName,
        venueName: entityName,
        eventDate,
      })
    : SMS_TEMPLATES.BOOKING_REMINDER_3DAY({
        customerName: booking.customerName,
        venueName: entityName,
        eventDate,
        guestCount: booking.guestCount || 0,
      });

  await sendSMS(
    booking.customerPhone,
    template,
    daysBeforeEvent === 1 ? "BOOKING_REMINDER" : "BOOKING_REMINDER_3DAY",
    { bookingId: booking.id }
  );
}

export async function sendCancellationSMS(data: {
  bookingId: string;
  customerPhone: string;
  customerName: string;
  bookingNumber: string;
  refundAmount?: number;
}) {
  await sendSMS(
    data.customerPhone,
    SMS_TEMPLATES.BOOKING_CANCELLED({
      customerName: data.customerName,
      bookingNumber: data.bookingNumber,
      refundAmount: data.refundAmount,
    }),
    "BOOKING_CANCELLED",
    { bookingId: data.bookingId }
  );
}

export async function sendPayoutProcessedSMS(data: {
  ownerPhone: string;
  ownerName: string;
  amount: number;
  transactionId?: string;
  userId: string;
}) {
  await sendSMS(
    data.ownerPhone,
    SMS_TEMPLATES.OWNER_PAYOUT_PROCESSED({
      ownerName: data.ownerName,
      amount: data.amount,
      transactionId: data.transactionId,
    }),
    "OWNER_PAYOUT_PROCESSED",
    { userId: data.userId }
  );
}
