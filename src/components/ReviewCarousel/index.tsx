'use client';

import { useEffect, useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
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
    fetch('/api/reviews?featured=true&limit=10')
      .then((r) => r.json())
      .then((d) => {
        if (d.reviews && d.reviews.length > 0) {
          setReviews(d.reviews);
        } else {
          // Fall back to hardcoded reviews if no featured reviews yet
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
        setLoaded(true);
      })
      .catch(() => {
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
        setLoaded(true);
      });
  }, []);

  if (!loaded) return null;

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
