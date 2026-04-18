import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { sendPaymentConfirmation } from '@/lib/email';

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (order && order.paymentStatus !== 'paid') {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'paid',
            status: 'paid',
            stripePaymentId: session.payment_intent as string,
          },
        });

        await prisma.orderStatusUpdate.create({
          data: {
            orderId,
            fromStatus: order.status,
            toStatus: 'paid',
            note: `Payment received via Stripe (${session.payment_intent})`,
          },
        });

        console.log(`Order ${order.orderNumber} paid via Stripe`);

        // Send payment confirmation email (fire and forget)
        const paidOrder = await prisma.order.findUnique({
          where: { id: orderId },
          select: { buyerEmail: true, buyerName: true, orderNumber: true, accessToken: true, totalPrice: true },
        });

        if (paidOrder) {
          sendPaymentConfirmation({
            buyerEmail: paidOrder.buyerEmail,
            buyerName: paidOrder.buyerName,
            orderNumber: paidOrder.orderNumber,
            accessToken: paidOrder.accessToken,
            totalPrice: paidOrder.totalPrice,
          }).catch((err) => console.error('Payment confirmation email failed:', err));
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
