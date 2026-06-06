import type { Metadata } from 'next';
import LegalPage, { LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy — Cloudiezzz',
  description: 'How Cloudiezzz collects, uses, and protects your information.',
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="June 6, 2026">
      <p>
        This Privacy Policy explains what information Cloudiezzz collects, how we use it, and the
        choices you have. We only collect what we need to create your song and run our service.
      </p>

      <LegalSection heading="Information we collect">
        <p>
          <strong>You provide:</strong> your name, email, optional phone number, and the details you
          enter to create a song (recipient, story, preferences, etc.).<br />
          <strong>Automatically:</strong> basic usage data and a locally-stored draft of your order
          so you don&rsquo;t lose progress. Payment card details are entered directly with Stripe — we
          never see or store your full card number.
        </p>
      </LegalSection>

      <LegalSection heading="How we use your information">
        <p>
          To create and deliver your song, process payment, send order updates, respond to messages,
          and improve our service. The story details you provide are used to write your song and may
          be processed by AI-assisted writing tools as part of production.
        </p>
      </LegalSection>

      <LegalSection heading="Service providers we share with">
        <p>
          We share only what&rsquo;s necessary with trusted providers: <strong>Stripe</strong>{' '}
          (payments), <strong>Resend</strong> (email delivery), <strong>Vercel</strong> (hosting and
          file storage), and <strong>Anthropic</strong> (AI-assisted drafting). We do not sell your
          personal information.
        </p>
      </LegalSection>

      <LegalSection heading="Data retention">
        <p>
          We keep order information for as long as needed to provide the service and meet legal or
          accounting requirements. You can ask us to delete your personal data at any time, subject to
          those requirements.
        </p>
      </LegalSection>

      <LegalSection heading="Your choices">
        <p>
          You can unsubscribe from non-essential emails using the link in any message or our{' '}
          <a href="/unsubscribe" style={{ color: '#ec4899', fontWeight: 600 }}>unsubscribe page</a>.
          To access or delete your data, email us at{' '}
          <a href="mailto:hello@cloudiezzz.com" style={{ color: '#ec4899', fontWeight: 600 }}>
            hello@cloudiezzz.com
          </a>.
        </p>
      </LegalSection>

      <LegalSection heading="Children">
        <p>
          Our service is intended for adults. We do not knowingly collect personal information from
          children under 13. A song may be <em>about</em> a child, but the account and order must be
          placed by an adult.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about privacy? Email{' '}
          <a href="mailto:hello@cloudiezzz.com" style={{ color: '#ec4899', fontWeight: 600 }}>
            hello@cloudiezzz.com
          </a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
