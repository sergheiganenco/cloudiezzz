import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendAdminReviewAlert } from '@/lib/email';

// GET: Public approved reviews with cursor pagination + featured filter
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const featured = searchParams.get('featured');
  const cursor = searchParams.get('cursor');
  const limit = Math.min(parseInt(searchParams.get('limit') || '9'), 50);

  const where: any = { isApproved: true, isPublic: true };
  if (featured === 'true') {
    where.isFeatured = true;
  }

  const reviews = await prisma.review.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1, // fetch one extra to check if there's more
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      customer: { select: { name: true } },
    },
  });

  const hasMore = reviews.length > limit;
  const items = hasMore ? reviews.slice(0, limit) : reviews;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({
    reviews: items.map((r: any) => ({
      id: r.id,
      author: r.customer.name,
      rating: r.rating,
      title: r.title,
      content: r.content,
      occasion: r.occasion,
      date: r.createdAt,
    })),
    nextCursor,
    hasMore,
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

    // Notify admin
    sendAdminReviewAlert({
      orderNumber: order.orderNumber,
      buyerName: order.buyerName,
      rating: review.rating,
      content: review.content,
    }).catch(() => {});

    return NextResponse.json({ success: true, reviewId: review.id });
  } catch {
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
