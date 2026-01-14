import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const caterer = await prisma.caterer.findUnique({
      where: {
        id: params.id,
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
  { params }: { params: { id: string } }
) {
  try {
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
  { params }: { params: { id: string } }
) {
  try {
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
