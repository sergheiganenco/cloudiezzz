import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendAdminMessageAlert } from '@/lib/email';
import { sanitize } from '@/lib/sanitize';

// POST: the customer responds to a draft sent for review — either approves it
// (order → completed) or requests changes (order → revision, feedback saved as
// a message). Only valid while the order is in the "review" state.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  let body: { decision?: string; feedback?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { decision, feedback } = body;
  if (decision !== 'approve' && decision !== 'revision') {
    return NextResponse.json({ error: 'decision must be "approve" or "revision"' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { accessToken: token },
    select: { id: true, orderNumber: true, buyerName: true, status: true },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.status !== 'review') {
    return NextResponse.json(
      { error: 'This order is not awaiting your review right now.' },
      { status: 400 }
    );
  }

  const buyerName = order.buyerName || 'Customer';

  if (decision === 'revision') {
    const fb = typeof feedback === 'string' ? feedback.trim() : '';
    if (!fb) {
      return NextResponse.json({ error: 'Please describe the changes you would like.' }, { status: 400 });
    }
    if (fb.length > 2000) {
      return NextResponse.json({ error: 'Feedback is too long (max 2000 characters)' }, { status: 400 });
    }

    await prisma.order.update({ where: { id: order.id }, data: { status: 'revision' } });
    await prisma.orderStatusUpdate.create({
      data: {
        orderId: order.id,
        fromStatus: 'review',
        toStatus: 'revision',
        note: 'Customer requested changes',
      },
    });
    // Keep the feedback in the message thread so it's not lost.
    await prisma.orderMessage.create({
      data: {
        orderId: order.id,
        senderId: null,
        senderType: 'customer',
        content: sanitize(fb),
      },
    });

    sendAdminMessageAlert({
      orderNumber: order.orderNumber,
      buyerName,
      messagePreview: `Requested changes: ${fb.substring(0, 180)}`,
    }).catch((err: unknown) => console.error('Admin revision alert failed:', err));

    return NextResponse.json({ success: true, status: 'revision' });
  }

  // approve
  await prisma.order.update({ where: { id: order.id }, data: { status: 'completed' } });
  await prisma.orderStatusUpdate.create({
    data: {
      orderId: order.id,
      fromStatus: 'review',
      toStatus: 'completed',
      note: 'Customer approved the draft',
    },
  });

  sendAdminMessageAlert({
    orderNumber: order.orderNumber,
    buyerName,
    messagePreview: 'Approved the draft — ready to deliver the final.',
  }).catch((err: unknown) => console.error('Admin approval alert failed:', err));

  return NextResponse.json({ success: true, status: 'completed' });
}
