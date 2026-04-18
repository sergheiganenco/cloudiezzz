import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, requireRole } from '@/lib/auth';
import { sendMessageNotification } from '@/lib/email';
import { sanitize } from '@/lib/sanitize';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!requireRole(user, 'admin', 'creator')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({ messages: order.messages });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!requireRole(user, 'admin', 'creator')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { content } = body;

  if (!content || typeof content !== 'string') {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      buyerEmail: true,
      buyerName: true,
      orderNumber: true,
      accessToken: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const message = await prisma.orderMessage.create({
    data: {
      orderId: order.id,
      senderId: user!.id,
      senderType: user!.role,
      content: sanitize(content),
    },
  });

  // Notify customer about the new message (fire and forget)
  sendMessageNotification({
    buyerEmail: order.buyerEmail,
    buyerName: order.buyerName || 'there',
    orderNumber: order.orderNumber,
    accessToken: order.accessToken,
    messagePreview: content,
  }).catch((err: unknown) => console.error('Message notification email failed:', err));

  return NextResponse.json({ message }, { status: 201 });
}
