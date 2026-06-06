import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, requireRole } from '@/lib/auth';
import { buildSongBrief } from '@/lib/ai-utils';

const SYSTEM_PROMPT =
  'You are a professional songwriter and Suno AI prompt engineer for Cloudiezzz, a custom song ' +
  'commission service. From the song brief, produce content ready to paste into Suno AI (Custom mode).\n\n' +
  'Respond with ONLY a JSON object — no markdown, no code fences — with exactly these keys:\n' +
  '- "title": a short, evocative song title (the name of the song). Max ~6 words.\n' +
  '- "style": a Suno "Style of Music" prompt as a comma-separated list of genre, mood, tempo, ' +
  'instrumentation and vocal type (e.g. "acoustic pop, heartfelt, mid-tempo, piano and strings, ' +
  'female vocals"). No full sentences. Under 200 characters. Match the requested genre, mood and vocal.\n' +
  '- "lyrics": full song lyrics formatted for Suno with section tags in square brackets such as ' +
  '[Intro], [Verse], [Pre-Chorus], [Chorus], [Bridge], [Outro]. Write in the requested language. ' +
  'Weave in the specific names, memories and details from the brief. Honor any must-include lines or ' +
  'catchphrase, and avoid anything listed under "Avoid".\n\n' +
  'Return valid, properly escaped JSON only.';

interface SunoResult {
  title: string;
  style: string;
  lyrics: string;
}

// Pull a JSON object out of the model response, tolerating code fences or stray text.
function parseSuno(text: string): SunoResult {
  let raw = text.trim();
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) raw = fence[1].trim();

  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try {
      const obj = JSON.parse(raw.slice(start, end + 1));
      return {
        title: typeof obj.title === 'string' ? obj.title : '',
        style: typeof obj.style === 'string' ? obj.style : '',
        lyrics: typeof obj.lyrics === 'string' ? obj.lyrics : '',
      };
    } catch {
      // fall through to raw fallback
    }
  }

  // Couldn't parse JSON — hand the whole thing back as lyrics so nothing is lost.
  return { title: '', style: '', lyrics: text.trim() };
}

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

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { success: false, error: 'Set ANTHROPIC_API_KEY in .env to enable Suno generation' },
      { status: 200 }
    );
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const brief = buildSongBrief(order);

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: brief }],
    });

    const textBlock = response.content[0];
    if (textBlock.type !== 'text') {
      return NextResponse.json(
        { success: false, error: 'Unexpected response format from AI' },
        { status: 500 }
      );
    }

    const result = parseSuno(textBlock.text);
    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    if (message.includes('Cannot find module') || message.includes('@anthropic-ai/sdk')) {
      return NextResponse.json(
        {
          success: false,
          error: 'The @anthropic-ai/sdk package is not installed. Run: npm install @anthropic-ai/sdk',
        },
        { status: 200 }
      );
    }

    console.error('[AI Suno] Error:', message);
    return NextResponse.json(
      { success: false, error: `Suno generation failed: ${message}` },
      { status: 500 }
    );
  }
}
