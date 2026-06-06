import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, requireRole } from '@/lib/auth';

const ALLOWED_FILE_TYPES = ['draft', 'final', 'stem', 'lyric_video', 'lyric_card'];

// POST: records a file that the browser already uploaded directly to Vercel
// Blob (see ../route.ts). Validates the URL is a Vercel Blob URL so an admin
// can't register an arbitrary external link.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!requireRole(user, 'admin', 'creator')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id }, select: { id: true } });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  let body: { fileName?: string; fileUrl?: string; fileType?: string; fileSize?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { fileName, fileUrl, fileType, fileSize } = body;

  if (!fileName || !fileUrl || !fileType) {
    return NextResponse.json({ error: 'fileName, fileUrl and fileType are required' }, { status: 400 });
  }

  if (!ALLOWED_FILE_TYPES.includes(fileType)) {
    return NextResponse.json(
      { error: `Invalid fileType. Must be one of: ${ALLOWED_FILE_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  // Only accept genuine Vercel Blob URLs.
  if (!/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(fileUrl)) {
    return NextResponse.json({ error: 'Invalid file URL' }, { status: 400 });
  }

  const orderFile = await prisma.orderFile.create({
    data: {
      orderId: id,
      fileName,
      fileUrl,
      fileType,
      fileSize: typeof fileSize === 'number' ? fileSize : null,
    },
  });

  return NextResponse.json({ file: orderFile }, { status: 201 });
}
