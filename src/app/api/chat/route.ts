import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are Cloudie, the friendly assistant for Cloudiezzz — a custom song commission service. You help customers with questions about ordering personalized songs.

Key information:
- Packages: Basic ($39, 1 song, 1 revision, 72h), Standard ($79, 2 versions, 2 revisions, 48h), Premium ($149, 3 versions, unlimited revisions, 24h), Business ($299, discovery call, licensing, stems, ~5 days)
- Rush add-on available (~12 hours delivery)
- 30+ languages supported including English, Spanish, French, Russian, Chinese, Japanese, Korean, Portuguese, German, Arabic, Hindi, and more
- Mixed languages in one song are possible
- Genres: Acoustic/Folk, Pop, Rock, Hip-hop/Rap, R&B/Soul, Country, Ballad, Lullaby, Electronic, Jazz, Reggaeton, Retro 80s
- Voice options: Male, Female, Duet, No preference
- Discount code CLOUD25 gives 25% off
- Refund policy: full refund within 7 days if not satisfied after revisions
- Contact: hello@cloudiezzz.com, WhatsApp +1 (555) 555-0100, Telegram/Instagram @cloudiezzz
- Hours: Mon-Fri 9am-9pm EST, Sat-Sun 11am-6pm EST
- Based in Charlotte, NC, serving worldwide
- Process: Fill form (~5 min) → Choose package → Artists craft song → Receive & revise

Keep responses concise, warm, and helpful. Use emojis sparingly. Guide users toward filling out the commission form when appropriate.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history } = body as {
      message: string;
      history?: { role: string; content: string }[];
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ reply: null, source: 'fallback' });
    }

    // Try to use the Anthropic SDK
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey });

      const messages = [
        ...(history || []).map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        { role: 'user' as const, content: message },
      ];

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages,
      });

      const reply =
        response.content[0].type === 'text' ? response.content[0].text : null;

      return NextResponse.json({ reply, source: 'ai' });
    } catch {
      // SDK not installed or API call failed — fall back
      return NextResponse.json({ reply: null, source: 'fallback' });
    }
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
