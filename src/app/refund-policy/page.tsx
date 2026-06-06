import type { Metadata } from 'next';
import LegalPage, { LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Refund Policy — Cloudiezzz',
  description: 'Our revisions and money-back guarantee for custom songs.',
};

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund Policy" updated="June 6, 2026">
      <p>
        We want you to love your song. This policy explains our revisions and money-back guarantee.
      </p>

      <LegalSection heading="Free revisions">
        <p>
          Every package includes revisions so we can get your song right. When your draft is ready,
          listen on your order page and request changes — we&rsquo;ll revise it. The number of
          included revisions depends on your package (the Premium and Business packages include
          unlimited revisions).
        </p>
      </LegalSection>

      <LegalSection heading="7-day money-back guarantee">
        <p>
          If you&rsquo;re not happy with your song, contact us within <strong>7 days</strong> of
          receiving your first draft and we&rsquo;ll work with you on revisions or issue a full
          refund. We&rsquo;d always rather make it right first — most concerns are solved with a quick
          revision.
        </p>
      </LegalSection>

      <LegalSection heading="How to request a refund">
        <p>
          Use the message thread on your order page, or email{' '}
          <a href="mailto:hello@cloudiezzz.com" style={{ color: '#ec4899', fontWeight: 600 }}>
            hello@cloudiezzz.com
          </a>{' '}
          with your order number. Approved refunds are returned to your original payment method,
          typically within 5–10 business days depending on your bank.
        </p>
      </LegalSection>

      <LegalSection heading="What&rsquo;s not covered">
        <p>
          Because each song is custom-made, requests made after the 7-day window, or after you have
          approved and downloaded the final song, may not be eligible. Add-ons that have already been
          produced and delivered (such as a printed lyric card that has been mailed) are
          non-refundable. We review every request individually and in good faith.
        </p>
      </LegalSection>

      <LegalSection heading="Questions">
        <p>
          We&rsquo;re happy to help — reach us any time at{' '}
          <a href="mailto:hello@cloudiezzz.com" style={{ color: '#ec4899', fontWeight: 600 }}>
            hello@cloudiezzz.com
          </a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
