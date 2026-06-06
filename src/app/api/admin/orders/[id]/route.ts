import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { getSessionUser, requireRole } from '@/lib/auth';
import { sendStatusUpdate, sendDeliveryEmail, sendCreatorAssignment } from '@/lib/email';

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
    include: {
      customer: true,
      creator: { select: { id: true, name: true, email: true } },
      statusUpdates: { orderBy: { createdAt: 'desc' } },
      messages: { orderBy: { createdAt: 'asc' } },
      files: { orderBy: { createdAt: 'desc' } },
      review: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({ order });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!requireRole(user, 'admin', 'creator')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status, creatorId, note } = body;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Issue a real Stripe refund when an order is moved into "refunded".
  // We only let the status flip to refunded if the money actually moves (or
  // there was no Stripe charge to begin with), so the order never claims a
  // refund that didn't happen.
  if (status === 'refunded' && order.status !== 'refunded') {
    if (order.stripePaymentId) {
      if (!stripe) {
        return NextResponse.json(
          { error: 'Stripe is not configured — cannot issue refund.' },
          { status: 500 }
        );
      }
      try {
        await stripe.refunds.create({ payment_intent: order.stripePaymentId });
        console.log(
          `[REFUND] Order ${order.orderNumber} refunded via Stripe (${order.stripePaymentId})`
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(
          `[REFUND FAILED] Order ${order.orderNumber} (${order.stripePaymentId}): ${message}`
        );
        return NextResponse.json({ error: `Refund failed: ${message}` }, { status: 502 });
      }
    } else {
      // Paid manually / no Stripe charge on file — nothing to refund through Stripe.
      console.warn(
        `[REFUND] Order ${order.orderNumber} marked refunded with no Stripe payment on file — no money moved.`
      );
    }
  }

  const updates: Record<string, unknown> = {};
  if (status && status !== order.status) {
    updates.status = status;
    if (status === 'refunded') {
      updates.paymentStatus = 'refunded';
    }

    await prisma.orderStatusUpdate.create({
      data: {
        orderId: id,
        fromStatus: order.status,
        toStatus: status,
        note: note || `Status changed to ${status}`,
        changedById: user!.id,
      },
    });

    if (status === 'delivered') {
      updates.deliveredAt = new Date();
      // Send delivery email
      sendDeliveryEmail({
        buyerEmail: order.buyerEmail,
        buyerName: order.buyerName,
        orderNumber: order.orderNumber,
        accessToken: order.accessToken,
        recName: order.recName,
        giftPageSlug: order.giftPageSlug,
      }).catch((err: unknown) => console.error('Delivery email failed:', err));
    } else {
      // Send status update email
      sendStatusUpdate({
        buyerEmail: order.buyerEmail,
        buyerName: order.buyerName,
        orderNumber: order.orderNumber,
        accessToken: order.accessToken,
        newStatus: status,
        note: note || undefined,
      }).catch((err: unknown) => console.error('Status email failed:', err));
    }
  }

  if (creatorId !== undefined) {
    updates.creatorId = creatorId || null;
  }

  const updated = await prisma.order.update({
    where: { id },
    data: updates,
    include: {
      customer: true,
      creator: { select: { id: true, name: true, email: true } },
    },
  });

  // Send creator assignment email when a new creator is assigned
  if (creatorId && creatorId !== order.creatorId && updated.creator) {
    sendCreatorAssignment({
      creatorEmail: updated.creator.email,
      creatorName: updated.creator.name,
      orderNumber: order.orderNumber,
      packageId: order.packageId,
      mood: order.mood,
      genres: order.genres,
    }).catch((err: unknown) => console.error('Creator assignment email failed:', err));
  }

  return NextResponse.json({ order: updated });
}
