import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET: Public approved reviews
export async function GET() {
  const reviews = await prisma.review.findMany({
    where: { isApproved: true, isPublic: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      customer: { select: { name: true } },
    },
  });

  return NextResponse.json({
    reviews: reviews.map((r: any) => ({
      id: r.id,
      author: r.customer.name,
      rating: r.rating,
      title: r.title,
      content: r.content,
      occasion: r.occasion,
      date: r.createdAt,
    })),
  });
}

// POST: Submit a review (via access token)
export async function POST(request: NextRequest) {
  try {
    const { accessToken, rating, title, content } = await request.json();

    if (!accessToken || !rating || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { accessToken },
      include: { customer: true, review: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!['completed', 'delivered'].includes(order.status)) {
      return NextResponse.json({ error: 'Order must be completed before reviewing' }, { status: 400 });
    }

    if (order.review) {
      return NextResponse.json({ error: 'Review already submitted for this order' }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        orderId: order.id,
        customerId: order.customerId,
        rating: Math.min(5, Math.max(1, rating)),
        title: title || null,
        content,
        occasion: order.occasion,
        isApproved: false,
        isPublic: false,
      },
    });

    return NextResponse.json({ success: true, reviewId: review.id });
  } catch {
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
