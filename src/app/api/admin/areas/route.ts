import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// GET all areas
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const areas = await prisma.area.findMany({
      orderBy: [
        { priority: "desc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json({ success: true, areas });
  } catch (error) {
    console.error("Error fetching areas:", error);
    return NextResponse.json(
      { error: "Failed to fetch areas" },
      { status: 500 }
    );
  }
}

// POST - Create new area
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, city, state, pincode, isPopular, priority } = body;

    if (!name || !city) {
      return NextResponse.json(
        { error: "Name and city are required" },
        { status: 400 }
      );
    }

    // Check if area already exists
    const existing = await prisma.area.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Area with this name already exists" },
        { status: 400 }
      );
    }

    const area = await prisma.area.create({
      data: {
        name,
        city,
        state: state || "West Bengal",
        pincode: pincode || null,
        isPopular: isPopular || false,
        priority: priority || 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Area created successfully",
      area,
    });
  } catch (error) {
    console.error("Error creating area:", error);
    return NextResponse.json(
      { error: "Failed to create area" },
      { status: 500 }
    );
  }
}
