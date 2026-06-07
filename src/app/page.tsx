import Hero from '@/components/Hero';
import TrustBar from '@/components/TrustBar';
import HowItWorks from '@/components/HowItWorks';
import CommissionCard from '@/components/CommissionCard';
import ReviewCarousel from '@/components/ReviewCarousel';
import Footer from '@/components/Footer';

// Refresh the live trust-bar stats every 10 minutes (ISR).
export const revalidate = 600;

export default function HomePage() {
  return (
    <div className="wrap">
      <Hero />
      <TrustBar />
      <HowItWorks />
      <CommissionCard />
      <ReviewCarousel />
      <Footer />
    </div>
  );
}
