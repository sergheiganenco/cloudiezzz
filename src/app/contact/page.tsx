import Contact from '@/components/Contact';
import FeatureBox from '@/components/FeatureBox';

export default function ContactPage() {
  return (
    <div className="wrap">
      <Contact />
      <div style={{ marginTop: 40 }}>
        <FeatureBox />
      </div>
    </div>
  );
}
