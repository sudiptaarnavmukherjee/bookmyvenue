import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// ── PATCH /api/admin/caterers/[id] ───────────────────────────────────────────
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

    const caterer = await prisma.caterer.findFirst({ where: { id, isActive: true } });
    if (!caterer) {
      return NextResponse.json({ error: "Caterer not found" }, { status: 404 });
    }

    const {
      name, description, city, area, address, pincode,
      latitude, longitude,
      minPlatePrice, silverPrice, goldPrice, platinumPrice,
      contactName, contactNumber,
      cuisines, isPureVeg,
      images,
    } = body;

    const imageList: string[] = Array.isArray(images) ? images : (images || "").split(",").map((s: string) => s.trim()).filter(Boolean);

    const updated = await prisma.caterer.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(city !== undefined && { city }),
        ...(area !== undefined && { area }),
        ...(address !== undefined && { address }),
        ...(pincode !== undefined && { pincode }),
        ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : undefined }),
        ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : undefined }),
        ...(minPlatePrice !== undefined && minPlatePrice !== null && minPlatePrice !== "" && { minPlatePrice: parseFloat(minPlatePrice) }),
        ...(silverPrice !== undefined && silverPrice !== null && silverPrice !== "" && { silverPrice: parseFloat(silverPrice) }),
        ...(goldPrice !== undefined && goldPrice !== null && goldPrice !== "" && { goldPrice: parseFloat(goldPrice) }),
        ...(platinumPrice !== undefined && platinumPrice !== null && platinumPrice !== "" && { platinumPrice: parseFloat(platinumPrice) }),
        ...(contactName !== undefined && { contactName }),
        ...(contactNumber !== undefined && { contactNumber }),
        ...(cuisines !== undefined && { cuisines }),
        ...(isPureVeg !== undefined && { isPureVeg: Boolean(isPureVeg) }),
        ...(imageList.length > 0 && {
          images: imageList.join(","),
          coverImage: imageList[0],
        }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, caterer: updated });
  } catch (error) {
    console.error("Error updating caterer:", error);
    return NextResponse.json({ error: "Failed to update caterer" }, { status: 500 });
  }
}

// ── DELETE /api/admin/caterers/[id] ───────────────────────────────────────────
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

    const caterer = await prisma.caterer.findFirst({ where: { id, isActive: true } });
    if (!caterer) {
      return NextResponse.json({ error: "Caterer not found" }, { status: 404 });
    }

    // Soft-delete to preserve booking history
    await prisma.caterer.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting caterer:", error);
    return NextResponse.json({ error: "Failed to delete caterer" }, { status: 500 });
  }
}
