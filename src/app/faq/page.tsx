import type { Metadata } from 'next';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'FAQ — Cloudiezzz',
  description: 'Answers to common questions about ordering a custom song from Cloudiezzz.',
};

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How does it work?',
    a: 'Tell us the story in a few quick questions, we write and produce an original song in your chosen style, then you listen to a draft, request any changes, and download the finished song.',
  },
  {
    q: 'How long does it take?',
    a: 'Most songs are delivered within 48–72 hours depending on your package. Need it sooner? Add rush 24-hour delivery at checkout.',
  },
  {
    q: 'What languages can my song be in?',
    a: 'Over 35 languages, including English, Spanish, Portuguese, French, German, Italian, Russian, Hindi, Tamil, Arabic, Hebrew, Mandarin, Japanese, Korean, and many more — or a mix.',
  },
  {
    q: 'What music styles can I choose?',
    a: 'A wide range across Pop & Rock, Acoustic & Country, Hip-hop & R&B, Electronic, Latin (Salsa, Bachata, Reggaeton and more), World styles (K-pop, Bollywood, Afrobeats), plus Jazz, Gospel, Classical, Musical and others. You also pick mood, tempo, and vocal type.',
  },
  {
    q: 'Can I request changes?',
    a: 'Yes. When your draft is ready you can approve it or request changes right on your order page. Every package includes revisions; Premium and Business include unlimited revisions.',
  },
  {
    q: 'What if I don’t like it?',
    a: 'We offer a 7-day money-back guarantee. If a revision can’t make it right, we’ll refund you. See our Refund Policy for details.',
  },
  {
    q: 'Is the song made by a person or AI?',
    a: 'Your song is crafted by our songwriters using professional, AI-assisted production tools. The story, emotion, and direction come from you.',
  },
  {
    q: 'What do I receive?',
    a: 'A high-quality MP3 of your song. Depending on your package you may also get a lyric sheet, additional versions, or a lyric video. Add-ons like instrumentals and printed lyric cards are available.',
  },
  {
    q: 'Can I use my song commercially?',
    a: 'Songs are for personal use by default. For advertising, monetized content, or business use, choose the Business package or ask us about a commercial license.',
  },
  {
    q: 'Can I send it as a gift?',
    a: 'Absolutely — every order comes with a shareable gift page that reveals the song to your recipient with a personal touch.',
  },
  {
    q: 'I lost my order link. How do I find it?',
    a: 'Use the Find my order page to have your link emailed to you again, or contact us at hello@cloudiezzz.com.',
  },
];

export default function FaqPage() {
  return (
    <div className="wrap">
      <article style={{ maxWidth: 760, margin: '0 auto', padding: '48px 22px 24px' }}>
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 36px)', color: '#2a2418', margin: '0 0 6px' }}>
          Frequently asked questions
        </h1>
        <p style={{ color: '#8b7e6e', fontSize: 15, margin: '0 0 28px' }}>
          Everything you need to know before ordering your song.
        </p>

        <div>
          {FAQS.map((item) => (
            <details
              key={item.q}
              style={{
                background: '#fff', border: '2px solid #fce7f3', borderRadius: 14,
                padding: '14px 18px', marginBottom: 12,
              }}
            >
              <summary style={{
                cursor: 'pointer', fontWeight: 700, color: '#2a2418', fontSize: 16,
                listStyle: 'none',
              }}>
                {item.q}
              </summary>
              <p style={{ color: '#5d5346', fontSize: 15, lineHeight: 1.7, margin: '10px 0 0' }}>
                {item.a}
              </p>
            </details>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <p style={{ color: '#5d5346', fontSize: 15 }}>Still have a question?</p>
          <a
            href="/contact"
            style={{
              display: 'inline-block', marginTop: 8, padding: '12px 28px', background: '#ec4899',
              color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 15,
            }}
          >
            Contact us
          </a>
        </div>
      </article>
      <Footer />
    </div>
  );
}
