import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, requireRole } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!requireRole(user, 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [
    totalOrders,
    pendingOrders,
    paidOrders,
    inProgressOrders,
    completedOrders,
    totalCustomers,
    totalRevenue,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'pending' } }),
    prisma.order.count({ where: { status: 'paid' } }),
    prisma.order.count({ where: { status: 'in_progress' } }),
    prisma.order.count({ where: { status: { in: ['completed', 'delivered'] } } }),
    prisma.customer.count(),
    prisma.order.aggregate({
      _sum: { totalPrice: true },
      where: { paymentStatus: 'paid' },
    }),
  ]);

  return NextResponse.json({
    totalOrders,
    pendingOrders,
    paidOrders,
    inProgressOrders,
    completedOrders,
    totalCustomers,
    totalRevenue: totalRevenue._sum.totalPrice || 0,
  });
}
