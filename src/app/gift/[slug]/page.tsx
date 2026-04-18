'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface GiftData {
  recName: string | null;
  occasion: string | null;
  mood: string | null;
  language: string;
  files: { type: string; name: string; url: string }[];
}

export default function GiftReveal() {
  const params = useParams();
  const slug = params.slug as string;
  const [gift, setGift] = useState<GiftData | null>(null);
  const [error, setError] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    fetch(`/api/gift/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setGift)
      .catch(() => setError(true));
  }, [slug]);

  if (error) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <h1 style={s.logo}>Cloudiezzz</h1>
          <p style={s.errorText}>This gift isn&apos;t ready yet, or the link is invalid.</p>
          <a href="/" style={s.homeLink}>Visit Cloudiezzz</a>
        </div>
      </div>
    );
  }

  if (!gift) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <p style={s.loading}>Preparing your surprise...</p>
        </div>
      </div>
    );
  }

  if (!revealed) {
    return (
      <div style={s.page}>
        <div style={s.revealCard}>
          <div style={s.sparkles}>
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} style={{
                ...s.sparkle,
                animationDelay: `${i * 0.15}s`,
                left: `${15 + i * 10}%`,
                top: `${20 + (i % 3) * 20}%`,
              }}>
                {['*', '+', '*', '+', '*', '+', '*', '+'][i]}
              </span>
            ))}
          </div>
          <h1 style={s.logo}>Cloudiezzz</h1>
          <p style={s.revealSubtitle}>Someone special made something for you</p>
          {gift.recName && (
            <p style={s.revealName}>
              Dear <strong>{gift.recName}</strong>,
            </p>
          )}
          <p style={s.revealMsg}>
            A custom song was created just for you
            {gift.occasion ? ` for your ${gift.occasion.toLowerCase()}` : ''}.
          </p>
          <button onClick={() => setRevealed(true)} style={s.revealBtn}>
            Unwrap Your Song
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.logo}>Cloudiezzz</h1>
        {gift.recName && (
          <h2 style={s.giftTitle}>
            {gift.recName}&apos;s Song
          </h2>
        )}
        {gift.occasion && (
          <p style={s.giftOccasion}>{gift.occasion}</p>
        )}

        {/* Audio player */}
        {gift.files.filter((f) => f.type === 'final').map((f, i) => (
          <div key={i} style={s.playerWrap}>
            <audio controls style={s.player} src={f.url}>
              Your browser does not support audio playback.
            </audio>
            <a href={f.url} download style={s.downloadBtn}>
              Download Song
            </a>
          </div>
        ))}

        {/* Lyric video */}
        {gift.files.filter((f) => f.type === 'lyric_video').map((f, i) => (
          <div key={i} style={s.videoWrap}>
            <a href={f.url} style={s.downloadBtn}>
              Watch Lyric Video
            </a>
          </div>
        ))}

        <div style={s.footer}>
          <p style={s.footerText}>Made with love on Cloudiezzz</p>
          <a href="/" style={s.homeLink}>Create your own custom song</a>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg, #fce7f3, #fef3c7, #fce7f3)', fontFamily: 'Fredoka, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { background: '#fff', borderRadius: 24, padding: '48px 36px', maxWidth: 500, width: '100%', boxShadow: '0 8px 40px rgba(236,72,153,0.12)', textAlign: 'center' as const },
  revealCard: { background: '#fff', borderRadius: 24, padding: '60px 40px', maxWidth: 480, width: '100%', boxShadow: '0 8px 40px rgba(236,72,153,0.15)', textAlign: 'center' as const, position: 'relative' as const, overflow: 'hidden' },
  logo: { fontFamily: 'Modak, cursive', fontSize: 42, color: '#ec4899', margin: '0 0 8px' },
  loading: { color: '#8b7e6e', fontSize: 16, padding: 40 },
  errorText: { color: '#dc2626', fontSize: 15, padding: 20 },
  homeLink: { color: '#ec4899', fontSize: 14, textDecoration: 'none' },
  sparkles: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' as const },
  sparkle: { position: 'absolute' as const, fontSize: 24, color: '#fde047', animation: 'float 2s ease-in-out infinite', opacity: 0.6 },
  revealSubtitle: { color: '#8b7e6e', fontSize: 15, marginBottom: 24 },
  revealName: { fontFamily: 'Dancing Script, cursive', fontSize: 28, color: '#2a2418', marginBottom: 8 },
  revealMsg: { color: '#5d5346', fontSize: 16, lineHeight: 1.6, marginBottom: 32 },
  revealBtn: { padding: '16px 40px', background: 'linear-gradient(135deg, #ec4899, #f97316)', color: '#fff', border: 'none', borderRadius: 16, fontSize: 18, fontWeight: 700, cursor: 'pointer', fontFamily: 'Fredoka, sans-serif', boxShadow: '0 4px 20px rgba(236,72,153,0.3)', transition: 'transform 0.2s' },
  giftTitle: { fontFamily: 'Dancing Script, cursive', fontSize: 32, color: '#2a2418', marginBottom: 4 },
  giftOccasion: { color: '#ec4899', fontSize: 15, fontWeight: 600, marginBottom: 24 },
  playerWrap: { margin: '24px 0', display: 'flex', flexDirection: 'column' as const, gap: 12, alignItems: 'center' },
  player: { width: '100%', maxWidth: 400, borderRadius: 8 },
  downloadBtn: { display: 'inline-block', padding: '10px 24px', background: '#fce7f3', color: '#ec4899', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14 },
  videoWrap: { margin: '16px 0' },
  footer: { marginTop: 32, paddingTop: 24, borderTop: '1px solid #f0ebe4' },
  footerText: { color: '#b5aa9a', fontSize: 13, marginBottom: 8 },
};
