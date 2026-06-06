export default function Hero() {
  return (
    <section className="hero">
      <h1>
        Tell us the <em>story</em>.<br />
        We&apos;ll write the <em>song</em>.
      </h1>
      <div className="ornament">
        <div className="ornament-dot" />
        <div className="ornament-dot big" />
        <div className="ornament-dot" />
      </div>
      <p className="lede">
        Six fun questions. The more specific your answers — the people, the places,
        the small things only you know — the more unforgettable your song will be.
      </p>
      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <a href="#commission" className="btn primary hero-cta">
          Start Your Song ✿
        </a>
      </div>
      <div style={{
        marginTop: 18, display: 'flex', gap: 20, justifyContent: 'center',
        flexWrap: 'wrap', fontSize: 14, fontWeight: 600, color: '#7a6f5f',
      }}>
        <span>✓ Free revisions</span>
        <span>✓ 7-day money-back guarantee</span>
        <span>✓ Delivered in ~48h</span>
      </div>
      <div className="promo">
        <div className="promo-icon">★</div>
        <div className="promo-text">
          Order now &amp; save <strong>25% off!</strong>
          <small>
            Limited time — use code <strong style={{ fontSize: 18 }}>CLOUD25</strong>
          </small>
        </div>
      </div>
    </section>
  );
}
