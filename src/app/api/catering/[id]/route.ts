import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: Request,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const params = await segmentData.params;
    const idOrSlug = params.id;

    // Try to find by ID first, then by slug
    let caterer = await prisma.caterer.findUnique({
      where: {
        id: idOrSlug,
      },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        packages: {
          orderBy: {
            pricePerPlate: "asc",
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    // If not found by ID, try by slug
    if (!caterer) {
      caterer = await prisma.caterer.findUnique({
        where: {
          slug: idOrSlug,
        },
        include: {
          owner: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
          packages: {
            orderBy: {
              pricePerPlate: "asc",
            },
          },
          reviews: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });
    }

    if (!caterer) {
      return NextResponse.json(
        { error: "Caterer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ caterer });
  } catch (error) {
    console.error("Error fetching caterer:", error);
    return NextResponse.json(
      { error: "Failed to fetch caterer" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const params = await segmentData.params;
    const body = await request.json();
    
    const caterer = await prisma.caterer.update({
      where: {
        id: params.id,
      },
      data: body,
    });

    return NextResponse.json({ caterer });
  } catch (error) {
    console.error("Error updating caterer:", error);
    return NextResponse.json(
      { error: "Failed to update caterer" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const params = await segmentData.params;

    await prisma.caterer.update({
      where: {
        id: params.id,
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({ message: "Caterer deleted successfully" });
  } catch (error) {
    console.error("Error deleting caterer:", error);
    return NextResponse.json(
      { error: "Failed to delete caterer" },
      { status: 500 }
    );
  }
}
