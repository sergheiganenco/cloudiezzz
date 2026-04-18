'use client';

import { useState, useEffect, useRef } from 'react';
import { speakText } from '@/lib/audio';

export const HELPER_TIPS: Record<string, { face: string; text: string }> = {
  buyer_name:    { face: '(\u25D5\u203F\u25D5)',       text: "Just your name \u2014 no titles needed!" },
  buyer_email:   { face: '(\u273F\u25E0\u203F\u25E0)', text: "We\u2019ll send your song here!" },
  due_date:      { face: '(\u2299\u1D17\u2299)',       text: "Need it sooner? Add rush delivery!" },
  buyer_phone:   { face: '(\uFFE3\u03C9\uFFE3)',       text: "Optional \u2014 but quicker for chats" },
  rec_name:      { face: '(\u2661\u02D9\uFE36\u02D9\u2661)', text: "The name they actually go by!" },
  rec_age:       { face: '(\u3065\uFF61\u25D5\u203F\u203F\u25D5\uFF61)', text: "Helps us match the vibe perfectly" },
  others:        { face: '\u30FE(\uFF3E\u2207\uFF3E)',  text: "Names plus roles work best!" },
  how_met:       { face: '(\u273F \u2665\u203F\u2665)', text: "Real stories make real magic" },
  memories:      { face: '(\u2605\u03C9\u2605)',        text: "Be specific! Tiny details make huge impact" },
  love_about:    { face: '(\u25CD\u2022\u1D17\u2022\u25CD)', text: "What\u2019s truly unique about them?" },
  feeling:       { face: '(\u3063\u25D4\u25E1\u25D4)\u3063', text: "Joyful tears? Belly laughs? You decide!" },
  one_line:      { face: '(\u2727\u03C9\u2727)',        text: "If you only had 5 seconds..." },
  avoid:         { face: '(\u2022\u0131_\u2022\u0131)', text: "Anything to keep out of the song" },
  references:    { face: '\u266A(\u00B4\u25BD\uFF40)',  text: "Songs that match your dream vibe" },
  must_include:  { face: '(\u25D1\u203F\u25D0)',        text: "Names, dates, secret phrases!" },
  catchphrase:   { face: '(\u00AC\u203F\u00AC)',        text: "Their signature saying!" },
  credit:        { face: '(\u25E0\u203F\u25E0\u273F)',  text: "How should we sign the lyric sheet?" },
  anything_else: { face: '(\u273F\u25E1\u203F\u25E1)', text: "Last chance to add magic!" },
  couponInput:   { face: '(\u272A\u203F\u272A)\uFF89',  text: "Try CLOUD twenty five for twenty five percent off!" },
};

interface CloudHelperProps {
  activeFieldId?: string;
  activeFieldRect?: DOMRect | null;
}

export default function CloudHelper({ activeFieldId, activeFieldRect }: CloudHelperProps) {
  const [visible, setVisible] = useState(false);
  const lastSpokenRef = useRef<string | null>(null);

  const tip = activeFieldId ? HELPER_TIPS[activeFieldId] : null;

  /* Show / hide based on whether we have a matching tip */
  useEffect(() => {
    if (tip && activeFieldRect) {
      setVisible(true);
    } else {
      setVisible(false);
      lastSpokenRef.current = null;
    }
  }, [tip, activeFieldRect]);

  /* Speak when a new field becomes active */
  useEffect(() => {
    if (tip && activeFieldId && activeFieldId !== lastSpokenRef.current) {
      lastSpokenRef.current = activeFieldId;
      speakText(tip.text);
    }
  }, [activeFieldId, tip]);

  /* Compute position */
  const style: React.CSSProperties = { position: 'fixed' };

  if (activeFieldRect) {
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 760;
    const helperWidth = 260;
    const gap = 16;

    if (isDesktop) {
      const rightEdge = activeFieldRect.right + gap + helperWidth;
      if (rightEdge <= window.innerWidth) {
        // Position to the right of the field
        style.left = activeFieldRect.right + gap;
        style.top = activeFieldRect.top;
      } else {
        // Not enough space on the right — position below
        style.left = activeFieldRect.left;
        style.top = activeFieldRect.bottom + gap;
      }
    } else {
      // Mobile: always below
      style.left = activeFieldRect.left;
      style.top = activeFieldRect.bottom + gap;
    }
  }

  return (
    <div className={`cloud-helper${visible ? ' visible' : ''}`} style={style}>
      {/* Aura */}
      <div className="cloud-aura" />

      {/* Glitter sparkles */}
      <span className="cloud-glitter g1">✦</span>
      <span className="cloud-glitter g2">✦</span>
      <span className="cloud-glitter g3">✦</span>
      <span className="cloud-glitter g4">✦</span>
      <span className="cloud-glitter g5">✦</span>
      <span className="cloud-glitter g6">✿</span>
      <span className="cloud-glitter g7">★</span>

      {/* Cloud body */}
      <div className="cloud-body">
        <span className="cloud-face">{tip?.face ?? '(◕‿◕)'}</span>
        <span className="cloud-text">{tip?.text ?? ''}</span>
      </div>
    </div>
  );
}
