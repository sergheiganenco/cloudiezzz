import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, requireRole } from '@/lib/auth';

// GET: Return all reviews (including unapproved) — admin only
export async function GET() {
  const user = await getSessionUser();
  if (!requireRole(user, 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      customer: { select: { name: true, email: true } },
      order: { select: { orderNumber: true, packageId: true } },
    },
  });

  return NextResponse.json({
    reviews: reviews.map((r: any) => ({
      id: r.id,
      orderId: r.orderId,
      orderNumber: r.order.orderNumber,
      author: r.customer.name,
      authorEmail: r.customer.email,
      rating: r.rating,
      title: r.title,
      content: r.content,
      occasion: r.occasion,
      isApproved: r.isApproved,
      isPublic: r.isPublic,
      isFeatured: r.isFeatured,
      createdAt: r.createdAt,
    })),
  });
}

// PATCH: Approve or reject a review — admin only
export async function PATCH(request: NextRequest) {
  const user = await getSessionUser();
  if (!requireRole(user, 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { reviewId, isApproved, isPublic, isFeatured } = await request.json();

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId is required' }, { status: 400 });
    }

    const data: any = {};
    if (typeof isApproved === 'boolean') data.isApproved = isApproved;
    if (typeof isPublic === 'boolean') data.isPublic = isPublic;
    if (typeof isFeatured === 'boolean') data.isFeatured = isFeatured;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const existing = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data,
    });

    return NextResponse.json({ success: true, review: updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}
