'use client';

import { useEffect, useState } from 'react';
import { REVIEWS } from '@/lib/constants';

interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  title?: string;
  content: string;
  occasion?: string;
  date: string;
}

const AVATAR_COLORS = ['var(--pink)', 'var(--orange)', '#a78bfa', '#34d399', '#60a5fa', '#f472b6'];

export default function Testimonials() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  function loadReviews(cursor?: string) {
    setLoading(true);
    const url = cursor
      ? `/api/reviews?limit=9&cursor=${cursor}`
      : '/api/reviews?limit=9';

    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        const items: ReviewItem[] = d.reviews || [];
        if (items.length > 0) {
          setReviews((prev) => cursor ? [...prev, ...items] : items);
          setNextCursor(d.nextCursor || null);
          setHasMore(d.hasMore || false);
        } else if (!cursor) {
          // No DB reviews yet — show hardcoded fallback
          setReviews(
            REVIEWS.map((r) => ({
              id: r.id,
              author: r.author,
              rating: r.rating,
              content: r.quote,
              occasion: r.occasion,
              date: r.date,
            }))
          );
          setHasMore(false);
        }
        setInitialized(true);
      })
      .catch(() => {
        if (!cursor) {
          setReviews(
            REVIEWS.map((r) => ({
              id: r.id,
              author: r.author,
              rating: r.rating,
              content: r.quote,
              occasion: r.occasion,
              date: r.date,
            }))
          );
        }
        setInitialized(true);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadReviews();
  }, []);

  if (!initialized) return null;

  return (
    <section className="testimonials" id="reviews">
      <div className="section-eyebrow">Loved By Customers</div>
      <h2>
        What people are <em>saying</em>
      </h2>
      <div className="sub">Real stories from people who got their perfect song</div>

      <div className="reviews">
        {reviews.map((review, i) => (
          <div className="review" key={review.id}>
            <div className="stars">
              {'★'.repeat(review.rating)}
              {'☆'.repeat(5 - review.rating)}
            </div>
            <div className="quote">{review.content}</div>
            <div className="author">
              <div
                className="avatar"
                style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
              >
                {review.author.charAt(0).toUpperCase()}
              </div>
              <div className="author-info">
                <div className="name">{review.author}</div>
                {review.occasion && <div className="occasion">{review.occasion}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          className="load-more-btn"
          onClick={() => nextCursor && loadReviews(nextCursor)}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Load More Reviews →'}
        </button>
      )}
    </section>
  );
}
