import { Metadata } from 'next';
import { redirect } from 'next/navigation';

const OCCASIONS: Record<string, {
  title: string;
  heading: string;
  description: string;
  emoji: string;
  defaultMood: string;
  suggestions: string[];
}> = {
  birthday: {
    title: 'Custom Birthday Song',
    heading: 'Make Their Birthday Unforgettable',
    description: 'Order a personalized birthday song that captures your relationship and celebrates their special day.',
    emoji: '🎂',
    defaultMood: 'upbeat',
    suggestions: ['Include their name and age', 'Mention favorite memories', 'Reference inside jokes'],
  },
  wedding: {
    title: 'Custom Wedding Song',
    heading: 'Your Love Story, In a Song',
    description: 'A bespoke wedding song for first dances, ceremonies, or proposals. Tell us your story and we\'ll write the soundtrack.',
    emoji: '💍',
    defaultMood: 'romantic',
    suggestions: ['How did you meet?', 'Your proposal story', 'What makes them the one?'],
  },
  anniversary: {
    title: 'Custom Anniversary Song',
    heading: 'Celebrate Your Years Together',
    description: 'From first anniversary to golden — a custom song that captures the journey you\'ve shared together.',
    emoji: '💝',
    defaultMood: 'heartfelt',
    suggestions: ['Your favorite shared memory', 'Where you first met', 'What you love most about them'],
  },
  memorial: {
    title: 'Memorial Song',
    heading: 'Honor Their Memory in Music',
    description: 'A beautiful, heartfelt tribute song that celebrates a life well-lived and keeps their memory alive.',
    emoji: '🕊',
    defaultMood: 'heartfelt',
    suggestions: ['Their favorite saying or phrase', 'Cherished moments together', 'What they meant to you'],
  },
  graduation: {
    title: 'Custom Graduation Song',
    heading: 'Celebrate Their Achievement',
    description: 'An inspiring custom song for the graduate in your life. Mark this milestone with music they\'ll never forget.',
    emoji: '🎓',
    defaultMood: 'upbeat',
    suggestions: ['Their journey and growth', 'Proud moments', 'Dreams for their future'],
  },
};

const VALID_OCCASIONS = Object.keys(OCCASIONS);

export async function generateMetadata({ params }: { params: Promise<{ occasion: string }> }): Promise<Metadata> {
  const { occasion } = await params;
  const data = OCCASIONS[occasion];
  if (!data) return {};
  return {
    title: `${data.title} | Cloudiezzz`,
    description: data.description,
  };
}

export default async function OccasionPage({ params }: { params: Promise<{ occasion: string }> }) {
  const { occasion } = await params;

  if (!VALID_OCCASIONS.includes(occasion)) {
    redirect('/');
  }

  const data = OCCASIONS[occasion];

  return (
    <div style={{ minHeight: '100vh', background: '#faf7f2', fontFamily: 'Fredoka, sans-serif' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '48px 24px' }}>
        {/* Nav */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <a href="/" style={{ fontFamily: 'Modak, cursive', fontSize: 36, color: '#ec4899', textDecoration: 'none' }}>
            Cloudiezzz
          </a>
        </div>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ fontSize: 56 }}>{data.emoji}</span>
          <h1 style={{ fontFamily: 'Modak, cursive', fontSize: 38, color: '#ec4899', marginTop: 8, marginBottom: 8 }}>
            {data.heading}
          </h1>
          <p style={{ fontSize: 17, color: '#5d5346', lineHeight: 1.6, maxWidth: 520, margin: '0 auto' }}>
            {data.description}
          </p>
        </div>

        {/* Tips */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '28px 32px', marginBottom: 32, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: 18, color: '#2a2418', marginBottom: 16 }}>
            Tips for the perfect {occasion} song:
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {data.suggestions.map((tip, i) => (
              <li key={i} style={{ padding: '8px 0', fontSize: 15, color: '#5d5346', borderBottom: i < data.suggestions.length - 1 ? '1px solid #f0ebe4' : 'none' }}>
                <span style={{ color: '#ec4899', marginRight: 8 }}>&#10047;</span> {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 40 }}>
          {[
            { value: '2,400+', label: 'songs delivered' },
            { value: '4.9', label: 'average rating' },
            { value: '48h', label: 'avg delivery' },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#ec4899' }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: '#8b7e6e' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <a href="/#commission" style={{
            display: 'inline-block', padding: '16px 40px', background: '#ec4899', color: '#fff',
            borderRadius: 14, textDecoration: 'none', fontWeight: 700, fontSize: 18,
            boxShadow: '0 4px 20px rgba(236,72,153,0.25)',
          }}>
            Start Your {occasion.charAt(0).toUpperCase() + occasion.slice(1)} Song
          </a>
          <p style={{ color: '#8b7e6e', fontSize: 14, marginTop: 12 }}>
            Starting at $39 — Use code CLOUD25 for 25% off
          </p>
        </div>
      </div>
    </div>
  );
}

// Generate static pages for all occasions
export function generateStaticParams() {
  return VALID_OCCASIONS.map((occasion) => ({ occasion }));
}
