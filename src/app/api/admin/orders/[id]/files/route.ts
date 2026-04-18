import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, requireRole } from '@/lib/auth';
import { put, del } from '@vercel/blob';

const ALLOWED_FILE_TYPES = ['draft', 'final', 'stem', 'lyric_video', 'lyric_card'];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB for audio/video files

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!requireRole(user, 'admin', 'creator')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, orderNumber: true },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const fileType = formData.get('fileType') as string | null;

  if (!file || !fileType) {
    return NextResponse.json({ error: 'File and fileType are required' }, { status: 400 });
  }

  if (!ALLOWED_FILE_TYPES.includes(fileType)) {
    return NextResponse.json({ error: `Invalid fileType. Must be one of: ${ALLOWED_FILE_TYPES.join(', ')}` }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large (max 25MB)' }, { status: 400 });
  }

  // Upload to Vercel Blob
  const blobPath = `orders/${order.orderNumber}/${fileType}/${file.name}`;
  const blob = await put(blobPath, file, {
    access: 'public',
    addRandomSuffix: true,
  });

  const orderFile = await prisma.orderFile.create({
    data: {
      orderId: id,
      fileName: file.name,
      fileUrl: blob.url,
      fileType,
      fileSize: file.size,
    },
  });

  return NextResponse.json({ file: orderFile }, { status: 201 });
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
