import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// POST /api/auth/verify-phone-otp
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const otp: string = (body.otp || "").trim();

    if (!otp || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: "Enter a valid 6-digit OTP" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        phoneOtpCode: true,
        phoneOtpExpiry: true,
        phone: true,
        phoneVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.phoneVerified) {
      return NextResponse.json({ error: "Phone already verified" }, { status: 400 });
    }

    if (!user.phoneOtpCode || !user.phoneOtpExpiry) {
      return NextResponse.json(
        { error: "No OTP found. Please request a new one." },
        { status: 400 }
      );
    }

    if (new Date() > user.phoneOtpExpiry) {
      // Clear expired OTP
      await prisma.user.update({
        where: { id: session.user.id },
        data: { phoneOtpCode: null, phoneOtpExpiry: null },
      });
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (user.phoneOtpCode !== otp) {
      return NextResponse.json(
        { error: "Incorrect OTP. Please try again." },
        { status: 400 }
      );
    }

    // OTP is correct and not expired — mark phone as verified
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        phoneVerified: new Date(),
        phoneOtpCode: null,
        phoneOtpExpiry: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Phone number verified successfully!",
    });
  } catch (error) {
    console.error("verify-phone-otp error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
