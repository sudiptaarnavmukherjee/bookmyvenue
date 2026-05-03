import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/menu-templates — list the 9 global pre-built templates
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const templates = await prisma.menuPackage.findMany({
    where: { isTemplate: true },
    orderBy: [{ tier: 'asc' }, { variant: 'asc' }],
  });

  return NextResponse.json(templates);
}
