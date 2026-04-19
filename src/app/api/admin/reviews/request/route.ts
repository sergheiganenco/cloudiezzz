import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, requireRole } from '@/lib/auth';
import { sendReviewRequest } from '@/lib/email';

// POST: Send a review request email to the customer
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!requireRole(user, 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { review: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!['completed', 'delivered'].includes(order.status)) {
      return NextResponse.json({ error: 'Order must be completed or delivered' }, { status: 400 });
    }

    if (order.review) {
      return NextResponse.json({ error: 'Review already submitted for this order' }, { status: 400 });
    }

    await sendReviewRequest({
      buyerEmail: order.buyerEmail,
      buyerName: order.buyerName,
      orderNumber: order.orderNumber,
      accessToken: order.accessToken,
      recName: order.recName,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to send review request' }, { status: 500 });
  }
}
