import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendStatusUpdate } from '@/lib/email';

interface WebhookBody {
  orderId: string;
  status: 'completed' | 'failed';
  fileUrl?: string;
  fileName?: string;
  metadata?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  // Validate webhook secret
  const secret = process.env.AI_WEBHOOK_SECRET;
  if (!secret) {
    console.error('AI_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const headerSecret = request.headers.get('x-webhook-secret');
  if (headerSecret !== secret) {
    return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 });
  }

  let body: WebhookBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { orderId, status, fileUrl, fileName, metadata } = body;

  if (!orderId || !status) {
    return NextResponse.json({ error: 'orderId and status are required' }, { status: 400 });
  }

  if (status !== 'completed' && status !== 'failed') {
    return NextResponse.json({ error: 'status must be "completed" or "failed"' }, { status: 400 });
  }

  // Find the order
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (status === 'completed') {
    // Create OrderFile record if fileUrl is provided
    if (fileUrl) {
      await prisma.orderFile.create({
        data: {
          orderId,
          fileName: fileName || 'ai-generated-song',
          fileUrl,
          fileType: 'draft',
        },
      });
    }

    // Update order status to 'review'
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'review' },
    });

    // Create status update record
    await prisma.orderStatusUpdate.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus: 'review',
        note: `AI generation completed${metadata ? ` (provider: ${metadata.provider || 'unknown'})` : ''}`,
      },
    });

    // Send status update email
    sendStatusUpdate({
      buyerEmail: order.buyerEmail,
      buyerName: order.buyerName,
      orderNumber: order.orderNumber,
      accessToken: order.accessToken,
      newStatus: 'review',
      note: 'Your AI-generated song draft is ready for review!',
    }).catch((err: unknown) => console.error('Webhook status email failed:', err));

    return NextResponse.json({ success: true, message: 'Order updated to review' });
  }

  // status === 'failed'
  const errorNote = metadata?.error
    ? `AI generation failed: ${metadata.error}`
    : 'AI generation failed';

  await prisma.orderStatusUpdate.create({
    data: {
      orderId,
      fromStatus: order.status,
      toStatus: order.status,
      note: errorNote,
    },
  });

  return NextResponse.json({ success: true, message: 'Failure recorded' });
}
