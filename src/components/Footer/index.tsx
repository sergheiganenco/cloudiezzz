const linkStyle = { color: '#7a6f5f', textDecoration: 'none', fontSize: 14, lineHeight: 2 } as const;
const headStyle = {
  fontSize: 12, fontWeight: 700, color: '#b5aa9a', textTransform: 'uppercase' as const,
  letterSpacing: 0.6, margin: '0 0 8px',
};

export default function Footer() {
  return (
    <footer style={{ marginTop: 48, borderTop: '1px solid #f0e6db', background: 'transparent' }}>
      <div style={{
        maxWidth: 980, margin: '0 auto', padding: '36px 22px 8px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 24,
      }}>
        <div>
          <div style={{ fontWeight: 800, color: '#ec4899', fontSize: 18, marginBottom: 8 }}>Cloudiezzz</div>
          <p style={{ color: '#8b7e6e', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            Custom songs, made with love — one story at a time.
          </p>
        </div>
        <div>
          <p style={headStyle}>Explore</p>
          <a href="/#commission" style={linkStyle}>Order a song</a><br />
          <a href="/samples" style={linkStyle}>Samples</a><br />
          <a href="/reviews" style={linkStyle}>Reviews</a><br />
          <a href="/faq" style={linkStyle}>FAQ</a>
        </div>
        <div>
          <p style={headStyle}>Support</p>
          <a href="/contact" style={linkStyle}>Contact</a><br />
          <a href="/find-order" style={linkStyle}>Find my order</a><br />
          <a href="mailto:hello@cloudiezzz.com" style={linkStyle}>hello@cloudiezzz.com</a>
        </div>
        <div>
          <p style={headStyle}>Legal</p>
          <a href="/terms" style={linkStyle}>Terms of Service</a><br />
          <a href="/privacy" style={linkStyle}>Privacy Policy</a><br />
          <a href="/refund-policy" style={linkStyle}>Refund Policy</a>
        </div>
      </div>
      <div style={{ textAlign: 'center', padding: '12px 22px 24px', color: '#b5aa9a', fontSize: 13 }}>
        Made with <span style={{ color: '#ec4899' }}>♥</span> by Cloudiezzz · © 2026 Cloudiezzz
      </div>
    </footer>
  );
}
