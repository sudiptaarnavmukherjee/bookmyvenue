import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { PackageTier } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const { success: rateLimitOk, resetTime } = rateLimit(request, { windowMs: 60000, maxRequests: 5 });
    if (!rateLimitOk) return rateLimitResponse(resetTime);

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in to submit an inquiry" }, { status: 401 });
    }

    const body = await request.json();
    const { catererId, tier, guests, message, pricePerPlate, totalAmount, selectedItems } = body;

    if (!catererId || !tier || !guests || guests < 1) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate tier enum
    const validTiers: PackageTier[] = ["SILVER", "GOLD", "DIAMOND", "PLATINUM"];
    if (!validTiers.includes(tier as PackageTier)) {
      return NextResponse.json({ error: "Invalid package tier" }, { status: 400 });
    }

    // Verify caterer exists and is active
    const caterer = await prisma.caterer.findFirst({
      where: { id: catererId, isActive: true },
      select: { id: true, name: true },
    });

    if (!caterer) {
      return NextResponse.json({ error: "Caterer not found" }, { status: 404 });
    }

    // Build a booking number
    const bookingNumber = `CI${Date.now().toString().slice(-8)}`;

    // Selected items summary for specialRequests
    const itemsSummary = selectedItems
      ? Object.entries(selectedItems as Record<string, string[]>)
          .filter(([, items]) => (items as string[]).length > 0)
          .map(([cat, items]) => `${cat}: ${(items as string[]).join(", ")}`)
          .join(" | ")
      : "";

    const specialRequests = message
      ? `${message}${itemsSummary ? `\n\nItems: ${itemsSummary}` : ""}`
      : itemsSummary || undefined;

    // Get user phone (may be undefined, but field is required — use empty string fallback)
    const userWithPhone = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, phone: true },
    });

    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
        userId: user.id,
        catererId,
        type: "CATERING",
        status: "PENDING",
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // placeholder
        guestCount: Number(guests),
        selectedPackage: tier as PackageTier,
        totalAmount: Number(totalAmount) || 0,
        customerName: user.name || userWithPhone?.name || "",
        customerEmail: user.email || "",
        customerPhone: userWithPhone?.phone || "",
        ...(specialRequests ? { specialRequests } : {}),
      },
    });

    return NextResponse.json({ success: true, bookingId: booking.id, bookingNumber });
  } catch (error) {
    console.error("Catering inquiry error:", error);
    return NextResponse.json({ error: "Failed to submit inquiry" }, { status: 500 });
  }
}
