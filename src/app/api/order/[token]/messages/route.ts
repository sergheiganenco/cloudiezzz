import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendAdminMessageAlert } from '@/lib/email';
import { sanitize } from '@/lib/sanitize';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const order = await prisma.order.findUnique({
    where: { accessToken: token },
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
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await request.json();
  const { content } = body;

  if (!content || typeof content !== 'string') {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
  }
  if (trimmed.length > 2000) {
    return NextResponse.json({ error: 'Message is too long (max 2000 characters)' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { accessToken: token },
    select: { id: true, orderNumber: true, buyerName: true },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const message = await prisma.orderMessage.create({
    data: {
      orderId: order.id,
      senderId: null,
      senderType: 'customer',
      content: sanitize(trimmed),
    },
  });

  // Notify admin about the new customer message (fire and forget)
  sendAdminMessageAlert({
    orderNumber: order.orderNumber,
    buyerName: order.buyerName || 'Customer',
    messagePreview: trimmed.substring(0, 200),
  }).catch((err: unknown) => console.error('Admin message alert failed:', err));

  return NextResponse.json({ message }, { status: 201 });
}
