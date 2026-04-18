import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, requireRole } from '@/lib/auth';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

const ALLOWED_FILE_TYPES = ['draft', 'final', 'stem', 'lyric_video', 'lyric_card'];

export async function GET(
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
    select: { id: true },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

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
    select: { id: true },
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

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', id);
  await mkdir(uploadDir, { recursive: true });

  const fileName = file.name;
  const filePath = path.join(uploadDir, fileName);
  await writeFile(filePath, buffer);

  const fileUrl = `/uploads/${id}/${fileName}`;

  const orderFile = await prisma.orderFile.create({
    data: {
      orderId: id,
      fileName,
      fileUrl,
      fileType,
      fileSize: buffer.length,
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

  // Delete from filesystem
  try {
    const filePath = path.join(process.cwd(), 'public', orderFile.fileUrl);
    await unlink(filePath);
  } catch {
    // File may already be deleted from disk — continue
  }

  // Delete from database
  await prisma.orderFile.delete({ where: { id: fileId } });

  return NextResponse.json({ success: true });
}
