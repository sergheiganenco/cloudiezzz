import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const order = await prisma.order.findUnique({
    where: { accessToken: token },
    select: { id: true },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const result = await prisma.orderMessage.updateMany({
    where: {
      orderId: order.id,
      senderType: { not: 'customer' },
      isRead: false,
    },
    data: { isRead: true },
  });

  return NextResponse.json({ updated: result.count });
}
