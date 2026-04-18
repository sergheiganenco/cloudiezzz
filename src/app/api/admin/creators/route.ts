import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, requireRole } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!requireRole(user, 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const creators = await prisma.user.findMany({
    where: { role: 'creator', isActive: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ creators });
}
