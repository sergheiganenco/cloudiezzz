'use client';

import { useState, useEffect, useCallback } from 'react';
import { toggleVoiceEnabled, isVoiceEnabled, initVoice } from '@/lib/audio';

export default function VoiceToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    initVoice();
    setEnabled(isVoiceEnabled());
  }, []);

  const toggle = useCallback(() => {
    const nowEnabled = toggleVoiceEnabled();
    setEnabled(nowEnabled);
  }, []);

  return (
    <button
      className={`voice-toggle${enabled ? '' : ' muted'}`}
      onClick={toggle}
      aria-label={enabled ? 'Mute all sounds' : 'Unmute all sounds'}
      title={enabled ? 'Mute all sounds' : 'Unmute all sounds'}
    >
      {enabled ? '🔊' : '🔇'}
    </button>
  );
}
