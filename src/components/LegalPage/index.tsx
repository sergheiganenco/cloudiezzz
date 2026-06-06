import Footer from '@/components/Footer';

export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="wrap">
      <article style={{ maxWidth: 760, margin: '0 auto', padding: '48px 22px 24px' }}>
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 36px)', color: '#2a2418', margin: '0 0 6px' }}>
          {title}
        </h1>
        <p style={{ color: '#b5aa9a', fontSize: 13, margin: '0 0 28px' }}>Last updated: {updated}</p>
        <div
          style={{ color: '#5d5346', fontSize: 15, lineHeight: 1.75 }}
          className="legal-body"
        >
          {children}
        </div>
      </article>
      <Footer />
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 26 }}>
      <h2 style={{ fontSize: 19, color: '#2a2418', margin: '0 0 8px' }}>{heading}</h2>
      <div>{children}</div>
    </section>
  );
}
