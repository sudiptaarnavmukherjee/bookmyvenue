import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/caterer/[id]/menu — fetch packages + category library for builder
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: catererId } = await params;

  // Verify access: admin OR the caterer's owner
  const caterer = await prisma.caterer.findUnique({
    where: { id: catererId },
    select: { id: true, ownerId: true, name: true, silverPrice: true, goldPrice: true, platinumPrice: true },
  });

  if (!caterer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = session.user.id === caterer.ownerId;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [packages, categories] = await Promise.all([
    prisma.menuPackage.findMany({
      where: { catererId },
      orderBy: [{ tier: "asc" }, { variant: "asc" }],
    }),
    prisma.menuCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, name: true, isVeg: true, isPopular: true },
        },
      },
    }),
  ]);

  return NextResponse.json({ caterer, packages, categories });
}

// POST /api/caterer/[id]/menu — create or overwrite all 3 packages at once
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: catererId } = await params;

  const caterer = await prisma.caterer.findUnique({
    where: { id: catererId },
    select: { id: true, ownerId: true },
  });

  if (!caterer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = session.user.id === caterer.ownerId;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { packages, prices } = await req.json();
  // packages: [{ tier, variant, name, description, pricePerPlate, items: Record<string,string[]> }]
  // prices: { silver, gold, platinum }

  if (!Array.isArray(packages)) {
    return NextResponse.json({ error: "packages array required" }, { status: 400 });
  }

  // Validate item counts per tier
  const TIER_LIMITS: Record<string, number> = { SILVER: 50, GOLD: 60, PLATINUM: 70 };
  for (const pkg of packages) {
    const items = pkg.items as Record<string, string[]>;
    const total = Object.values(items).reduce((s: number, arr: string[]) => s + arr.length, 0);
    const limit = TIER_LIMITS[pkg.tier];
    if (limit && total > limit) {
      return NextResponse.json(
        { error: `${pkg.tier} package exceeds ${limit} item limit (got ${total})` },
        { status: 400 }
      );
    }
  }

  // Use a transaction: delete old packages, insert new ones, update prices
  const results = await prisma.$transaction(async (tx) => {
    // Delete existing caterer packages
    await tx.menuPackage.deleteMany({ where: { catererId } });

    // Insert new
    const created = await Promise.all(
      packages.map((pkg: any) => {
        const items = pkg.items as Record<string, string[]>;
        const totalItems = Object.values(items).reduce((s: number, a: string[]) => s + a.length, 0);
        return tx.menuPackage.create({
          data: {
            catererId,
            tier: pkg.tier,
            variant: pkg.variant || "NON_VEG",
            name: pkg.name || `${pkg.tier} Package`,
            description: pkg.description || null,
            pricePerPlate: parseFloat(pkg.pricePerPlate) || 0,
            itemCount: totalItems,
            items: pkg.items,
            isTemplate: false,
          },
        });
      })
    );

    // Update caterer prices
    if (prices) {
      await tx.caterer.update({
        where: { id: catererId },
        data: {
          silverPrice: prices.silver ? parseFloat(prices.silver) : undefined,
          goldPrice: prices.gold ? parseFloat(prices.gold) : undefined,
          platinumPrice: prices.platinum ? parseFloat(prices.platinum) : undefined,
          minPlatePrice: prices.silver ? parseFloat(prices.silver) : undefined,
        },
      });
    }

    return created;
  });

  return NextResponse.json({ success: true, packages: results });
}

// PATCH /api/caterer/[id]/menu — update a single package's price only
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: catererId } = await params;
  const caterer = await prisma.caterer.findUnique({
    where: { id: catererId },
    select: { id: true, ownerId: true },
  });
  if (!caterer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = session.user.id === caterer.ownerId;
  if (!isAdmin && !isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { packageId, pricePerPlate } = await req.json();

  const updated = await prisma.menuPackage.update({
    where: { id: packageId },
    data: { pricePerPlate: parseFloat(pricePerPlate) },
  });

  // Also sync caterer tier price
  if (updated.tier === "SILVER") await prisma.caterer.update({ where: { id: catererId }, data: { silverPrice: updated.pricePerPlate, minPlatePrice: updated.pricePerPlate } });
  if (updated.tier === "GOLD") await prisma.caterer.update({ where: { id: catererId }, data: { goldPrice: updated.pricePerPlate } });
  if (updated.tier === "PLATINUM") await prisma.caterer.update({ where: { id: catererId }, data: { platinumPrice: updated.pricePerPlate } });

  return NextResponse.json({ success: true, package: updated });
}
