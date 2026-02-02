// Email Template Service
// Uses Resend for email delivery with customizable HTML templates

import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || "ShubhSpace <noreply@shubhspace.com>";

// Get or create email template
export async function getEmailTemplate(name: string): Promise<string | null> {
  const template = await prisma.emailTemplate.findUnique({
    where: { name },
  });
  return template?.body || null;
}

// Render template with variables
export function renderTemplate(template: string, variables: Record<string, string | number>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    rendered = rendered.replace(regex, String(value));
  }
  return rendered;
}

// Send email using template
export async function sendTemplatedEmail(data: {
  to: string;
  templateName: string;
  subject: string;
  variables: Record<string, string | number>;
  fallbackHtml?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Try to get custom template from database
    let html = await getEmailTemplate(data.templateName);
    
    // Use fallback if no custom template exists
    if (!html && data.fallbackHtml) {
      html = data.fallbackHtml;
    }
    
    if (!html) {
      throw new Error(`No template found: ${data.templateName}`);
    }

    // Render template with variables
    const renderedHtml = renderTemplate(html, data.variables);
    const renderedSubject = renderTemplate(data.subject, data.variables);

    // Send email via Resend
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: renderedSubject,
      html: renderedHtml,
    });

    if (result.data) {
      return { success: true, messageId: result.data.id };
    } else {
      return { success: false, error: result.error?.message || "Failed to send" };
    }
  } catch (error) {
    console.error("Email send error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

// ==================== Email HTML Templates ====================

// Base email wrapper
function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ShubhSpace</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">✨ ShubhSpace</h1>
              <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">Your Perfect Wedding Destination</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 25px 30px; border-top: 1px solid #e5e7eb;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 10px; color: #6b7280; font-size: 13px;">
                      Need help? Contact us at <a href="mailto:support@shubhspace.com" style="color: #6366f1; text-decoration: none;">support@shubhspace.com</a>
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © ${new Date().getFullYear()} ShubhSpace. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Styled button
function emailButton(text: string, url: string, color: string = "#6366f1"): string {
  return `<a href="${url}" style="display: inline-block; padding: 14px 28px; background-color: ${color}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">${text}</a>`;
}

// Info row
function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
      <span style="color: #6b7280; font-size: 14px;">${label}</span>
    </td>
    <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">
      <span style="color: #111827; font-size: 14px; font-weight: 500;">${value}</span>
    </td>
  </tr>`;
}

// ==================== Email Templates ====================

export const EMAIL_TEMPLATES = {
  // Booking Confirmation Email
  BOOKING_CONFIRMED: (data: {
    customerName: string;
    bookingNumber: string;
    venueName: string;
    eventDate: string;
    eventTime?: string;
    guestCount: number;
    totalAmount: number;
    advanceAmount?: number;
    address?: string;
    bookingUrl: string;
  }) => emailWrapper(`
    <h2 style="margin: 0 0 10px; color: #111827; font-size: 24px;">Booking Confirmed! 🎉</h2>
    <p style="margin: 0 0 25px; color: #6b7280; font-size: 15px; line-height: 1.6;">
      Dear ${data.customerName}, your booking has been confirmed. Here are your booking details:
    </p>
    
    <!-- Booking Card -->
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 25px; margin-bottom: 25px;">
      <p style="margin: 0 0 5px; color: #92400e; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Booking Reference</p>
      <p style="margin: 0; color: #78350f; font-size: 28px; font-weight: 700;">#${data.bookingNumber}</p>
    </div>
    
    <!-- Venue Info -->
    <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
      <h3 style="margin: 0 0 15px; color: #111827; font-size: 18px;">${data.venueName}</h3>
      ${data.address ? `<p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">📍 ${data.address}</p>` : ""}
      <table role="presentation" style="width: 100%;">
        ${infoRow("📅 Event Date", data.eventDate)}
        ${data.eventTime ? infoRow("🕐 Time", data.eventTime) : ""}
        ${infoRow("👥 Guests", `${data.guestCount} people`)}
        ${infoRow("💰 Total Amount", `₹${data.totalAmount.toLocaleString("en-IN")}`)}
        ${data.advanceAmount ? infoRow("✅ Paid", `₹${data.advanceAmount.toLocaleString("en-IN")}`) : ""}
      </table>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      ${emailButton("View Booking Details", data.bookingUrl)}
    </div>
    
    <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">
      We wish you a wonderful celebration! 🌟
    </p>
  `),

  // Payment Confirmation Email
  PAYMENT_RECEIVED: (data: {
    customerName: string;
    bookingNumber: string;
    amount: number;
    paymentMethod: string;
    transactionId: string;
    receiptUrl?: string;
  }) => emailWrapper(`
    <h2 style="margin: 0 0 10px; color: #111827; font-size: 24px;">Payment Received! 💳</h2>
    <p style="margin: 0 0 25px; color: #6b7280; font-size: 15px; line-height: 1.6;">
      Dear ${data.customerName}, we have received your payment. Here's your receipt:
    </p>
    
    <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
      <div style="text-align: center;">
        <span style="font-size: 48px;">✅</span>
        <p style="margin: 10px 0 0; color: #065f46; font-size: 20px; font-weight: 600;">₹${data.amount.toLocaleString("en-IN")}</p>
        <p style="margin: 5px 0 0; color: #047857; font-size: 14px;">Payment Successful</p>
      </div>
    </div>
    
    <table role="presentation" style="width: 100%; margin-bottom: 25px;">
      ${infoRow("Booking #", data.bookingNumber)}
      ${infoRow("Transaction ID", data.transactionId)}
      ${infoRow("Payment Method", data.paymentMethod)}
      ${infoRow("Date", new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }))}
    </table>
    
    ${data.receiptUrl ? `<div style="text-align: center;">${emailButton("Download Receipt", data.receiptUrl)}</div>` : ""}
  `),

  // Booking Reminder Email
  BOOKING_REMINDER: (data: {
    customerName: string;
    venueName: string;
    eventDate: string;
    daysUntilEvent: number;
    address?: string;
    bookingUrl: string;
  }) => emailWrapper(`
    <h2 style="margin: 0 0 10px; color: #111827; font-size: 24px;">Your Event is ${data.daysUntilEvent === 1 ? "Tomorrow" : `in ${data.daysUntilEvent} Days`}! ⏰</h2>
    <p style="margin: 0 0 25px; color: #6b7280; font-size: 15px; line-height: 1.6;">
      Dear ${data.customerName}, this is a friendly reminder about your upcoming event.
    </p>
    
    <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px; padding: 25px; margin-bottom: 25px; text-align: center;">
      <p style="margin: 0 0 10px; color: #1e40af; font-size: 16px;">📅 ${data.eventDate}</p>
      <h3 style="margin: 0; color: #1e3a8a; font-size: 22px;">${data.venueName}</h3>
      ${data.address ? `<p style="margin: 10px 0 0; color: #3b82f6; font-size: 14px;">📍 ${data.address}</p>` : ""}
    </div>
    
    <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>💡 Quick Tips:</strong><br>
        • Confirm final guest count with the venue<br>
        • Share venue location with your guests<br>
        • Keep venue contact number handy
      </p>
    </div>
    
    <div style="text-align: center;">
      ${emailButton("View Booking", data.bookingUrl)}
    </div>
  `),

  // Booking Cancelled Email
  BOOKING_CANCELLED: (data: {
    customerName: string;
    bookingNumber: string;
    venueName: string;
    refundAmount?: number;
    cancellationReason?: string;
  }) => emailWrapper(`
    <h2 style="margin: 0 0 10px; color: #111827; font-size: 24px;">Booking Cancelled</h2>
    <p style="margin: 0 0 25px; color: #6b7280; font-size: 15px; line-height: 1.6;">
      Dear ${data.customerName}, your booking has been cancelled as requested.
    </p>
    
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
      <table role="presentation" style="width: 100%;">
        ${infoRow("Booking #", data.bookingNumber)}
        ${infoRow("Venue", data.venueName)}
        ${data.cancellationReason ? infoRow("Reason", data.cancellationReason) : ""}
      </table>
    </div>
    
    ${data.refundAmount ? `
    <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
      <p style="margin: 0 0 10px; color: #065f46; font-size: 14px; font-weight: 600;">Refund Information</p>
      <p style="margin: 0; color: #047857; font-size: 24px; font-weight: 700;">₹${data.refundAmount.toLocaleString("en-IN")}</p>
      <p style="margin: 5px 0 0; color: #059669; font-size: 13px;">Will be credited to your original payment method within 5-7 business days</p>
    </div>
    ` : ""}
    
    <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">
      We hope to serve you again in the future! 💫
    </p>
  `),

  // Welcome Email
  WELCOME: (data: {
    name: string;
    loginUrl: string;
  }) => emailWrapper(`
    <h2 style="margin: 0 0 10px; color: #111827; font-size: 24px;">Welcome to ShubhSpace! 🎊</h2>
    <p style="margin: 0 0 25px; color: #6b7280; font-size: 15px; line-height: 1.6;">
      Dear ${data.name}, thank you for joining ShubhSpace – your perfect wedding destination!
    </p>
    
    <div style="background: linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%); border-radius: 12px; padding: 25px; margin-bottom: 25px; text-align: center;">
      <span style="font-size: 64px;">🎉</span>
      <h3 style="margin: 15px 0 10px; color: #86198f; font-size: 20px;">Your wedding journey begins here!</h3>
      <p style="margin: 0; color: #a855f7; font-size: 14px;">Discover stunning venues & exquisite catering</p>
    </div>
    
    <div style="margin-bottom: 25px;">
      <h4 style="margin: 0 0 15px; color: #111827; font-size: 16px;">What you can do on ShubhSpace:</h4>
      <ul style="margin: 0; padding: 0 0 0 20px; color: #6b7280; font-size: 14px; line-height: 2;">
        <li>🏛️ Browse beautiful wedding venues</li>
        <li>🍽️ Find top-rated caterers</li>
        <li>📅 Check real-time availability</li>
        <li>💳 Book with secure payments</li>
        <li>❤️ Save favorites to your wishlist</li>
      </ul>
    </div>
    
    <div style="text-align: center;">
      ${emailButton("Start Exploring", data.loginUrl, "#a855f7")}
    </div>
  `),

  // Owner: New Booking Notification
  OWNER_NEW_BOOKING: (data: {
    ownerName: string;
    venueName: string;
    bookingNumber: string;
    customerName: string;
    customerPhone: string;
    eventDate: string;
    guestCount: number;
    totalAmount: number;
    dashboardUrl: string;
  }) => emailWrapper(`
    <h2 style="margin: 0 0 10px; color: #111827; font-size: 24px;">New Booking Alert! 🔔</h2>
    <p style="margin: 0 0 25px; color: #6b7280; font-size: 15px; line-height: 1.6;">
      Hi ${data.ownerName}, you have received a new booking for ${data.venueName}.
    </p>
    
    <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; padding: 25px; margin-bottom: 25px;">
      <p style="margin: 0 0 5px; color: #065f46; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Booking Reference</p>
      <p style="margin: 0; color: #047857; font-size: 24px; font-weight: 700;">#${data.bookingNumber}</p>
    </div>
    
    <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
      <h4 style="margin: 0 0 15px; color: #111827; font-size: 16px;">Customer Details</h4>
      <table role="presentation" style="width: 100%;">
        ${infoRow("Name", data.customerName)}
        ${infoRow("Phone", data.customerPhone)}
      </table>
    </div>
    
    <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
      <h4 style="margin: 0 0 15px; color: #111827; font-size: 16px;">Event Details</h4>
      <table role="presentation" style="width: 100%;">
        ${infoRow("📅 Date", data.eventDate)}
        ${infoRow("👥 Guests", `${data.guestCount} people`)}
        ${infoRow("💰 Amount", `₹${data.totalAmount.toLocaleString("en-IN")}`)}
      </table>
    </div>
    
    <div style="text-align: center;">
      ${emailButton("View in Dashboard", data.dashboardUrl, "#059669")}
    </div>
  `),

  // Owner: Payout Processed
  OWNER_PAYOUT: (data: {
    ownerName: string;
    amount: number;
    transactionId: string;
    payoutDate: string;
    bankLast4?: string;
    dashboardUrl: string;
  }) => emailWrapper(`
    <h2 style="margin: 0 0 10px; color: #111827; font-size: 24px;">Payout Processed! 💰</h2>
    <p style="margin: 0 0 25px; color: #6b7280; font-size: 15px; line-height: 1.6;">
      Hi ${data.ownerName}, your earnings have been transferred to your bank account.
    </p>
    
    <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; padding: 30px; margin-bottom: 25px; text-align: center;">
      <span style="font-size: 48px;">✅</span>
      <p style="margin: 15px 0 5px; color: #065f46; font-size: 32px; font-weight: 700;">₹${data.amount.toLocaleString("en-IN")}</p>
      <p style="margin: 0; color: #047857; font-size: 14px;">Successfully Transferred</p>
    </div>
    
    <table role="presentation" style="width: 100%; margin-bottom: 25px;">
      ${infoRow("Transaction ID", data.transactionId)}
      ${infoRow("Date", data.payoutDate)}
      ${data.bankLast4 ? infoRow("Bank Account", `****${data.bankLast4}`) : ""}
    </table>
    
    <div style="text-align: center;">
      ${emailButton("View Payout History", data.dashboardUrl)}
    </div>
  `),
};

// ==================== Send Email Functions ====================

export async function sendBookingConfirmationEmail(data: {
  to: string;
  customerName: string;
  bookingNumber: string;
  venueName: string;
  eventDate: string;
  eventTime?: string;
  guestCount: number;
  totalAmount: number;
  advanceAmount?: number;
  address?: string;
  bookingId: string;
}) {
  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bookmyvenue-alpha.vercel.app"}/bookings?id=${data.bookingId}`;
  
  return sendTemplatedEmail({
    to: data.to,
    templateName: "BOOKING_CONFIRMED",
    subject: `Booking Confirmed - #${data.bookingNumber} | ShubhSpace`,
    variables: {},
    fallbackHtml: EMAIL_TEMPLATES.BOOKING_CONFIRMED({
      ...data,
      bookingUrl,
    }),
  });
}

export async function sendPaymentConfirmationEmail(data: {
  to: string;
  customerName: string;
  bookingNumber: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  receiptUrl?: string;
}) {
  return sendTemplatedEmail({
    to: data.to,
    templateName: "PAYMENT_RECEIVED",
    subject: `Payment Received - ₹${data.amount.toLocaleString("en-IN")} | ShubhSpace`,
    variables: {},
    fallbackHtml: EMAIL_TEMPLATES.PAYMENT_RECEIVED(data),
  });
}

export async function sendBookingReminderEmail(data: {
  to: string;
  customerName: string;
  venueName: string;
  eventDate: string;
  daysUntilEvent: number;
  address?: string;
  bookingId: string;
}) {
  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bookmyvenue-alpha.vercel.app"}/bookings?id=${data.bookingId}`;
  
  return sendTemplatedEmail({
    to: data.to,
    templateName: "BOOKING_REMINDER",
    subject: `Event Reminder - ${data.daysUntilEvent === 1 ? "Tomorrow" : `${data.daysUntilEvent} Days`} | ShubhSpace`,
    variables: {},
    fallbackHtml: EMAIL_TEMPLATES.BOOKING_REMINDER({
      ...data,
      bookingUrl,
    }),
  });
}

export async function sendCancellationEmail(data: {
  to: string;
  customerName: string;
  bookingNumber: string;
  venueName: string;
  refundAmount?: number;
  cancellationReason?: string;
}) {
  return sendTemplatedEmail({
    to: data.to,
    templateName: "BOOKING_CANCELLED",
    subject: `Booking Cancelled - #${data.bookingNumber} | ShubhSpace`,
    variables: {},
    fallbackHtml: EMAIL_TEMPLATES.BOOKING_CANCELLED(data),
  });
}

export async function sendWelcomeEmail(data: {
  to: string;
  name: string;
}) {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bookmyvenue-alpha.vercel.app"}/auth/signin`;
  
  return sendTemplatedEmail({
    to: data.to,
    templateName: "WELCOME",
    subject: "Welcome to ShubhSpace! 🎊",
    variables: {},
    fallbackHtml: EMAIL_TEMPLATES.WELCOME({
      name: data.name,
      loginUrl,
    }),
  });
}

export async function sendOwnerNewBookingEmail(data: {
  to: string;
  ownerName: string;
  venueName: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  eventDate: string;
  guestCount: number;
  totalAmount: number;
}) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bookmyvenue-alpha.vercel.app"}/owner`;
  
  return sendTemplatedEmail({
    to: data.to,
    templateName: "OWNER_NEW_BOOKING",
    subject: `New Booking - ${data.venueName} | ShubhSpace`,
    variables: {},
    fallbackHtml: EMAIL_TEMPLATES.OWNER_NEW_BOOKING({
      ...data,
      dashboardUrl,
    }),
  });
}

export async function sendOwnerPayoutEmail(data: {
  to: string;
  ownerName: string;
  amount: number;
  transactionId: string;
  payoutDate: string;
  bankLast4?: string;
}) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bookmyvenue-alpha.vercel.app"}/owner`;
  
  return sendTemplatedEmail({
    to: data.to,
    templateName: "OWNER_PAYOUT",
    subject: `Payout Processed - ₹${data.amount.toLocaleString("en-IN")} | ShubhSpace`,
    variables: {},
    fallbackHtml: EMAIL_TEMPLATES.OWNER_PAYOUT({
      ...data,
      dashboardUrl,
    }),
  });
}
