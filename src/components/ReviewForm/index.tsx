'use client';

import { useState } from 'react';
import { playNote, playChord, PENTATONIC } from '@/lib/audio';

export default function ReviewForm() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState('');
  const [occasion, setOccasion] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  function handleStarClick(n: number) {
    setRating(n);
    setErrors((prev) => prev.filter((e) => !e.includes('star')));
    for (let i = 0; i < n; i++) {
      playNote(PENTATONIC[i + 2], { type: 'sine', dur: 0.25, delay: i * 0.06, vol: 0.14 });
    }
  }

  function handleSubmit() {
    const errs: string[] = [];
    if (!rating) errs.push('Please pick a star rating');
    if (!name.trim()) errs.push('Name is required');
    if (!reviewText.trim()) errs.push('Review text is required');

    if (errs.length > 0) {
      setErrors(errs);
      playNote(220, { type: 'sine', dur: 0.3, vol: 0.12 });
      return;
    }

    setErrors([]);
    playChord([523.25, 659.25, 783.99, 1046.50], { type: 'triangle', dur: 0.6, stagger: 0.08, vol: 0.15 });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="review-form">
        <div className="review-thanks">
          <div className="big-heart">♥</div>
          <h4>
            Thank <em>you!</em>
          </h4>
          <p>
            Your review has been received ✿
            <br />
            It means the world to us.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-form">
      <h3>
        Share your <em>experience</em>
      </h3>
      <div className="sub">Already got your song? We&apos;d love to hear about it ✿</div>

      {/* Star rating with accessibility */}
      <div className="star-picker" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={rating === star}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            className={`star-pick ${star <= (hoverRating || rating) ? 'lit' : ''}`}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            style={{ background: 'none', border: 'none', padding: 0 }}
          >
            ★
          </button>
        ))}
      </div>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div style={{ margin: '0 0 16px', padding: '10px 16px', background: '#fef2f2', border: '2px solid #fca5a5', borderRadius: 12 }}>
          {errors.map((err, i) => (
            <p key={i} style={{ color: '#dc2626', fontSize: 14, fontWeight: 600, margin: '4px 0', fontFamily: 'Fredoka, sans-serif' }}>
              ⚠ {err}
            </p>
          ))}
        </div>
      )}

      <div className="row two">
        <label>
          <div className="lbl">
            Your name <span className="req">required</span>
          </div>
          <input
            type="text"
            placeholder="What should we call you?"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((prev) => prev.filter((e) => !e.includes('Name'))); }}
          />
        </label>
        <label>
          <div className="lbl">The occasion</div>
          <input
            type="text"
            placeholder="e.g. Wedding, Birthday..."
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
          />
        </label>
      </div>
      <div className="row">
        <label>
          <div className="lbl">
            Your review <span className="req">required</span>
          </div>
          <textarea
            rows={4}
            placeholder="Tell us about your song and how it was received..."
            value={reviewText}
            onChange={(e) => { setReviewText(e.target.value); setErrors((prev) => prev.filter((e) => !e.includes('Review'))); }}
          />
        </label>
      </div>
      <button className="review-submit" onClick={handleSubmit}>
        Submit Review →
      </button>
    </div>
  );
}
