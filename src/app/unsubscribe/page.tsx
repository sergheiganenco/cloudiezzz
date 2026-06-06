'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function Unsubscribe() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  useEffect(() => {
    if (!email) {
      setState('error');
      return;
    }
    setState('loading');
    fetch('/api/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
      .then((r) => setState(r.ok ? 'done' : 'error'))
      .catch(() => setState('error'));
  }, [email]);

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.logo}>Cloudiezzz</h1>
        {state === 'loading' && <p style={s.text}>Updating your preferences…</p>}
        {state === 'done' && (
          <>
            <div style={s.heart}>✓</div>
            <h2 style={s.title}>You&apos;re unsubscribed</h2>
            <p style={s.text}>
              You won&apos;t receive any more reminder emails. We&apos;re sorry to
              see you go!
            </p>
          </>
        )}
        {state === 'error' && (
          <>
            <h2 style={s.title}>Something went wrong</h2>
            <p style={s.text}>
              We couldn&apos;t process your request. Please contact us at
              hello@cloudiezzz.com and we&apos;ll take care of it.
            </p>
          </>
        )}
        <a href="/" style={s.link}>Back to Cloudiezzz</a>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div style={s.page}><div style={s.card}><p style={s.text}>Loading…</p></div></div>}>
      <Unsubscribe />
    </Suspense>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#faf7f2', fontFamily: 'Fredoka, sans-serif', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 16px' },
  card: { background: '#fff', borderRadius: 20, padding: '40px 32px', maxWidth: 480, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' },
  logo: { fontFamily: 'Modak, cursive', fontSize: 36, color: '#ec4899', margin: '0 0 24px' },
  heart: { fontSize: 56, color: '#10b981', lineHeight: 1, marginBottom: 12 },
  title: { fontSize: 22, color: '#2a2418', margin: '0 0 12px' },
  text: { fontSize: 15, color: '#5d5346', lineHeight: 1.6, marginBottom: 20 },
  link: { display: 'inline-block', color: '#ec4899', fontSize: 14, textDecoration: 'none', fontWeight: 600 },
};
