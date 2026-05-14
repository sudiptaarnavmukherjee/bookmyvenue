import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { normalizeGoogleMapsUrl, parseGoogleMapsUrl } from "@/lib/utils";

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

    const normalizedGoogleMapsUrl = googleMapsUrl !== undefined ? normalizeGoogleMapsUrl(googleMapsUrl) : undefined;
    if (googleMapsUrl && !normalizedGoogleMapsUrl) {
      return NextResponse.json(
        { error: "Invalid maps URL. Use a valid https://maps.google.com, https://maps.app.goo.gl, or https://maps.olacabs.com link." },
        { status: 400 }
      );
    }

    const parsedMinGuests = minGuests !== undefined ? Number(minGuests) : undefined;
    const parsedMaxGuests = maxGuests !== undefined ? Number(maxGuests) : undefined;
    const effectiveMinGuests = parsedMinGuests ?? venue.minGuests;
    const effectiveMaxGuests = parsedMaxGuests ?? venue.maxGuests;
    if (
      !Number.isFinite(effectiveMinGuests) ||
      !Number.isFinite(effectiveMaxGuests) ||
      effectiveMinGuests <= 0 ||
      effectiveMaxGuests <= 0 ||
      effectiveMinGuests > effectiveMaxGuests
    ) {
      return NextResponse.json(
        { error: "Guest capacity is invalid. Ensure min guests is less than or equal to max guests." },
        { status: 400 }
      );
    }

    const parsedEstimatedMinPrice = estimatedMinPrice !== undefined && estimatedMinPrice !== null && estimatedMinPrice !== ""
      ? Number(estimatedMinPrice)
      : estimatedMinPrice === "" ? null : undefined;
    const parsedEstimatedMaxPrice = estimatedMaxPrice !== undefined && estimatedMaxPrice !== null && estimatedMaxPrice !== ""
      ? Number(estimatedMaxPrice)
      : estimatedMaxPrice === "" ? null : undefined;

    const effectiveEstimatedMinPrice = parsedEstimatedMinPrice !== undefined ? parsedEstimatedMinPrice : venue.estimatedMinPrice;
    const effectiveEstimatedMaxPrice = parsedEstimatedMaxPrice !== undefined ? parsedEstimatedMaxPrice : venue.estimatedMaxPrice;
    if (
      effectiveEstimatedMinPrice !== null &&
      effectiveEstimatedMinPrice !== undefined &&
      effectiveEstimatedMaxPrice !== null &&
      effectiveEstimatedMaxPrice !== undefined &&
      effectiveEstimatedMinPrice > effectiveEstimatedMaxPrice
    ) {
      return NextResponse.json(
        { error: "Estimated price range is invalid. Min estimate must be less than or equal to max estimate." },
        { status: 400 }
      );
    }

    const fallbackCoords = normalizedGoogleMapsUrl ? parseGoogleMapsUrl(normalizedGoogleMapsUrl) : null;
    const parsedLatitude = latitude !== undefined
      ? (latitude ? parseFloat(latitude) : null)
      : (fallbackCoords?.latitude ?? undefined);
    const parsedLongitude = longitude !== undefined
      ? (longitude ? parseFloat(longitude) : null)
      : (fallbackCoords?.longitude ?? undefined);

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
        ...(parsedLatitude !== undefined && { latitude: parsedLatitude }),
        ...(parsedLongitude !== undefined && { longitude: parsedLongitude }),
        ...(googleMapsUrl !== undefined && { googleMapsUrl: normalizedGoogleMapsUrl || null }),
        ...(parsedMinGuests !== undefined && { minGuests: parsedMinGuests }),
        ...(parsedMaxGuests !== undefined && { maxGuests: parsedMaxGuests }),
        ...(priceMode !== undefined && { priceMode }),
        ...(exactPrice !== undefined && { exactPrice: exactPrice ? parseFloat(exactPrice) : null }),
        ...(parsedEstimatedMinPrice !== undefined && { estimatedMinPrice: parsedEstimatedMinPrice }),
        ...(parsedEstimatedMaxPrice !== undefined && { estimatedMaxPrice: parsedEstimatedMaxPrice }),
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
