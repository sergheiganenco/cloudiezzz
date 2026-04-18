import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET: Return referral stats for a given referrer email
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'email query parameter is required' }, { status: 400 });
  }

  const referrals = await prisma.referral.findMany({
    where: { referrerEmail: email.toLowerCase().trim() },
  });

  const totalReferrals = referrals.length;
  const converted = referrals.filter((r: { orderId: string | null }) => r.orderId !== null).length;
  const creditsAwarded = referrals.filter((r: { creditAwarded: boolean }) => r.creditAwarded).length;

  return NextResponse.json({
    email: email.toLowerCase().trim(),
    totalReferrals,
    converted,
    creditsAwarded,
    referrals: referrals.map((r: any) => ({
      id: r.id,
      referredEmail: r.referredEmail,
      referralCode: r.referralCode,
      creditAwarded: r.creditAwarded,
      orderId: r.orderId,
      createdAt: r.createdAt,
    })),
  });
}

// POST: Create a referral record
export async function POST(request: NextRequest) {
  try {
    const { referrerEmail, referredEmail, code } = await request.json();

    if (!referrerEmail?.trim()) {
      return NextResponse.json({ error: 'referrerEmail is required' }, { status: 400 });
    }
    if (!referredEmail?.trim()) {
      return NextResponse.json({ error: 'referredEmail is required' }, { status: 400 });
    }
    if (!code?.trim()) {
      return NextResponse.json({ error: 'code is required' }, { status: 400 });
    }

    const normalizedReferrer = referrerEmail.trim().toLowerCase();
    const normalizedReferred = referredEmail.trim().toLowerCase();

    if (normalizedReferrer === normalizedReferred) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
    }

    const referral = await prisma.referral.create({
      data: {
        referrerEmail: normalizedReferrer,
        referredEmail: normalizedReferred,
        referralCode: code.trim(),
      },
    });

    return NextResponse.json({ success: true, referral });
  } catch {
    return NextResponse.json({ error: 'Failed to create referral' }, { status: 500 });
  }
}
