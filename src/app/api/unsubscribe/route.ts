import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST: Unsubscribe a lead from reminder emails
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Update the lead if it exists — don't reveal whether it did (privacy)
    await prisma.lead.updateMany({
      where: { email: normalizedEmail },
      data: { status: 'unsubscribed' },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }
}
