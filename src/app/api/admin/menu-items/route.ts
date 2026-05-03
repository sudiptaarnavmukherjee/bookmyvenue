import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/menu-items?categoryId=xxx — list items in a category (or all)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('categoryId');

  const items = await prisma.menuItemTemplate.findMany({
    where: categoryId ? { categoryId } : undefined,
    orderBy: [{ categoryId: 'asc' }, { sortOrder: 'asc' }],
    include: { category: { select: { name: true, icon: true } } },
  });

  return NextResponse.json(items);
}

// POST /api/admin/menu-items — add a new item template
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, categoryId, isVeg, isPopular, description, sortOrder } = await req.json();

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  if (!categoryId || typeof categoryId !== 'string') {
    return NextResponse.json({ error: 'categoryId is required' }, { status: 400 });
  }

  const item = await prisma.menuItemTemplate.create({
    data: {
      name: name.trim(),
      categoryId,
      isVeg: isVeg !== false,
      isPopular: isPopular === true,
      description: description?.trim() || null,
      sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
    },
    include: { category: { select: { name: true, icon: true } } },
  });

  return NextResponse.json(item, { status: 201 });
}

// DELETE /api/admin/menu-items?id=xxx — remove an item template
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  await prisma.menuItemTemplate.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
