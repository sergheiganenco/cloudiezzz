import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, requireRole } from '@/lib/auth';
import { del } from '@vercel/blob';

const BLOB_URL = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i;

// GET: all samples (including hidden) — admin only.
export async function GET() {
  const user = await getSessionUser();
  if (!requireRole(user, 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const samples = await prisma.audioSample.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json({ samples });
}

// POST: create a sample (audio already uploaded to Blob).
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!requireRole(user, 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const genre = typeof body.genre === 'string' ? body.genre.trim() : '';
  const audioUrl = typeof body.audioUrl === 'string' ? body.audioUrl : '';

  if (!title || !genre || !audioUrl) {
    return NextResponse.json({ error: 'Title, genre and audio file are required' }, { status: 400 });
  }
  if (!BLOB_URL.test(audioUrl)) {
    return NextResponse.json({ error: 'Invalid audio URL' }, { status: 400 });
  }

  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);

  const sample = await prisma.audioSample.create({
    data: {
      title,
      genre,
      audioUrl,
      description: str(body.description),
      mood: str(body.mood),
      occasion: str(body.occasion),
      language: str(body.language) || 'en',
      duration: typeof body.duration === 'number' && body.duration > 0 ? Math.round(body.duration) : 0,
      sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : 0,
    },
  });

  return NextResponse.json({ sample }, { status: 201 });
}

// PATCH: update visibility / order / basic fields.
export async function PATCH(request: NextRequest) {
  const user = await getSessionUser();
  if (!requireRole(user, 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const id = typeof body.id === 'string' ? body.id : '';
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive;
  if (typeof body.sortOrder === 'number') data.sortOrder = body.sortOrder;
  if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim();
  if (typeof body.genre === 'string' && body.genre.trim()) data.genre = body.genre.trim();

  const sample = await prisma.audioSample.update({ where: { id }, data });
  return NextResponse.json({ sample });
}

// DELETE: remove a sample (and its Blob audio).
export async function DELETE(request: NextRequest) {
  const user = await getSessionUser();
  if (!requireRole(user, 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const sample = await prisma.audioSample.findUnique({ where: { id } });
  if (sample?.audioUrl && BLOB_URL.test(sample.audioUrl)) {
    try {
      await del(sample.audioUrl);
    } catch {
      // Blob may already be gone — continue.
    }
  }

  await prisma.audioSample.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
