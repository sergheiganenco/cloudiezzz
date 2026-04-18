'use client';

import { useState, useEffect, useRef } from 'react';

interface Sample {
  id: string;
  title: string;
  description: string | null;
  genre: string;
  mood: string | null;
  occasion: string | null;
  language: string;
  audioUrl: string;
  duration: number;
}

export default function SamplesGallery() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [filter, setFilter] = useState('all');
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch('/api/samples')
      .then((r) => r.json())
      .then((d) => setSamples(d.samples || []))
      .catch(console.error);
  }, []);

  const genres = ['all', ...Array.from(new Set(samples.map((s) => s.genre)))];
  const filtered = filter === 'all' ? samples : samples.filter((s) => s.genre === filter);

  const togglePlay = (sample: Sample) => {
    if (playing === sample.id) {
      audioRef.current?.pause();
      setPlaying(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(sample.audioUrl);
      audio.onended = () => setPlaying(null);
      audio.play().catch(() => {});
      audioRef.current = audio;
      setPlaying(sample.id);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.container}>
        <a href="/" style={s.backLink}>Back to Cloudiezzz</a>
        <h1 style={s.title}>Listen to Our Work</h1>
        <p style={s.subtitle}>Preview samples from real orders (anonymized with permission)</p>

        {/* Genre filters */}
        <div style={s.filters}>
          {genres.map((g) => (
            <button key={g} onClick={() => setFilter(g)} style={{
              ...s.filterBtn,
              background: filter === g ? '#ec4899' : '#fff',
              color: filter === g ? '#fff' : '#5d5346',
            }}>
              {g === 'all' ? 'All Genres' : g}
            </button>
          ))}
        </div>

        {/* Samples grid */}
        <div style={s.grid}>
          {filtered.map((sample) => {
            const isPlaying = playing === sample.id;
            return (
              <div key={sample.id} style={s.card}>
                <div style={s.cardTop}>
                  <button onClick={() => togglePlay(sample)} style={{
                    ...s.playBtn,
                    background: isPlaying ? '#ec4899' : '#fce7f3',
                    color: isPlaying ? '#fff' : '#ec4899',
                  }}>
                    {isPlaying ? '\u275A\u275A' : '\u25B6'}
                  </button>
                  <div>
                    <h3 style={s.cardTitle}>{sample.title}</h3>
                    <p style={s.cardMeta}>{sample.genre} {sample.mood ? `/ ${sample.mood}` : ''}</p>
                  </div>
                </div>
                {sample.description && (
                  <p style={s.cardDesc}>{sample.description}</p>
                )}
                <div style={s.cardFooter}>
                  {sample.occasion && <span style={s.tag}>{sample.occasion}</span>}
                  <span style={s.duration}>{sample.duration}s preview</span>
                </div>
                {isPlaying && <div style={s.playingBar} />}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: '#8b7e6e', padding: 40 }}>
            No samples in this genre yet. Check back soon!
          </p>
        )}

        {/* CTA */}
        <div style={s.cta}>
          <h2 style={s.ctaTitle}>Ready to create your own song?</h2>
          <a href="/#commission" style={s.ctaBtn}>Start Your Order</a>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#faf7f2', fontFamily: 'Fredoka, sans-serif' },
  container: { maxWidth: 900, margin: '0 auto', padding: '40px 24px' },
  backLink: { color: '#ec4899', fontSize: 14, textDecoration: 'none' },
  title: { fontFamily: 'Modak, cursive', fontSize: 42, color: '#ec4899', textAlign: 'center' as const, marginTop: 16, marginBottom: 4 },
  subtitle: { textAlign: 'center' as const, color: '#8b7e6e', fontSize: 15, marginBottom: 32 },
  filters: { display: 'flex', flexWrap: 'wrap' as const, gap: 8, justifyContent: 'center', marginBottom: 32 },
  filterBtn: { padding: '8px 16px', borderRadius: 20, border: '1px solid #e0d8ce', cursor: 'pointer', fontSize: 13, fontFamily: 'Fredoka, sans-serif' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 },
  card: { background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', position: 'relative' as const, overflow: 'hidden' },
  cardTop: { display: 'flex', gap: 14, alignItems: 'center', marginBottom: 12 },
  playBtn: { width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' },
  cardTitle: { fontSize: 16, fontWeight: 600, color: '#2a2418', margin: 0 },
  cardMeta: { fontSize: 13, color: '#8b7e6e', margin: '2px 0 0' },
  cardDesc: { fontSize: 14, color: '#5d5346', lineHeight: 1.5, margin: '0 0 12px' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tag: { background: '#fce7f3', color: '#ec4899', padding: '2px 10px', borderRadius: 10, fontSize: 12, fontWeight: 600 },
  duration: { fontSize: 12, color: '#b5aa9a' },
  playingBar: { position: 'absolute' as const, bottom: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #ec4899, #f97316)', animation: 'pulse 1s infinite' },
  cta: { textAlign: 'center' as const, marginTop: 48, padding: '40px 20px', background: '#fff', borderRadius: 20 },
  ctaTitle: { fontFamily: 'Modak, cursive', fontSize: 28, color: '#ec4899', marginBottom: 16 },
  ctaBtn: { display: 'inline-block', padding: '14px 36px', background: '#ec4899', color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 600, fontSize: 16 },
};
