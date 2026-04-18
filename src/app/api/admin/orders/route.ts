import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!requireRole(user, 'admin', 'creator')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status && status !== 'all') {
    where.status = status;
  }
  // Creators only see their assigned orders
  if (user!.role === 'creator') {
    where.creatorId = user!.id;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        customer: { select: { name: true, email: true } },
        creator: { select: { name: true, email: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({
    orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
