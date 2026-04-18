'use client';

import { useState, useCallback } from 'react';
import { playChord } from '@/lib/audio';

const REFERRAL_CODE = 'CLOUDFRIEND';
const SHARE_MESSAGE = `I just discovered Cloudiezzz — they create custom songs from your story using AI! Use my code ${REFERRAL_CODE} for 20% off your first song ✿`;
const SHARE_URL = 'https://cloudiezzz.com';

export default function RecommendSection() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const text = `${SHARE_MESSAGE} ${SHARE_URL}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      playChord([523.25, 659.25, 783.99], { type: 'triangle', dur: 0.3, stagger: 0.05, vol: 0.13 });
      setTimeout(() => setCopied(false), 2200);
    }
  }, []);

  function shareVia(channel: string) {
    const msg = encodeURIComponent(SHARE_MESSAGE);
    const url = encodeURIComponent(SHARE_URL);
    const fullMsg = encodeURIComponent(`${SHARE_MESSAGE} ${SHARE_URL}`);
    let shareUrl = '';
    switch (channel) {
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent('Check out Cloudiezzz ✿')}&body=${fullMsg}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${fullMsg}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${url}&text=${msg}`;
        break;
      case 'sms':
        shareUrl = `sms:?&body=${fullMsg}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${msg}&url=${url}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${msg}`;
        break;
    }
    if (shareUrl) window.open(shareUrl, '_blank');
    playChord([523.25, 659.25, 880], { type: 'sine', dur: 0.4, stagger: 0.06, vol: 0.13 });
  }

  return (
    <section className="recommend">
      <div className="recommend-grid">
        <div>
          <h2>
            Recommend us &amp; <em>both win</em> ✿
          </h2>
          <div className="sub">Share Cloudiezzz with someone special</div>
          <ul className="perks">
            <li>
              Your friend gets <strong>20% off</strong> their first song
            </li>
            <li>
              You earn a <strong>free song credit</strong> for every referral
            </li>
            <li>Unlimited shares — gift the magic to everyone!</li>
          </ul>
        </div>

        <div className="referral-box">
          <div className="ref-label">Your referral code</div>
          <div className="referral-code">
            <div className="code">{REFERRAL_CODE}</div>
            <button
              className={`copy-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
            >
              {copied ? 'Copied! ✓' : 'Copy'}
            </button>
          </div>
          <div className="ref-label" style={{ textAlign: 'center', marginBottom: 12 }}>
            Or share directly
          </div>
          <div className="share-buttons">
            <button className="share-btn email" onClick={() => shareVia('email')} title="Email">✉</button>
            <button className="share-btn whatsapp" onClick={() => shareVia('whatsapp')} title="WhatsApp">💬</button>
            <button className="share-btn telegram" onClick={() => shareVia('telegram')} title="Telegram">✈</button>
            <button className="share-btn sms" onClick={() => shareVia('sms')} title="Text message">📱</button>
            <button className="share-btn twitter" onClick={() => shareVia('twitter')} title="Twitter / X">𝕏</button>
            <button className="share-btn facebook" onClick={() => shareVia('facebook')} title="Facebook">f</button>
          </div>
        </div>
      </div>
    </section>
  );
}
