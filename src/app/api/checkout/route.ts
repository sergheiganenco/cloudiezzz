import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { centsToDollars } from '@/lib/order-utils';

export async function POST(request: NextRequest) {
  try {
    const { orderId, accessToken } = await request.json();

    if (!orderId && !accessToken) {
      return NextResponse.json({ error: 'Order ID or access token is required' }, { status: 400 });
    }

    const order = orderId
      ? await prisma.order.findUnique({ where: { id: orderId } })
      : await prisma.order.findUnique({ where: { accessToken } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.paymentStatus === 'paid') {
      return NextResponse.json({ error: 'Order is already paid' }, { status: 400 });
    }

    // If Stripe is not configured, mark as paid directly (dev mode)
    if (!stripe) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'paid',
          status: 'paid',
        },
      });

      await prisma.orderStatusUpdate.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: 'paid',
          note: 'Payment completed (dev mode)',
        },
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      return NextResponse.json({
        url: `${appUrl}/order/${order.accessToken}`,
        devMode: true,
      });
    }

    // Create Stripe checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: order.buyerEmail,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Cloudiezzz ${order.packageId} Song Order`,
              description: `Custom song for ${order.recName || 'your loved one'} — Order ${order.orderNumber}`,
            },
            unit_amount: order.totalPrice,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/order/${order.accessToken}?paid=true`,
      cancel_url: `${appUrl}/order/${order.accessToken}?cancelled=true`,
    });

    // Save session ID
    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
