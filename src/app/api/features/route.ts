import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { name, email, suggestion } = await request.json();

    if (!suggestion || !suggestion.trim()) {
      return NextResponse.json({ error: 'Suggestion is required' }, { status: 400 });
    }

    await prisma.featureRequest.create({
      data: {
        email: email || null,
        category: 'general',
        content: suggestion.trim(),
        status: 'new',
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Feature request error:', err);
    return NextResponse.json({ error: 'Failed to save feature request' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const features = await prisma.featureRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(features);
  } catch (err) {
    console.error('Feature request fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch feature requests' }, { status: 500 });
  }
}
