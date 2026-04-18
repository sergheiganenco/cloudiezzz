'use client';

import { REVIEWS } from '@/lib/constants';

export default function Testimonials() {
  return (
    <section className="testimonials" id="reviews">
      <div className="section-eyebrow">Loved By Customers</div>
      <h2>
        What people are <em>saying</em>
      </h2>
      <div className="sub">Real stories from people who got their perfect song ✿</div>

      <div className="reviews">
        {REVIEWS.map((review, i) => (
          <div className="review" key={review.id}>
            <div className="stars">{'★'.repeat(review.rating)}</div>
            <div className="quote">{review.quote}</div>
            <div className="author">
              <div className={`avatar ${i === 1 ? 'b' : i === 2 ? 'c' : ''}`}>
                {review.avatar}
              </div>
              <div className="author-info">
                <div className="name">{review.author}</div>
                <div className="occasion">{review.occasion}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
