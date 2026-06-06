'use client';

import Link from 'next/link';

export default function ReviewForm() {
  return (
    <div className="review-form">
      <div className="review-cta">
        <div className="big-heart">♥</div>
        <h3>
          Got your <em>song?</em>
        </h3>
        <p className="review-cta-text">
          We&apos;d love to hear about it! Reviews are submitted right from your
          order page — just open the link from your delivery email and scroll to
          &ldquo;Leave a Review&rdquo;.
        </p>
        <p className="review-cta-sub">
          Haven&apos;t ordered yet?
        </p>
        <Link href="/#commission" className="review-cta-btn">
          Create your song ✿
        </Link>
      </div>
    </div>
  );
}
