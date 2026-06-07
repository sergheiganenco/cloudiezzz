'use client';

import { useEffect, useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

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

export default function ReviewCarousel() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start', slidesToScroll: 1 },
    [Autoplay({ delay: 5000, stopOnInteraction: true })]
  );

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // Prefer featured reviews; if none are featured yet, show recent
        // approved reviews. Never fall back to hardcoded/sample data.
        let res = await fetch('/api/reviews?featured=true&limit=10').then((r) => r.json());
        let list: ReviewItem[] = res.reviews || [];
        if (list.length === 0) {
          res = await fetch('/api/reviews?limit=10').then((r) => r.json());
          list = res.reviews || [];
        }
        if (!cancelled) {
          setReviews(list);
          setLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setReviews([]);
          setLoaded(true);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  if (!loaded) {
    return (
      <section className="review-carousel-section" id="reviews">
        <div className="section-eyebrow">Loved By Customers</div>
        <h2>
          What people are <em>saying</em>
        </h2>
        <div className="sub">Real stories from people who got their perfect song</div>
        <div className="carousel-skeleton">
          {[0, 1, 2].map((i) => (
            <div className="review review-skeleton" key={i}>
              <div className="skeleton-line" style={{ width: '40%' }} />
              <div className="skeleton-line" />
              <div className="skeleton-line" />
              <div className="skeleton-line" style={{ width: '70%' }} />
              <div className="skeleton-author">
                <div className="skeleton-avatar" />
                <div className="skeleton-line" style={{ width: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // No real reviews yet — hide the whole section rather than show samples.
  if (reviews.length === 0) return null;

  return (
    <section className="review-carousel-section" id="reviews">
      <div className="section-eyebrow">Loved By Customers</div>
      <h2>
        What people are <em>saying</em>
      </h2>
      <div className="sub">Real stories from people who got their perfect song</div>

      <div className="carousel-wrap">
        <button
          className="carousel-btn carousel-btn-prev"
          onClick={() => emblaApi?.scrollPrev()}
          disabled={!canScrollPrev}
          aria-label="Previous review"
        >
          &#8249;
        </button>

        <div className="carousel-viewport" ref={emblaRef}>
          <div className="carousel-container">
            {reviews.map((review, i) => (
              <div className="carousel-slide" key={review.id}>
                <div className="review">
                  <div className="stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
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
              </div>
            ))}
          </div>
        </div>

        <button
          className="carousel-btn carousel-btn-next"
          onClick={() => emblaApi?.scrollNext()}
          disabled={!canScrollNext}
          aria-label="Next review"
        >
          &#8250;
        </button>
      </div>

      <div className="carousel-dots">
        {reviews.map((_, i) => (
          <button
            key={i}
            className="carousel-dot"
            onClick={() => emblaApi?.scrollTo(i)}
            aria-label={`Go to review ${i + 1}`}
          />
        ))}
      </div>

      <a href="/reviews" className="see-all-reviews">
        See all reviews →
      </a>
    </section>
  );
}
