'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        router.push('/admin');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '40px 24px' }}>
      <div className="card" style={{ maxWidth: 420, width: '100%', padding: '48px 44px', minHeight: 'auto' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div className="brand-mark" style={{ fontSize: 36 }}>
            Cloudie<span>zzz</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span className="step-num">Admin Dashboard</span>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: 'rgba(236, 72, 153, 0.1)',
              border: '2px solid var(--pink)',
              borderRadius: 12,
              padding: '10px 16px',
              marginBottom: 20,
              fontFamily: "'Fredoka', sans-serif",
              fontSize: 14,
              color: 'var(--pink-deep)',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontFamily: "'Fredoka', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--ink-mute)',
              marginBottom: 6,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="field"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{
              display: 'block',
              fontFamily: "'Fredoka', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--ink-mute)',
              marginBottom: 6,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="field"
              style={{ width: '100%' }}
            />
          </div>

          <button type="submit" disabled={loading} className="btn primary" style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '16px 28px' }}>
            {loading ? 'Signing in...' : 'Sign In ✿'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <a href="/" style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 13, color: 'var(--ink-mute)', textDecoration: 'none' }}>
            &larr; Back to Cloudiezzz
          </a>
        </div>
      </div>
    </div>
  );
}
