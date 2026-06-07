import { Fragment } from 'react';
import { prisma } from '@/lib/db';
import { LANGUAGES } from '@/lib/constants';

// Real number of languages we actually offer (excluding the "mixed"/"other" meta options).
const SUPPORTED_LANGUAGES = LANGUAGES.filter((l) => l.code !== 'multi' && l.code !== 'other').length;

async function getStats() {
  try {
    const [songs, reviewAgg, customers] = await Promise.all([
      // A "song created" = a paid order (refunded orders have paymentStatus 'refunded').
      prisma.order.count({ where: { paymentStatus: 'paid' } }),
      // Average rating from admin-approved reviews — matches what's shown publicly.
      prisma.review.aggregate({ where: { isApproved: true }, _avg: { rating: true }, _count: { rating: true } }),
      prisma.customer.count(),
    ]);
    return {
      songs,
      avgRating: reviewAgg._count.rating > 0 ? reviewAgg._avg.rating : null,
      reviewCount: reviewAgg._count.rating,
      customers,
    };
  } catch {
    // If the DB is briefly unreachable, fall back to the one stat that's always true.
    return { songs: 0, avgRating: null as number | null, reviewCount: 0, customers: 0 };
  }
}

export default async function TrustBar() {
  const { songs, avgRating, reviewCount, customers } = await getStats();

  const items: { num: string; label: string }[] = [];
  if (songs > 0) {
    items.push({ num: `${songs}`, label: songs === 1 ? 'song created' : 'songs created' });
  }
  if (avgRating != null) {
    items.push({
      num: `${avgRating.toFixed(1)}★`,
      label: `from ${reviewCount} review${reviewCount === 1 ? '' : 's'}`,
    });
  }
  if (customers > 0) {
    items.push({ num: `${customers}`, label: customers === 1 ? 'happy customer' : 'happy customers' });
  }
  // Always true — a real capability figure, not a volume metric.
  items.push({ num: `${SUPPORTED_LANGUAGES}`, label: 'languages' });

  return (
    <div className="trust-bar">
      {items.map((it, i) => (
        <Fragment key={it.label}>
          <div className="trust-item">
            <span className="trust-num">{it.num}</span>
            <span className="trust-label">{it.label}</span>
          </div>
          {i < items.length - 1 && <div className="trust-divider" />}
        </Fragment>
      ))}
    </div>
  );
}
