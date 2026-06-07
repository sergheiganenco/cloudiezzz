import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendOrderLinks } from '@/lib/email';

// POST: emails a customer the magic link(s) to their order(s). Always returns
// the same response whether or not any orders match, so it can't be used to
// probe which emails exist.
export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  // buyerEmail is stored lowercased+trimmed at order creation, so this matches.
  const orders = await prisma.order.findMany({
    where: { buyerEmail: email },
    select: { orderNumber: true, accessToken: true, buyerName: true },
    orderBy: { createdAt: 'desc' },
  });

  if (orders.length > 0) {
    sendOrderLinks({
      email,
      buyerName: orders[0].buyerName || '',
      orders: orders.map((o: { orderNumber: string; accessToken: string }) => ({
        orderNumber: o.orderNumber,
        accessToken: o.accessToken,
      })),
    }).catch((err: unknown) => console.error('[find-order] email failed:', err));
  }

  return NextResponse.json({ success: true });
}
