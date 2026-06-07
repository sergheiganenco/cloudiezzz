'use client';

import { useState } from 'react';
import Footer from '@/components/Footer';

export default function FindOrderPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/order/find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSent(true);
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="wrap">
      <article style={{ maxWidth: 520, margin: '0 auto', padding: '56px 22px 24px' }}>
        <h1 style={{ fontSize: 'clamp(24px, 5vw, 32px)', color: '#2a2418', margin: '0 0 6px' }}>
          Find my order
        </h1>
        <p style={{ color: '#8b7e6e', fontSize: 15, margin: '0 0 24px' }}>
          Lost your link? Enter the email you ordered with and we&rsquo;ll send your order link(s).
        </p>

        {sent ? (
          <div style={{
            background: '#ecfdf5', border: '2px solid #6ee7b7', borderRadius: 14,
            padding: '18px 20px', color: '#065f46', fontSize: 15, lineHeight: 1.6,
          }}>
            ✅ If we found any orders for <strong>{email}</strong>, we&rsquo;ve emailed your link(s).
            Please check your inbox (and spam folder).
          </div>
        ) : (
          <form onSubmit={submit}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #e5d5c8',
                fontSize: 15, boxSizing: 'border-box', fontFamily: 'inherit',
              }}
            />
            {error && <p style={{ color: '#dc2626', fontSize: 14, margin: '8px 0 0' }}>{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: 14, width: '100%', padding: '12px 20px', background: '#ec4899', color: '#fff',
                border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
                cursor: submitting ? 'default' : 'pointer',
              }}
            >
              {submitting ? 'Sending…' : 'Email me my order link'}
            </button>
          </form>
        )}

        <p style={{ color: '#b5aa9a', fontSize: 13, marginTop: 20, textAlign: 'center' }}>
          Still stuck? <a href="/contact" style={{ color: '#ec4899', fontWeight: 600 }}>Contact us</a>.
        </p>
      </article>
      <Footer />
    </div>
  );
}
