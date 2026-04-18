import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const order = await prisma.order.findUnique({
    where: { giftPageSlug: slug },
    include: {
      files: {
        where: { fileType: { in: ['final', 'lyric_video'] } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!order || order.status !== 'delivered') {
    return NextResponse.json({ error: 'Gift not found or not yet ready' }, { status: 404 });
  }

  return NextResponse.json({
    recName: order.recName,
    occasion: order.occasion,
    mood: order.mood,
    language: order.language,
    files: order.files.map((f: { fileType: string; fileName: string; fileUrl: string }) => ({
      type: f.fileType,
      name: f.fileName,
      url: f.fileUrl,
    })),
  });
}
