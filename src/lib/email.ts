import { Resend } from "resend";
import { prisma } from "./prisma";

// Initialize Resend (or use Nodemailer as fallback)
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.FROM_EMAIL || "ShubhSpace <noreply@shubhspace.in>";
const APP_NAME = "ShubhSpace";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bookmyvenue-alpha.vercel.app";

// Email templates
type EmailTemplate =
  | "booking_confirmation"
  | "booking_status_update"
  | "payment_success"
  | "payment_failed"
  | "owner_new_booking"
  | "owner_booking_reminder"
  | "review_request"
  | "welcome"
  | "event_reminder"
  | "post_event_feedback"
  | "re_engagement";

interface SendEmailParams {
  to: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
  bookingId?: string;
  userId?: string;
}

// Template generators
function getEmailContent(template: EmailTemplate, data: Record<string, unknown>) {
  switch (template) {
    case "booking_confirmation":
      return {
        subject: `Booking Confirmed - ${data.bookingNumber}`,
        html: bookingConfirmationTemplate(data),
      };
    case "booking_status_update":
      return {
        subject: `Booking Update - ${data.bookingNumber}`,
        html: bookingStatusUpdateTemplate(data),
      };
    case "payment_success":
      return {
        subject: `Payment Successful - ₹${data.amount}`,
        html: paymentSuccessTemplate(data),
      };
    case "payment_failed":
      return {
        subject: `Payment Failed - Please retry`,
        html: paymentFailedTemplate(data),
      };
    case "owner_new_booking":
      return {
        subject: `New Booking Request - ${data.bookingNumber}`,
        html: ownerNewBookingTemplate(data),
      };
    case "owner_booking_reminder":
      return {
        subject: `Upcoming Booking Reminder - ${data.eventDate}`,
        html: ownerBookingReminderTemplate(data),
      };
    case "review_request":
      return {
        subject: `How was your experience at ${data.venueName}?`,
        html: reviewRequestTemplate(data),
      };
    case "welcome":
      return {
        subject: `Welcome to ${APP_NAME}!`,
        html: welcomeTemplate(data),
      };
    case "event_reminder":
      return {
        subject: `🎉 Your event is coming up - ${data.eventDate}`,
        html: eventReminderTemplate(data),
      };
    case "post_event_feedback":
      return {
        subject: `How was your celebration at ${data.venueName}?`,
        html: postEventFeedbackTemplate(data),
      };
    case "re_engagement":
      return {
        subject: `Come back to ${APP_NAME} - plan your next celebration!`,
        html: reEngagementTemplate(data),
      };
    default:
      throw new Error(`Unknown email template: ${template}`);
  }
}

// Send email function
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const { to, template, data, bookingId, userId } = params;

  try {
    const { subject, html } = getEmailContent(template, data);

    let messageId: string | undefined;
    let error: string | undefined;

    if (resend) {
      // Use Resend
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      });

      if (result.error) {
        error = result.error.message;
      } else {
        messageId = result.data?.id;
      }
    } else {
      // Log for development (no email service configured)
      console.log("📧 Email would be sent:", { to, subject, template });
      messageId = `dev-${Date.now()}`;
    }

    // Log email
    await prisma.emailLog.create({
      data: {
        to,
        subject,
        template,
        status: error ? "FAILED" : "SENT",
        messageId,
        provider: resend ? "resend" : "dev",
        error,
        bookingId,
        userId,
        sentAt: error ? null : new Date(),
      },
    });

    return !error;
  } catch (err) {
    console.error("Error sending email:", err);

    // Log failed email
    await prisma.emailLog.create({
      data: {
        to,
        subject: `[${template}]`,
        template,
        status: "FAILED",
        error: err instanceof Error ? err.message : "Unknown error",
        bookingId,
        userId,
      },
    });

    return false;
  }
}

// Email Templates
function baseTemplate(content: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { text-align: center; margin-bottom: 24px; }
    .logo { font-size: 28px; font-weight: bold; background: linear-gradient(135deg, #8B5CF6, #EC4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .content { color: #374151; line-height: 1.6; }
    .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white !important; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 16px 0; }
    .info-box { background: #f3f4f6; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #6b7280; }
    .info-value { font-weight: 600; color: #111827; }
    .footer { text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 14px; }
    .success { color: #10b981; }
    .warning { color: #f59e0b; }
    .error { color: #ef4444; }
    h1 { color: #111827; margin: 0 0 16px 0; }
    h2 { color: #374151; margin: 24px 0 12px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">✨ ${APP_NAME}</div>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p>Questions? Reply to this email or contact us at support@shubhspace.in</p>
        <p>© ${new Date().getFullYear()} ${APP_NAME}. Making celebrations memorable.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

function bookingConfirmationTemplate(data: Record<string, unknown>) {
  return baseTemplate(`
    <h1>🎉 Booking Confirmed!</h1>
    <p>Hi ${data.customerName},</p>
    <p>Great news! Your booking has been confirmed. Here are the details:</p>
    
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Booking Number</span>
        <span class="info-value">${data.bookingNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Venue/Service</span>
        <span class="info-value">${data.venueName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Event Date</span>
        <span class="info-value">${data.eventDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Guest Count</span>
        <span class="info-value">${data.guestCount} guests</span>
      </div>
      <div class="info-row">
        <span class="info-label">Total Amount</span>
        <span class="info-value">₹${Number(data.totalAmount).toLocaleString("en-IN")}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Advance Paid</span>
        <span class="info-value success">₹${Number(data.advancePaid).toLocaleString("en-IN")}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Balance Due</span>
        <span class="info-value">₹${Number(data.balanceDue).toLocaleString("en-IN")}</span>
      </div>
    </div>
    
    <p>The venue owner will contact you shortly to discuss further details.</p>
    
    <center>
      <a href="${APP_URL}/bookings" class="button">View Booking Details</a>
    </center>
    
    <p><strong>Important:</strong> Please save this email for your records.</p>
  `);
}

function bookingStatusUpdateTemplate(data: Record<string, unknown>) {
  const statusColors: Record<string, string> = {
    CONFIRMED: "success",
    CANCELLED: "error",
    COMPLETED: "success",
    PENDING: "warning",
  };
  const statusClass = statusColors[data.status as string] || "";

  return baseTemplate(`
    <h1>📋 Booking Status Update</h1>
    <p>Hi ${data.customerName},</p>
    <p>Your booking status has been updated:</p>
    
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Booking Number</span>
        <span class="info-value">${data.bookingNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">New Status</span>
        <span class="info-value ${statusClass}">${data.status}</span>
      </div>
      ${data.message ? `<p style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">${data.message}</p>` : ""}
    </div>
    
    <center>
      <a href="${APP_URL}/bookings" class="button">View Booking</a>
    </center>
  `);
}

function paymentSuccessTemplate(data: Record<string, unknown>) {
  return baseTemplate(`
    <h1 class="success">✅ Payment Successful!</h1>
    <p>Hi ${data.customerName},</p>
    <p>We've received your payment. Thank you!</p>
    
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Amount Paid</span>
        <span class="info-value success">₹${Number(data.amount).toLocaleString("en-IN")}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Payment ID</span>
        <span class="info-value">${data.paymentId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Booking Number</span>
        <span class="info-value">${data.bookingNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Payment Method</span>
        <span class="info-value">${data.paymentMethod || "Online"}</span>
      </div>
    </div>
    
    ${data.receiptUrl ? `<center><a href="${data.receiptUrl}" class="button">Download Receipt</a></center>` : ""}
  `);
}

function paymentFailedTemplate(data: Record<string, unknown>) {
  return baseTemplate(`
    <h1 class="error">❌ Payment Failed</h1>
    <p>Hi ${data.customerName},</p>
    <p>Unfortunately, your payment could not be processed.</p>
    
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Amount</span>
        <span class="info-value">₹${Number(data.amount).toLocaleString("en-IN")}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Reason</span>
        <span class="info-value error">${data.reason || "Transaction declined"}</span>
      </div>
    </div>
    
    <p>Please try again or use a different payment method.</p>
    
    <center>
      <a href="${APP_URL}/bookings" class="button">Retry Payment</a>
    </center>
    
    <p>If the amount was deducted from your account, it will be refunded within 5-7 business days.</p>
  `);
}

function ownerNewBookingTemplate(data: Record<string, unknown>) {
  return baseTemplate(`
    <h1>🎊 New Booking Request!</h1>
    <p>Hi ${data.ownerName},</p>
    <p>Great news! You have a new booking request for <strong>${data.venueName}</strong>.</p>
    
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Booking Number</span>
        <span class="info-value">${data.bookingNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Customer</span>
        <span class="info-value">${data.customerName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Phone</span>
        <span class="info-value">${data.customerPhone}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Event Date</span>
        <span class="info-value">${data.eventDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Guest Count</span>
        <span class="info-value">${data.guestCount} guests</span>
      </div>
      <div class="info-row">
        <span class="info-label">Event Type</span>
        <span class="info-value">${data.eventType || "Wedding"}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Total Amount</span>
        <span class="info-value">₹${Number(data.totalAmount).toLocaleString("en-IN")}</span>
      </div>
    </div>
    
    ${data.specialRequests ? `<p><strong>Special Requests:</strong> ${data.specialRequests}</p>` : ""}
    
    <center>
      <a href="${APP_URL}/owner" class="button">View & Manage Booking</a>
    </center>
    
    <p>Please contact the customer and confirm the booking details.</p>
  `);
}

function ownerBookingReminderTemplate(data: Record<string, unknown>) {
  return baseTemplate(`
    <h1>⏰ Upcoming Booking Reminder</h1>
    <p>Hi ${data.ownerName},</p>
    <p>This is a reminder that you have a booking coming up:</p>
    
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Venue</span>
        <span class="info-value">${data.venueName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Event Date</span>
        <span class="info-value warning">${data.eventDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Customer</span>
        <span class="info-value">${data.customerName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Phone</span>
        <span class="info-value">${data.customerPhone}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Guest Count</span>
        <span class="info-value">${data.guestCount} guests</span>
      </div>
    </div>
    
    <p>Make sure everything is prepared for the event!</p>
  `);
}

function reviewRequestTemplate(data: Record<string, unknown>) {
  return baseTemplate(`
    <h1>⭐ How was your experience?</h1>
    <p>Hi ${data.customerName},</p>
    <p>We hope you had an amazing celebration at <strong>${data.venueName}</strong>!</p>
    <p>Your feedback helps other couples make the right choice. Would you like to share your experience?</p>
    
    <center>
      <a href="${APP_URL}/venues/${data.venueId}?review=true" class="button">Leave a Review</a>
    </center>
    
    <p>It only takes a minute and means a lot to the venue owners and future customers.</p>
    <p>Thank you for choosing ${APP_NAME}! 💜</p>
  `);
}

function welcomeTemplate(data: Record<string, unknown>) {
  return baseTemplate(`
    <h1>🎉 Welcome to ${APP_NAME}!</h1>
    <p>Hi ${data.name},</p>
    <p>Thank you for joining ${APP_NAME} - your one-stop destination for wedding venues and catering services.</p>
    
    <h2>What you can do:</h2>
    <ul>
      <li>🏛️ Browse 500+ wedding venues across Kolkata</li>
      <li>🍽️ Discover top-rated caterers for your event</li>
      <li>📅 Check availability and book instantly</li>
      <li>💜 Save your favorites to a wishlist</li>
      <li>⭐ Read reviews from real couples</li>
    </ul>
    
    <center>
      <a href="${APP_URL}/venues" class="button">Explore Venues</a>
    </center>
    
    <p>Let's make your celebration unforgettable! ✨</p>
  `);
}

// ==================== PHASE 3: RETENTION EMAIL TEMPLATES ====================

function eventReminderTemplate(data: Record<string, unknown>) {
  const daysUntil = data.daysUntil || "upcoming";
  return baseTemplate(`
    <h1>🎉 Your event is ${daysUntil === 1 ? 'tomorrow' : daysUntil === 3 ? 'in 3 days' : 'coming up'}!</h1>
    <p>Hi ${data.customerName},</p>
    <p>Get ready to celebrate! Your event at <strong>${data.venueName}</strong> is almost here.</p>
    
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Event Date</span>
        <span class="info-value warning">${data.eventDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Booking Number</span>
        <span class="info-value">${data.bookingNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Guest Count</span>
        <span class="info-value">${data.guestCount || 'TBD'}</span>
      </div>
    </div>
    
    <h2>Quick Checklist:</h2>
    <ul>
      <li>✅ Confirm final guest count with the venue</li>
      <li>✅ Review special requests and dietary preferences</li>
      <li>✅ Arrange accommodation for out-of-town guests</li>
      <li>✅ Plan your pre-event schedule</li>
    </ul>
    
    <center>
      <a href="${APP_URL}/bookings" class="button">View Booking Details</a>
    </center>
    
    <p>If you have any questions or last-minute changes, contact the venue owner immediately.</p>
    <p>We're excited to make your celebration special! 🎊</p>
  `);
}

function postEventFeedbackTemplate(data: Record<string, unknown>) {
  return baseTemplate(`
    <h1>⭐ How was your celebration?</h1>
    <p>Hi ${data.customerName},</p>
    <p>We hope you had an amazing time at <strong>${data.venueName}</strong>! Your feedback helps us ensure the best experiences for future celebrations.</p>
    
    <div class="info-box">
      <p><strong>Share your experience:</strong></p>
      <ul style="margin: 12px 0; padding-left: 20px;">
        <li>⭐ Rate your experience</li>
        <li>💬 Share what you loved</li>
        <li>🎯 Suggest improvements</li>
        <li>👥 Recommend to friends</li>
      </ul>
    </div>
    
    <center>
      <a href="${APP_URL}/bookings/${data.bookingId}" class="button">Leave a Review</a>
    </center>
    
    <p style="margin-top: 20px;">Your feedback is valuable and helps the venue owners serve you better. Thank you for celebrating with us! 💜</p>
    
    <h2 style="margin-top: 24px; font-size: 16px;">Planning another event?</h2>
    <center>
      <a href="${APP_URL}/venues" class="button">Browse Venues</a>
    </center>
  `);
}

function reEngagementTemplate(data: Record<string, unknown>) {
  return baseTemplate(`
    <h1>💜 Come back and plan something special!</h1>
    <p>Hi ${data.name},</p>
    <p>It's been a while! We've added amazing new venues and offers since we last saw you on ${APP_NAME}.</p>
    
    <div class="info-box">
      <h2 style="margin-top: 0;">What's new:</h2>
      <ul style="margin: 12px 0; padding-left: 20px;">
        <li>✨ 50+ new premium venues added</li>
        <li>🎯 Special discounts on selected properties</li>
        <li>🏆 Top-rated caterers with new packages</li>
        <li>📅 Flexible booking options</li>
      </ul>
    </div>
    
    <p>Whether it's a wedding, birthday, corporate event, or intimate gathering—we've got the perfect venue for you!</p>
    
    <center>
      <a href="${APP_URL}/venues" class="button">Explore New Venues</a>
    </center>
    
    <p>Or maybe you already have a favorite? Check your wishlist for personalized offers:</p>
    
    <center>
      <a href="${APP_URL}/wishlist" class="button">View Saved Venues</a>
    </center>
    
    <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
      We miss you and can't wait to help you create your next unforgettable memory! 🎉
    </p>
  `);
}

// Notification helper functions
export async function sendBookingConfirmation(booking: {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  eventDate: Date;
  guestCount: number | null;
  totalAmount: number | null;
  advanceAmount: number | null;
  venue?: { name: string } | null;
  caterer?: { name: string } | null;
}) {
  const venueName = booking.venue?.name || booking.caterer?.name || "Your Venue";
  const balanceDue = (booking.totalAmount || 0) - (booking.advanceAmount || 0);

  return sendEmail({
    to: booking.customerEmail,
    template: "booking_confirmation",
    bookingId: booking.id,
    data: {
      customerName: booking.customerName,
      bookingNumber: booking.bookingNumber,
      venueName,
      eventDate: booking.eventDate.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      guestCount: booking.guestCount || "TBD",
      totalAmount: booking.totalAmount || 0,
      advancePaid: booking.advanceAmount || 0,
      balanceDue,
    },
  });
}

export async function sendPaymentConfirmation(
  customerEmail: string,
  customerName: string,
  amount: number,
  paymentId: string,
  bookingNumber: string,
  paymentMethod?: string,
  receiptUrl?: string
) {
  return sendEmail({
    to: customerEmail,
    template: "payment_success",
    data: {
      customerName,
      amount,
      paymentId,
      bookingNumber,
      paymentMethod,
      receiptUrl,
    },
  });
}

export async function notifyOwnerNewBooking(
  ownerEmail: string,
  ownerName: string,
  booking: {
    id: string;
    bookingNumber: string;
    customerName: string;
    customerPhone: string;
    eventDate: Date;
    guestCount: number | null;
    eventType?: string | null;
    totalAmount: number | null;
    specialRequests?: string | null;
    venue?: { name: string } | null;
    caterer?: { name: string } | null;
  }
) {
  return sendEmail({
    to: ownerEmail,
    template: "owner_new_booking",
    bookingId: booking.id,
    data: {
      ownerName,
      venueName: booking.venue?.name || booking.caterer?.name || "Your Service",
      bookingNumber: booking.bookingNumber,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      eventDate: booking.eventDate.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      guestCount: booking.guestCount || "TBD",
      eventType: booking.eventType || "Wedding",
      totalAmount: booking.totalAmount || 0,
      specialRequests: booking.specialRequests,
    },
  });
}

export async function sendReviewRequest(
  customerEmail: string,
  customerName: string,
  venueName: string,
  venueId: string
) {
  return sendEmail({
    to: customerEmail,
    template: "review_request",
    data: {
      customerName,
      venueName,
      venueId,
    },
  });
}

export async function sendWelcomeEmail(email: string, name: string, userId: string) {
  return sendEmail({
    to: email,
    template: "welcome",
    userId,
    data: {
      name,
    },
  });
}

// ==================== PHASE 3: RETENTION EMAIL HELPERS ====================

/**
 * Send event reminder email (1, 3, or 7 days before event)
 */
export async function sendEventReminder(
  customerEmail: string,
  customerName: string,
  venueName: string,
  bookingNumber: string,
  eventDate: Date,
  guestCount: number | null,
  bookingId: string,
  daysUntil: number = 1
) {
  return sendEmail({
    to: customerEmail,
    template: "event_reminder",
    bookingId,
    data: {
      customerName,
      venueName,
      bookingNumber,
      eventDate: eventDate.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      guestCount: guestCount || "TBD",
      daysUntil,
    },
  });
}

/**
 * Send post-event feedback request email
 */
export async function sendPostEventFeedback(
  customerEmail: string,
  customerName: string,
  venueName: string,
  bookingId: string,
  userId: string
) {
  return sendEmail({
    to: customerEmail,
    template: "post_event_feedback",
    bookingId,
    userId,
    data: {
      customerName,
      venueName,
      bookingId,
    },
  });
}

/**
 * Send re-engagement email to inactive users
 */
export async function sendReEngagementEmail(
  email: string,
  name: string,
  userId: string,
  daysInactive: number = 60
) {
  return sendEmail({
    to: email,
    template: "re_engagement",
    userId,
    data: {
      name,
      daysInactive,
    },
  });
}
