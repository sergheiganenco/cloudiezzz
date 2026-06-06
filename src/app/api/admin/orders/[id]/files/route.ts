import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, requireRole } from '@/lib/auth';
import { del } from '@vercel/blob';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

const ALLOWED_FILE_TYPES = ['draft', 'final', 'stem', 'lyric_video', 'lyric_card'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB — audio/video songs

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!requireRole(user, 'admin', 'creator')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const files = await prisma.orderFile.findMany({
    where: { orderId: id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ files });
}

// POST: mints a short-lived client-upload token so the browser can upload the
// file DIRECTLY to Vercel Blob. This bypasses the ~4.5MB serverless request
// body limit that previously broke real audio uploads. The browser then calls
// the /register endpoint to record the file in the DB.
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

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        let fileType = 'draft';
        try {
          fileType = JSON.parse(clientPayload || '{}').fileType || 'draft';
        } catch {
          // keep default
        }
        if (!ALLOWED_FILE_TYPES.includes(fileType)) {
          throw new Error(`Invalid fileType. Must be one of: ${ALLOWED_FILE_TYPES.join(', ')}`);
        }
        return {
          addRandomSuffix: true,
          maximumSizeInBytes: MAX_FILE_SIZE,
          tokenPayload: JSON.stringify({ orderId: id, fileType }),
        };
      },
      // The DB record is created by the /register endpoint once the browser
      // upload resolves (reliable in both dev and production). No-op here.
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload authorization failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!requireRole(user, 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const fileId = request.nextUrl.searchParams.get('fileId');

  if (!fileId) {
    return NextResponse.json({ error: 'fileId is required' }, { status: 400 });
  }

  const orderFile = await prisma.orderFile.findFirst({
    where: { id: fileId, orderId: id },
  });

  if (!orderFile) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  // Delete from Vercel Blob
  try {
    await del(orderFile.fileUrl);
  } catch {
    // Blob may already be deleted — continue
  }

  // Delete from database
  await prisma.orderFile.delete({ where: { id: fileId } });

  return NextResponse.json({ success: true });
}
