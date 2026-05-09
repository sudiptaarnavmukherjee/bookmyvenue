import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// ── PATCH /api/admin/venues/[id] ─────────────────────────────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const venue = await prisma.venue.findFirst({
      where: { id, deletedAt: null },
    });
    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    const {
      name, description, venueType, city, area, address, pincode,
      latitude, longitude, googleMapsUrl,
      minGuests, maxGuests,
      estimatedMinPrice, estimatedMaxPrice,
      marriagePrice, birthdayPrice, otherEventPrice,
      exactPrice, priceMode,
      contactName, contactNumber,
      images, amenities,
    } = body;

    const imageList: string[] = Array.isArray(images) ? images : (images || "").split(",").map((s: string) => s.trim()).filter(Boolean);

    const updated = await prisma.venue.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(venueType !== undefined && { venueType }),
        ...(city !== undefined && { city }),
        ...(area !== undefined && { area }),
        ...(address !== undefined && { address }),
        ...(pincode !== undefined && { pincode }),
        ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
        ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
        ...(googleMapsUrl !== undefined && { googleMapsUrl: googleMapsUrl || null }),
        ...(minGuests !== undefined && { minGuests: parseInt(minGuests) }),
        ...(maxGuests !== undefined && { maxGuests: parseInt(maxGuests) }),
        ...(priceMode !== undefined && { priceMode }),
        ...(exactPrice !== undefined && { exactPrice: exactPrice ? parseFloat(exactPrice) : null }),
        ...(estimatedMinPrice !== undefined && { estimatedMinPrice: estimatedMinPrice ? parseFloat(estimatedMinPrice) : null }),
        ...(estimatedMaxPrice !== undefined && { estimatedMaxPrice: estimatedMaxPrice ? parseFloat(estimatedMaxPrice) : null }),
        ...(marriagePrice !== undefined && { marriagePrice: marriagePrice ? parseFloat(marriagePrice) : null }),
        ...(birthdayPrice !== undefined && { birthdayPrice: birthdayPrice ? parseFloat(birthdayPrice) : null }),
        ...(otherEventPrice !== undefined && { otherEventPrice: otherEventPrice ? parseFloat(otherEventPrice) : null }),
        ...(contactName !== undefined && { contactName }),
        ...(contactNumber !== undefined && { contactNumber }),
        ...(imageList.length > 0 && {
          images: imageList.join(","),
          coverImage: imageList[0],
        }),
        ...(amenities !== undefined && {
          amenities: Array.isArray(amenities) ? amenities.join(",") : amenities,
        }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, venue: updated });
  } catch (error) {
    console.error("Error updating venue:", error);
    return NextResponse.json({ error: "Failed to update venue" }, { status: 500 });
  }
}

// ── DELETE /api/admin/venues/[id] ─────────────────────────────────────────────
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const venue = await prisma.venue.findFirst({
      where: { id, deletedAt: null },
    });
    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Soft-delete: preserves bookings/reviews/audit trail
    await prisma.venue.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting venue:", error);
    return NextResponse.json({ error: "Failed to delete venue" }, { status: 500 });
  }
}
