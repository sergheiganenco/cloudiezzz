import type { Metadata } from 'next';
import LegalPage, { LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service — Cloudiezzz',
  description: 'The terms that govern your use of Cloudiezzz custom song services.',
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="June 6, 2026">
      <p>
        Welcome to Cloudiezzz. These Terms of Service (&ldquo;Terms&rdquo;) govern your use of our
        website and our custom song creation services (the &ldquo;Service&rdquo;). By placing an
        order, you agree to these Terms.
      </p>

      <LegalSection heading="1. The service">
        <p>
          Cloudiezzz creates original, custom songs based on the information you provide. Each song is
          produced by our songwriters and may use AI-assisted tools as part of the creative process.
          Delivery times, number of versions, and revisions depend on the package you select and are
          shown at checkout.
        </p>
      </LegalSection>

      <LegalSection heading="2. Orders and payment">
        <p>
          Payment is collected at the time of order through our payment processor, Stripe. Prices are
          shown in U.S. dollars. Your order begins production after payment is confirmed.
        </p>
      </LegalSection>

      <LegalSection heading="3. Revisions and approval">
        <p>
          When your draft is ready you can listen to it on your order page and either approve it or
          request changes. The number of included revisions depends on your package. Additional
          revisions beyond your package may incur a fee.
        </p>
      </LegalSection>

      <LegalSection heading="4. Ownership and licensing">
        <p>
          Once your order is paid and delivered, you receive the right to use your custom song for
          personal, non-commercial purposes (such as gifts, celebrations, and personal sharing).
          Commercial use — including advertising, monetized content, or resale — requires the
          Business package or a separate commercial license. Cloudiezzz retains the right to display
          delivered songs as portfolio samples unless you ask us in writing not to.
        </p>
      </LegalSection>

      <LegalSection heading="5. Your content and acceptable use">
        <p>
          You confirm that the names, stories, and details you submit are accurate and that you have
          the right to share them. You agree not to request content that is unlawful, hateful,
          harassing, defamatory, or that infringes anyone&rsquo;s rights. We may decline or cancel
          any order that violates these Terms.
        </p>
      </LegalSection>

      <LegalSection heading="6. Refunds">
        <p>
          Refunds are governed by our{' '}
          <a href="/refund-policy" style={{ color: '#ec4899', fontWeight: 600 }}>Refund Policy</a>.
        </p>
      </LegalSection>

      <LegalSection heading="7. Limitation of liability">
        <p>
          The Service is provided &ldquo;as is.&rdquo; To the fullest extent permitted by law,
          Cloudiezzz is not liable for indirect or consequential damages. Our total liability for any
          claim is limited to the amount you paid for the order in question.
        </p>
      </LegalSection>

      <LegalSection heading="8. Governing law">
        <p>
          These Terms are governed by the laws of the State of North Carolina, USA, without regard to
          conflict-of-law principles.
        </p>
      </LegalSection>

      <LegalSection heading="9. Contact">
        <p>
          Questions about these Terms? Email us at{' '}
          <a href="mailto:hello@cloudiezzz.com" style={{ color: '#ec4899', fontWeight: 600 }}>
            hello@cloudiezzz.com
          </a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
