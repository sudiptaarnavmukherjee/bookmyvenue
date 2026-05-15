import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { createOptionsResponse, withApiSecurity } from "@/lib/security";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function formatIndianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

// POST /api/auth/send-phone-otp
export const POST = withApiSecurity(async (request: Request) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const phone: string = (body.phone || "").trim();

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const formatted = formatIndianPhone(phone);
    // Validate: must be a valid Indian mobile starting with 6-9
    if (!/^\+91[6-9]\d{9}$/.test(formatted)) {
      return NextResponse.json(
        { error: "Enter a valid 10-digit Indian mobile number" },
        { status: 400 }
      );
    }

    // Rate-limit: don't allow sending if last OTP was sent < 60s ago
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { phoneOtpExpiry: true, phoneVerified: true },
    });

    if (existingUser?.phoneVerified) {
      return NextResponse.json({ error: "Phone already verified" }, { status: 400 });
    }

    // Check if an OTP was sent recently (expiry is 10 min from send; 10min - 60s = 9min still remaining → within 1 min of send)
    if (existingUser?.phoneOtpExpiry) {
      const msUntilExpiry = existingUser.phoneOtpExpiry.getTime() - Date.now();
      const msForNewOtp = 9 * 60 * 1000; // can resend after 1 min (expiry starts at 10min)
      if (msUntilExpiry > msForNewOtp) {
        return NextResponse.json(
          { error: "Please wait 60 seconds before requesting a new OTP" },
          { status: 429 }
        );
      }
    }

    const otp = generateOtp();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to user record (also save the phone being verified)
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        phone: phone, // save entered phone
        phoneOtpCode: otp,
        phoneOtpExpiry: expiry,
        phoneVerified: null, // clear any earlier verification
      },
    });

    // Send OTP via SMS
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    const message = `Your BookMyVenue verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;

    if (accountSid && authToken && fromNumber) {
      const twilioRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: formatted,
            From: fromNumber,
            Body: message,
          }),
        }
      );
      if (!twilioRes.ok) {
        const err = await twilioRes.json();
        console.error("Twilio error:", err);
        return NextResponse.json(
          { error: "Failed to send SMS. Please try again." },
          { status: 502 }
        );
      }
    } else {
      // Dev mode: log OTP to console (no SMS)
      console.log(`[DEV] Phone OTP for ${formatted}: ${otp}`);
    }

    return NextResponse.json({
      success: true,
      dev: !accountSid, // let client know it's dev mode
      message: accountSid
        ? `OTP sent to ${formatted.replace(/\d(?=\d{4})/, "*")}`
        : `[DEV MODE] OTP logged to server console`,
    });
  } catch (error) {
    console.error("send-phone-otp error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}, {
  methods: ["POST", "OPTIONS"],
  rateLimitConfig: { windowMs: 10 * 60 * 1000, maxRequests: 5 },
});

export function OPTIONS(request: Request) {
  return createOptionsResponse(request, ["POST", "OPTIONS"]);
}
