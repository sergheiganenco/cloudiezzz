import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const order = await prisma.order.findUnique({
    where: { accessToken: token },
    include: {
      statusUpdates: { orderBy: { createdAt: 'desc' } },
      files: {
        where: { fileType: { in: ['final', 'lyric_video'] } },
        orderBy: { createdAt: 'desc' },
      },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Return only customer-safe fields
  return NextResponse.json({
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    packageId: order.packageId,
    totalPrice: order.totalPrice,
    recName: order.recName,
    occasion: order.occasion,
    mood: order.mood,
    genres: order.genres ? JSON.parse(order.genres) : [],
    language: order.language,
    createdAt: order.createdAt,
    deliveredAt: order.deliveredAt,
    giftPageSlug: order.giftPageSlug,
    statusUpdates: order.statusUpdates.map((u: { toStatus: string; note: string | null; createdAt: Date }) => ({
      status: u.toStatus,
      note: u.note,
      date: u.createdAt,
    })),
    files: order.files.map((f: { fileType: string; fileName: string; fileUrl: string }) => ({
      type: f.fileType,
      name: f.fileName,
      url: f.fileUrl,
    })),
    messages: order.messages.map((m: { senderType: string; content: string; createdAt: Date }) => ({
      from: m.senderType,
      content: m.content,
      date: m.createdAt,
    })),
  });
}
