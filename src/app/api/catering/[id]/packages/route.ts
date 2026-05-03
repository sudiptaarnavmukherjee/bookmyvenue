import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PackageTier, MenuVariant } from '@prisma/client';

const VALID_TIERS = Object.values(PackageTier);
const VALID_VARIANTS = Object.values(MenuVariant);

// GET /api/catering/[id]/packages — list packages for a caterer
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const packages = await prisma.menuPackage.findMany({
    where: { catererId: id, isTemplate: false },
    orderBy: [{ tier: 'asc' }, { variant: 'asc' }],
  });

  return NextResponse.json(packages);
}

// POST /api/catering/[id]/packages — create a new package for this caterer
// Body: { tier, variant, name, description, pricePerPlate, itemCount, items, fromTemplateId? }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Allow caterer owner or admin
  const caterer = await prisma.caterer.findUnique({ where: { id }, select: { ownerId: true } });
  if (!caterer) {
    return NextResponse.json({ error: 'Caterer not found' }, { status: 404 });
  }
  if (session.user.role !== 'ADMIN' && caterer.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { tier, variant, name, description, pricePerPlate, itemCount, items, fromTemplateId } = body;

  // If cloning from a template
  if (fromTemplateId) {
    const template = await prisma.menuPackage.findUnique({
      where: { id: fromTemplateId, isTemplate: true },
    });
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    const cloned = await prisma.menuPackage.create({
      data: {
        tier: template.tier,
        variant: template.variant,
        name: template.name,
        description: template.description,
        pricePerPlate: pricePerPlate ?? template.pricePerPlate,
        itemCount: template.itemCount,
        items: template.items as object,
        catererId: id,
        isTemplate: false,
      },
    });
    return NextResponse.json(cloned, { status: 201 });
  }

  // Creating from scratch
  if (!tier || !VALID_TIERS.includes(tier)) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
  }
  if (!variant || !VALID_VARIANTS.includes(variant)) {
    return NextResponse.json({ error: 'Invalid variant' }, { status: 400 });
  }
  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  if (typeof pricePerPlate !== 'number' || pricePerPlate <= 0) {
    return NextResponse.json({ error: 'Invalid pricePerPlate' }, { status: 400 });
  }

  const pkg = await prisma.menuPackage.create({
    data: {
      tier,
      variant,
      name: name.trim(),
      description: description?.trim() || null,
      pricePerPlate,
      itemCount: typeof itemCount === 'number' ? itemCount : 0,
      items: items ?? {},
      catererId: id,
      isTemplate: false,
    },
  });

  return NextResponse.json(pkg, { status: 201 });
}

// PATCH /api/catering/[id]/packages — update a package
// Body: { packageId, pricePerPlate?, name?, description?, items?, itemCount? }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const caterer = await prisma.caterer.findUnique({ where: { id }, select: { ownerId: true } });
  if (!caterer) {
    return NextResponse.json({ error: 'Caterer not found' }, { status: 404 });
  }
  if (session.user.role !== 'ADMIN' && caterer.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { packageId, pricePerPlate, name, description, items, itemCount } = await req.json();

  if (!packageId) {
    return NextResponse.json({ error: 'packageId is required' }, { status: 400 });
  }

  const updated = await prisma.menuPackage.update({
    where: { id: packageId, catererId: id },
    data: {
      ...(typeof pricePerPlate === 'number' && { pricePerPlate }),
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(items !== undefined && { items }),
      ...(typeof itemCount === 'number' && { itemCount }),
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/catering/[id]/packages?packageId=xxx
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const caterer = await prisma.caterer.findUnique({ where: { id }, select: { ownerId: true } });
  if (!caterer) {
    return NextResponse.json({ error: 'Caterer not found' }, { status: 404 });
  }
  if (session.user.role !== 'ADMIN' && caterer.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const packageId = new URL(req.url).searchParams.get('packageId');
  if (!packageId) {
    return NextResponse.json({ error: 'packageId is required' }, { status: 400 });
  }

  await prisma.menuPackage.delete({ where: { id: packageId, catererId: id } });

  return NextResponse.json({ success: true });
}
