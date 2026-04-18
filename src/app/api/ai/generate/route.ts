import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, requireRole } from '@/lib/auth';
import { buildSongBrief } from '@/lib/ai-utils';

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!requireRole(user, 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { orderId: string; provider?: 'suno' | 'udio' | 'custom' };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { orderId, provider } = body;

  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  }

  // Check AI configuration
  const aiProvider = provider || process.env.AI_PROVIDER;
  const aiApiKey = process.env.AI_API_KEY;

  if (!aiProvider || !aiApiKey) {
    return NextResponse.json(
      { success: false, error: 'AI provider not configured. Set AI_PROVIDER and AI_API_KEY in .env' },
      { status: 200 }
    );
  }

  // Load full order
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Build the prompt
  const prompt = buildSongBrief(order);

  // Log the prompt (actual API calls will be added per-provider later)
  console.log(`[AI Generate] Provider: ${aiProvider}, Order: ${order.orderNumber}`);
  console.log(`[AI Generate] Prompt:\n${prompt}`);

  // Update order status to in_progress
  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'in_progress' },
  });

  await prisma.orderStatusUpdate.create({
    data: {
      orderId,
      fromStatus: order.status,
      toStatus: 'in_progress',
      note: 'AI generation started',
      changedById: user!.id,
    },
  });

  return NextResponse.json({
    success: true,
    message: 'Generation queued',
    prompt,
  });
}
