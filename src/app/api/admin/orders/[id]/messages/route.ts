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

  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
  }
  if (trimmed.length > 2000) {
    return NextResponse.json({ error: 'Message is too long (max 2000 characters)' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      buyerEmail: true,
      buyerName: true,
      orderNumber: true,
      accessToken: true,
      creatorId: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Creators may only message on orders assigned to them
  if (user!.role === 'creator' && order.creatorId !== user!.id) {
    return NextResponse.json({ error: 'You are not assigned to this order' }, { status: 403 });
  }

  const message = await prisma.orderMessage.create({
    data: {
      orderId: order.id,
      senderId: user!.id,
      senderType: user!.role,
      content: sanitize(trimmed),
    },
  });

  // Notify customer about the new message (fire and forget)
  sendMessageNotification({
    buyerEmail: order.buyerEmail,
    buyerName: order.buyerName || 'there',
    orderNumber: order.orderNumber,
    accessToken: order.accessToken,
    messagePreview: trimmed,
  }).catch((err: unknown) => console.error('Message notification email failed:', err));

  return NextResponse.json({ message }, { status: 201 });
}
