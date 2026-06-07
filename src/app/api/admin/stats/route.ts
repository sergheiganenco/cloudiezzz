import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, requireRole } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!requireRole(user, 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalOrders,
    pendingOrders,
    paidOrders,
    inProgressOrders,
    completedOrders,
    totalCustomers,
    totalRevenue,
    revenueToday,
    revenueWeek,
    revenueMonth,
    recentPaidOrders,
    unpaidOrders,
    reviewOrders,
    deliveredOrders,
    cancelledOrders,
    refundedOrders,
    revisionOrders,
    awaitingList,
    reviewList,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'pending' } }),
    prisma.order.count({ where: { status: 'paid' } }),
    prisma.order.count({ where: { status: 'in_progress' } }),
    prisma.order.count({ where: { status: 'completed' } }),
    prisma.customer.count(),
    prisma.order.aggregate({
      _sum: { totalPrice: true },
      where: { paymentStatus: 'paid' },
    }),
    prisma.order.aggregate({
      _sum: { totalPrice: true },
      where: { paymentStatus: 'paid', createdAt: { gte: todayStart } },
    }),
    prisma.order.aggregate({
      _sum: { totalPrice: true },
      where: { paymentStatus: 'paid', createdAt: { gte: weekStart } },
    }),
    prisma.order.aggregate({
      _sum: { totalPrice: true },
      where: { paymentStatus: 'paid', createdAt: { gte: monthStart } },
    }),
    // Get all paid orders for chart data (last 12 weeks)
    prisma.order.findMany({
      where: {
        paymentStatus: 'paid',
        createdAt: { gte: new Date(now.getTime() - 84 * 24 * 60 * 60 * 1000) }, // 12 weeks
      },
      select: { totalPrice: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.order.count({ where: { paymentStatus: 'unpaid', NOT: { status: 'cancelled' } } }),
    prisma.order.count({ where: { status: 'review' } }),
    prisma.order.count({ where: { status: 'delivered' } }),
    prisma.order.count({ where: { status: 'cancelled' } }),
    prisma.order.count({ where: { status: 'refunded' } }),
    prisma.order.count({ where: { status: 'revision' } }),
    prisma.order.findMany({
      where: { paymentStatus: 'unpaid', NOT: { status: 'cancelled' } },
      select: { orderNumber: true, buyerName: true },
      take: 25,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.findMany({
      where: { status: 'review' },
      select: { orderNumber: true, buyerName: true },
      take: 25,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Build weekly chart data (last 12 weeks)
  const chartData: { week: string; revenue: number; orders: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const wStart = new Date(todayStart);
    wStart.setDate(wStart.getDate() - wStart.getDay() - i * 7);
    const wEnd = new Date(wStart);
    wEnd.setDate(wEnd.getDate() + 7);

    const weekOrders = recentPaidOrders.filter((o: any) => {
      const d = new Date(o.createdAt);
      return d >= wStart && d < wEnd;
    });

    const label = `${wStart.getMonth() + 1}/${wStart.getDate()}`;
    chartData.push({
      week: label,
      revenue: weekOrders.reduce((sum: number, o: any) => sum + o.totalPrice, 0) / 100,
      orders: weekOrders.length,
    });
  }

  return NextResponse.json({
    totalOrders,
    pendingOrders,
    paidOrders,
    inProgressOrders,
    completedOrders,
    totalCustomers,
    totalRevenue: totalRevenue._sum.totalPrice || 0,
    revenueToday: revenueToday._sum.totalPrice || 0,
    revenueWeek: revenueWeek._sum.totalPrice || 0,
    revenueMonth: revenueMonth._sum.totalPrice || 0,
    unpaidOrders,
    reviewOrders,
    deliveredOrders,
    cancelledOrders,
    refundedOrders,
    revisionOrders,
    awaitingList: awaitingList.map((o: { orderNumber: string; buyerName: string }) => ({ orderNumber: o.orderNumber, name: o.buyerName })),
    reviewList: reviewList.map((o: { orderNumber: string; buyerName: string }) => ({ orderNumber: o.orderNumber, name: o.buyerName })),
    chartData,
  });
}
