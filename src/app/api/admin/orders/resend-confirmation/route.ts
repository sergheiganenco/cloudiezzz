import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, requireRole } from '@/lib/auth';
import { sendOrderConfirmation } from '@/lib/email';

// POST: Re-send the original order-confirmation email to the customer
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

    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    await sendOrderConfirmation({
      buyerEmail: order.buyerEmail,
      buyerName: order.buyerName,
      orderNumber: order.orderNumber,
      accessToken: order.accessToken,
      packageId: order.packageId,
      totalPrice: order.totalPrice,
      recName: order.recName,
    });

    // Log it in status history
    await prisma.orderStatusUpdate.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: order.status,
        note: `Order confirmation email re-sent to ${order.buyerEmail}`,
        changedById: user!.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[RESEND CONFIRMATION FAILED] ${message}`);
    return NextResponse.json({ error: 'Failed to resend confirmation' }, { status: 500 });
  }
}
