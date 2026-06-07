import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Always read live data — otherwise this GET is cached at build time (when the
// samples table may be empty) and never reflects samples added later.
export const dynamic = 'force-dynamic';

export async function GET() {
  const samples = await prisma.audioSample.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  return NextResponse.json({ samples });
}
