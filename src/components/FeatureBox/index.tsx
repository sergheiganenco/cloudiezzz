'use client';

import { useState } from 'react';
import { playNote, playChord } from '@/lib/audio';

export default function FeatureBox() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!suggestion.trim()) {
      playNote(220, { type: 'sine', dur: 0.3, vol: 0.12 });
      alert('Please share your suggestion first ✨');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, suggestion }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send suggestion');
      }

      playChord([523.25, 659.25, 783.99, 1046.50, 1318.51], { type: 'triangle', dur: 0.6, stagger: 0.07, vol: 0.13 });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      playNote(220, { type: 'sine', dur: 0.3, vol: 0.12 });
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <section className="feature-box">
        <div className="review-thanks">
          <div className="big-heart">✨</div>
          <h4>
            Got it! <em>Thank you</em>
          </h4>
          <p>
            Your suggestion has been received ✿
            <br />
            We read every single one.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="feature-box">
      <h3>
        Got an <em>idea?</em>
      </h3>
      <div className="sub">Suggest a feature, language, or anything else ✨</div>

      <div className="row two">
        <label>
          <div className="lbl">
            Your name <span className="hint">optional</span>
          </div>
          <input
            type="text"
            placeholder="So we can thank you"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          <div className="lbl">
            Email <span className="hint">optional</span>
          </div>
          <input
            type="email"
            placeholder="If you'd like a reply"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
      </div>
      <div className="row">
        <label>
          <div className="lbl">
            Your suggestion <span className="req">required</span>
          </div>
          <textarea
            rows={4}
            placeholder="Tell us what would make Cloudiezzz even better..."
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
          />
        </label>
      </div>
      {error && <div className="form-error">{error}</div>}
      <button className="review-submit" onClick={handleSubmit} disabled={loading}>
        {loading ? 'Sending...' : 'Send Suggestion ✨'}
      </button>
    </section>
  );
}
