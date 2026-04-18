export default function Contact() {
  return (
    <section className="contact">
      <div className="contact-grid">
        <div>
          <h2>
            Get in <em>touch</em>
          </h2>
          <div className="sub">We&apos;d love to hear from you ✿</div>
          <ul className="contact-list">
            <li>
              <div className="ic">✉</div>
              <a href="mailto:hello@cloudiezzz.com">
                <span className="lbl-c">Email us</span>
                <span className="val">hello@cloudiezzz.com</span>
              </a>
            </li>
            <li>
              <div className="ic d">💬</div>
              <a href="https://wa.me/15555550100" target="_blank" rel="noopener noreferrer">
                <span className="lbl-c">WhatsApp</span>
                <span className="val">+1 (555) 555-0100</span>
              </a>
            </li>
            <li>
              <div className="ic b">✈</div>
              <a href="https://t.me/cloudiezzz" target="_blank" rel="noopener noreferrer">
                <span className="lbl-c">Telegram</span>
                <span className="val">@cloudiezzz</span>
              </a>
            </li>
            <li>
              <div className="ic c">♥</div>
              <a href="https://instagram.com/cloudiezzz" target="_blank" rel="noopener noreferrer">
                <span className="lbl-c">Instagram</span>
                <span className="val">@cloudiezzz</span>
              </a>
            </li>
          </ul>
        </div>
        <div className="contact-cta">
          <div className="big">24/7</div>
          <div className="small">we reply within hours</div>
          <div className="hours">
            <b>Studio hours</b>
            <br />
            Monday – Friday · 9am – 9pm EST
            <br />
            Saturday – Sunday · 11am – 6pm EST
            <br />
            <br />
            <b>Based in</b> Charlotte, NC
            <br />
            Serving customers worldwide 🌍
          </div>
        </div>
      </div>
    </section>
  );
}
