import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET areas for public use (filtering on venue/catering pages)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const popularOnly = searchParams.get("popular") === "true";

    const where: any = {};
    
    if (city) {
      where.city = city;
    }
    
    if (popularOnly) {
      where.isPopular = true;
    }

    const areas = await prisma.area.findMany({
      where,
      select: {
        id: true,
        name: true,
        city: true,
        isPopular: true,
        priority: true,
        venueCount: true,
        catererCount: true,
      },
      orderBy: [
        { priority: "desc" },
        { isPopular: "desc" },
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
