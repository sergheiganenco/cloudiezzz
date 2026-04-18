import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, requireRole } from '@/lib/auth';
import { buildSongBrief } from '@/lib/ai-utils';

const SYSTEM_PROMPT =
  'You are a professional songwriter for Cloudiezzz, a custom song commission service. ' +
  'Write heartfelt, authentic lyrics based on the customer\'s story. ' +
  'Match the requested mood, genre, and language. ' +
  'Include specific details from their story \u2014 names, places, inside jokes. ' +
  'Structure the lyrics with verses, chorus, and bridge.';

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!requireRole(user, 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { orderId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { orderId } = body;

  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  }

  // Check if Anthropic API key is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { success: false, error: 'Set ANTHROPIC_API_KEY in .env to enable AI lyrics' },
      { status: 200 }
    );
  }

  // Load full order
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const brief = buildSongBrief(order);

  // Try to use Anthropic SDK
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: brief },
      ],
    });

    const textBlock = response.content[0];
    if (textBlock.type !== 'text') {
      return NextResponse.json(
        { success: false, error: 'Unexpected response format from AI' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, lyrics: textBlock.text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    // Check if this is a module-not-found error
    if (message.includes('Cannot find module') || message.includes('@anthropic-ai/sdk')) {
      return NextResponse.json(
        {
          success: false,
          error: 'The @anthropic-ai/sdk package is not installed. Run: npm install @anthropic-ai/sdk',
        },
        { status: 200 }
      );
    }

    console.error('[AI Lyrics] Error:', message);
    return NextResponse.json(
      { success: false, error: `AI lyrics generation failed: ${message}` },
      { status: 500 }
    );
  }
}
