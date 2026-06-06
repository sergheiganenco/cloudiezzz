const STEPS = [
  {
    icon: '✍️',
    title: 'Tell the story',
    text: 'Answer a few questions about the person and the moment you want to capture.',
  },
  {
    icon: '🎶',
    title: 'We write & produce',
    text: 'Our songwriters craft an original song in your chosen style, mood, and language.',
  },
  {
    icon: '💝',
    title: 'Listen, approve, share',
    text: 'Hear your draft, request any tweaks, then download and gift the finished song.',
  },
];

export default function HowItWorks() {
  return (
    <section
      style={{ maxWidth: 940, margin: '0 auto', padding: '40px 20px 8px' }}
      aria-label="How it works"
    >
      <h2 style={{
        textAlign: 'center', fontSize: 'clamp(22px, 4vw, 30px)', color: '#2a2418',
        margin: '0 0 6px',
      }}>
        How it works
      </h2>
      <p style={{ textAlign: 'center', color: '#8b7e6e', fontSize: 15, margin: '0 0 28px' }}>
        From your story to a finished song in three simple steps.
      </p>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18,
      }}>
        {STEPS.map((s, i) => (
          <div
            key={s.title}
            style={{
              background: '#fff', borderRadius: 18, padding: '26px 22px', textAlign: 'center',
              border: '2px solid #fce7f3', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ fontSize: 40, lineHeight: 1 }}>{s.icon}</div>
            <div style={{ fontWeight: 800, color: '#ec4899', fontSize: 13, marginTop: 10, letterSpacing: 0.5 }}>
              STEP {i + 1}
            </div>
            <div style={{ fontWeight: 700, color: '#2a2418', fontSize: 18, margin: '4px 0 8px' }}>
              {s.title}
            </div>
            <p style={{ color: '#5d5346', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
