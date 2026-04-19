import Hero from '@/components/Hero';
import TrustBar from '@/components/TrustBar';
import CommissionCard from '@/components/CommissionCard';
import ReviewCarousel from '@/components/ReviewCarousel';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <div className="wrap">
      <Hero />
      <TrustBar />
      <CommissionCard />
      <ReviewCarousel />
      <Footer />
    </div>
  );
}
