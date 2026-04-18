import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateOrderNumber, generateAccessToken, generateGiftSlug, dollarsToCents } from '@/lib/order-utils';
import { calculatePrice } from '@/lib/utils';
import { sendOrderConfirmation, sendAdminNewOrderAlert } from '@/lib/email';
import type { CommissionFormData } from '@/lib/types';
import { processNewOrder } from '@/lib/ai-agent';
import { trackServerEvent } from '@/lib/analytics';

export interface CommissionApiResponse {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  accessToken?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<CommissionApiResponse>> {
  try {
    const body: CommissionFormData = await request.json();

    // ── Validation ──────────────────────────────────────────────────
    if (!body.buyer_name?.trim()) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }
    if (!body.buyer_email?.trim()) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }
    if (!body.package) {
      return NextResponse.json({ success: false, error: 'Please select a package' }, { status: 400 });
    }

    // ── Coupon validation against database ─────────────────────────
    if (body.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: body.couponCode },
      });
      if (!coupon || !coupon.isActive) {
        return NextResponse.json({ success: false, error: 'Invalid or inactive coupon code' }, { status: 400 });
      }
      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        return NextResponse.json({ success: false, error: 'Coupon has expired' }, { status: 400 });
      }
      if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
        return NextResponse.json({ success: false, error: 'Coupon usage limit reached' }, { status: 400 });
      }
    }

    // ── Price calculation ───────────────────────────────────────────
    const price = calculatePrice(body.package, body.addons, body.couponCode || null);
    if (!price) {
      return NextResponse.json({ success: false, error: 'Invalid package selected' }, { status: 400 });
    }

    // ── Find or create customer ─────────────────────────────────────
    const email = body.buyer_email.trim().toLowerCase();
    const customer = await prisma.customer.upsert({
      where: { email },
      update: {
        name: body.buyer_name.trim(),
        phone: body.buyer_phone || null,
      },
      create: {
        email,
        name: body.buyer_name.trim(),
        phone: body.buyer_phone || null,
      },
    });

    // ── Create the order ────────────────────────────────────────────
    const orderNumber = generateOrderNumber();
    const accessToken = generateAccessToken();
    const giftSlug = generateGiftSlug();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        accessToken,
        status: 'pending',
        paymentStatus: 'unpaid',

        // Pricing
        packageId: body.package,
        packagePrice: dollarsToCents(price.pkgPrice),
        addons: JSON.stringify(body.addons),
        addonTotal: dollarsToCents(price.addonTotal),
        rushFee: dollarsToCents(price.rushFee),
        couponCode: body.couponCode || null,
        discountPercent: price.rate * 100,
        discountAmount: dollarsToCents(price.discount),
        totalPrice: dollarsToCents(price.total),

        // Buyer
        buyerName: body.buyer_name.trim(),
        buyerEmail: email,
        buyerPhone: body.buyer_phone || null,
        dueDate: body.due_date || null,

        // Recipient
        recName: body.rec_name || null,
        recAge: body.rec_age || null,
        relationship: body.relationship || null,
        occasion: body.occasion || null,
        othersMentioned: body.others || null,

        // Story
        howMet: body.how_met || null,
        memories: body.memories || null,
        loveAbout: body.love_about || null,
        feeling: body.feeling || null,
        oneLine: body.one_line || null,
        avoid: body.avoid || null,

        // Sound
        mood: body.mood || null,
        genres: JSON.stringify(body.genre),
        language: body.language || 'en',
        vocal: body.vocal || null,
        songReferences: body.references || null,

        // Lyrics
        mustInclude: body.must_include || null,
        catchphrase: body.catchphrase || null,
        credit: body.credit || null,
        lyricTone: body.lyric_tone || null,
        contentRating: body.rating || null,
        approveFirst: body.approve || null,
        anythingElse: body.anything_else || null,

        // Gift page
        giftPageSlug: giftSlug,

        // Customer relation
        customerId: customer.id,
      },
    });

    // Increment coupon usage count if a coupon was used
    if (body.couponCode) {
      await prisma.coupon.update({
        where: { code: body.couponCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Track referral conversion if coupon matches a referral code
    if (body.couponCode) {
      const referral = await prisma.referral.findFirst({
        where: {
          referralCode: body.couponCode,
          referredEmail: email,
          orderId: null,
        },
      });
      if (referral) {
        await prisma.referral.update({
          where: { id: referral.id },
          data: { orderId: order.id },
        });
      }
    }

    // Increment customer order count
    await prisma.customer.update({
      where: { id: customer.id },
      data: { orderCount: { increment: 1 } },
    });

    // Create initial status record
    await prisma.orderStatusUpdate.create({
      data: {
        orderId: order.id,
        fromStatus: '',
        toStatus: 'pending',
        note: 'Order submitted',
      },
    });

    // Send confirmation email (fire and forget)
    sendOrderConfirmation({
      buyerEmail: email,
      buyerName: body.buyer_name.trim(),
      orderNumber,
      accessToken,
      packageId: body.package,
      totalPrice: dollarsToCents(price.total),
      recName: body.rec_name || null,
    }).catch((err) => console.error('Email send failed:', err));

    // Notify admin of new order (fire and forget)
    sendAdminNewOrderAlert({
      orderNumber,
      buyerName: body.buyer_name.trim(),
      buyerEmail: email,
      packageId: body.package,
      totalPrice: dollarsToCents(price.total),
    }).catch((err) => console.error('Admin alert email failed:', err));

    // AI Agent pipeline (fire and forget)
    processNewOrder(order.id).catch((err) => console.error('AI agent error:', err));

    trackServerEvent('order_submitted', { orderNumber, package: body.package });

    console.log('New order:', { orderNumber, buyer: body.buyer_name, email, total: price.total });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      accessToken: order.accessToken,
    });
  } catch (err) {
    console.error('Commission API error:', err);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
