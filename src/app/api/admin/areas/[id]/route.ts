import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// PUT - Update area
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: areaId } = await params;
    const body = await request.json();
    const { name, city, state, pincode, isPopular, priority } = body;

    const area = await prisma.area.update({
      where: { id: areaId },
      data: {
        name,
        city,
        state,
        pincode: pincode || null,
        isPopular,
        priority,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Area updated successfully",
      area,
    });
  } catch (error) {
    console.error("Error updating area:", error);
    return NextResponse.json(
      { error: "Failed to update area" },
      { status: 500 }
    );
  }
}

// DELETE - Delete area
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: areaId } = await params;

    await prisma.area.delete({
      where: { id: areaId },
    });

    return NextResponse.json({
      success: true,
      message: "Area deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting area:", error);
    return NextResponse.json(
      { error: "Failed to delete area" },
      { status: 500 }
    );
  }
}
