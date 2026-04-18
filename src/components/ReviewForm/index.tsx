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

  function handleStarClick(n: number) {
    setRating(n);
    for (let i = 0; i < n; i++) {
      playNote(PENTATONIC[i + 2], { type: 'sine', dur: 0.25, delay: i * 0.06, vol: 0.14 });
    }
  }

  function handleSubmit() {
    if (!rating) {
      playNote(220, { type: 'sine', dur: 0.3, vol: 0.12 });
      alert('Please pick a star rating first ✿');
      return;
    }
    if (!name.trim() || !reviewText.trim()) {
      playNote(220, { type: 'sine', dur: 0.3, vol: 0.12 });
      alert('Please fill in your name and review ✿');
      return;
    }
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

      <div className="star-picker">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star-pick ${star <= (hoverRating || rating) ? 'lit' : ''}`}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
          >
            ★
          </span>
        ))}
      </div>

      <div className="row two">
        <label>
          <div className="lbl">
            Your name <span className="req">required</span>
          </div>
          <input
            type="text"
            placeholder="What should we call you?"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            onChange={(e) => setReviewText(e.target.value)}
          />
        </label>
      </div>
      <button className="review-submit" onClick={handleSubmit}>
        Submit Review →
      </button>
    </div>
  );
}
