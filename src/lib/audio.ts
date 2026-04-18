'use client';

// =====================================================
// AUDIO ENGINE — shared context for all sounds
// =====================================================
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let globalMuted = false;

export function getAudio(): AudioContext | null {
  if (globalMuted) return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function getMaster(): GainNode | null {
  const ctx = getAudio();
  if (!ctx) return null;
  if (!masterGain) {
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.6;
    masterGain.connect(ctx.destination);
  }
  return masterGain;
}

// Create a reverb convolver for richer sounds
let reverbNode: ConvolverNode | null = null;
let reverbGain: GainNode | null = null;

function getReverb(): GainNode | null {
  const ctx = getAudio();
  const dest = getMaster();
  if (!ctx || !dest) return null;
  if (!reverbNode) {
    const len = ctx.sampleRate * 1.5;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
      }
    }
    reverbNode = ctx.createConvolver();
    reverbNode.buffer = buf;
    reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.25;
    reverbNode.connect(reverbGain);
    reverbGain.connect(dest);
  }
  return reverbGain;
}

// =====================================================
// GLOBAL MUTE — controls ALL sounds + voice
// =====================================================
export function setGlobalMute(muted: boolean) {
  globalMuted = muted;
  if (muted) {
    // Kill all audio
    if (masterGain) masterGain.gain.value = 0;
    stopTheremin();
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  } else {
    if (masterGain) masterGain.gain.value = 0.6;
  }
}

export function isGlobalMuted(): boolean {
  return globalMuted;
}

// =====================================================
// NOTE PLAYER with optional reverb
// =====================================================
interface NoteOpts {
  type?: OscillatorType;
  dur?: number;
  vol?: number;
  delay?: number;
  vibrato?: boolean;
  vibratoDepth?: number;
  vibratoRate?: number;
  reverb?: boolean;
  detune?: number;
}

export function playNote(freq: number, opts: NoteOpts = {}) {
  const ctx = getAudio();
  const dest = getMaster();
  if (!ctx || !dest) return;
  const type = opts.type || 'sine';
  const dur = opts.dur || 0.4;
  const vol = opts.vol || 0.18;
  const delay = opts.delay || 0;
  const start = ctx.currentTime + delay;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  if (opts.detune) osc.detune.value = opts.detune;

  if (opts.vibrato) {
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = opts.vibratoRate || 5;
    lfoGain.gain.value = freq * (opts.vibratoDepth || 0.005);
    lfo.connect(lfoGain).connect(osc.frequency);
    lfo.start(start);
    lfo.stop(start + dur);
  }

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(vol, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain);
  gain.connect(dest);

  if (opts.reverb) {
    const rev = getReverb();
    if (rev) {
      const revSend = ctx.createGain();
      revSend.gain.value = 0.4;
      osc.connect(revSend);
      revSend.connect(rev);
    }
  }

  osc.start(start);
  osc.stop(start + dur);
}

export function playChord(freqs: number[], opts: NoteOpts & { stagger?: number } = {}) {
  freqs.forEach((f, i) => playNote(f, { ...opts, delay: (opts.delay || 0) + (opts.stagger || 0.06) * i }));
}

// Musical scales
export const PENTATONIC = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];

// ==== Group sounds for chips/moods ====
interface GroupSoundConfig {
  type: OscillatorType;
  scale: (number | number[])[];
  dur: number;
  vibrato?: boolean;
  isChord?: boolean;
  stagger?: number;
}

const GROUP_SOUNDS: Record<string, GroupSoundConfig> = {
  package: { type: 'sine', scale: [392, 523, 659, 784], dur: 0.5 },
  relationship: { type: 'triangle', scale: PENTATONIC, dur: 0.4 },
  occasion: { type: 'sine', scale: PENTATONIC.slice(2, 12), dur: 0.45, vibrato: true },
  mood: {
    type: 'triangle',
    scale: [
      [261.63, 311.13, 392.00],
      [261.63, 329.63, 392.00, 523.25],
      [329.63, 415.30, 493.88],
      [220.00, 261.63, 329.63],
      [196.00, 246.94, 293.66, 392.00],
      [261.63, 329.63, 392.00],
    ],
    isChord: true,
    stagger: 0.04,
    dur: 0.6,
  },
  genre: { type: 'sine', scale: PENTATONIC.slice(1), dur: 0.35 },
  language: { type: 'triangle', scale: [392, 440, 494, 523], dur: 0.4 },
  vocal: { type: 'sine', scale: [349, 440, 523, 587], dur: 0.4 },
  lyric_tone: { type: 'triangle', scale: [330, 392, 466, 523], dur: 0.35 },
  rating: { type: 'sine', scale: [392, 523, 659], dur: 0.35 },
  approve: { type: 'triangle', scale: [523, 659], dur: 0.4 },
};

export function playGroupSound(group: string, index: number) {
  const cfg = GROUP_SOUNDS[group];
  if (!cfg) return;
  const note = cfg.scale[index % cfg.scale.length];
  if (cfg.isChord && Array.isArray(note)) {
    playChord(note, { type: cfg.type, dur: cfg.dur, stagger: cfg.stagger, vol: 0.13 });
  } else if (typeof note === 'number') {
    playNote(note, { type: cfg.type, dur: cfg.dur, vibrato: cfg.vibrato });
  }
}

export function playToggleOn() {
  playChord([523.25, 659.25], { type: 'sine', dur: 0.25, stagger: 0.05, vol: 0.12 });
}
export function playToggleOff() {
  playNote(349.23, { type: 'sine', dur: 0.2, vol: 0.1 });
}
export function playStepAdvance() {
  playChord([523.25, 659.25, 783.99], { type: 'triangle', dur: 0.4, stagger: 0.08, vol: 0.13 });
}
export function playStepBack() {
  playChord([392.00, 329.63], { type: 'sine', dur: 0.3, stagger: 0.06, vol: 0.1 });
}

// ==== Percussion helpers ====
function playKick() {
  const ctx = getAudio();
  const dest = getMaster();
  if (!ctx || !dest) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.12);
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
  osc.connect(gain); gain.connect(dest);
  osc.start(); osc.stop(ctx.currentTime + 0.2);
}

function playHiHat() {
  const ctx = getAudio();
  const dest = getMaster();
  if (!ctx || !dest) return;
  const bufferSize = Math.floor(ctx.sampleRate * 0.05);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 7000;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.18, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
  noise.connect(hp); hp.connect(gain); gain.connect(dest);
  noise.start(); noise.stop(ctx.currentTime + 0.05);
}

function playSnare() {
  const ctx = getAudio();
  const dest = getMaster();
  if (!ctx || !dest) return;
  const bufferSize = Math.floor(ctx.sampleRate * 0.1);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 1500;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  noise.connect(bp); bp.connect(gain); gain.connect(dest);
  noise.start(); noise.stop(ctx.currentTime + 0.1);
}

function playBendNote(startFreq: number, endFreq: number, dur: number, type?: OscillatorType, vol?: number) {
  const ctx = getAudio();
  const dest = getMaster();
  if (!ctx || !dest) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + dur);
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(vol || 0.15, ctx.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(gain); gain.connect(dest);
  osc.start(); osc.stop(ctx.currentTime + dur);
}

// ==== Genre-specific sounds — 2-3 second authentic previews ====
const GENRE_SOUNDS: Record<string, () => void> = {

  'Acoustic / Folk': () => {
    // Fingerpicked G-C-D progression with warm triangle tones + reverb
    // G chord arpeggio
    [196, 247, 294, 392, 494, 392].forEach((f, i) =>
      playNote(f, { type: 'triangle', dur: 1.0, delay: i * 0.12, vol: 0.11, reverb: true })
    );
    // C chord arpeggio
    [261.63, 329.63, 392, 523.25, 392, 329.63].forEach((f, i) =>
      playNote(f, { type: 'triangle', dur: 1.0, delay: 0.8 + i * 0.12, vol: 0.10, reverb: true })
    );
    // Soft bass root notes
    playNote(98, { type: 'sine', dur: 1.2, vol: 0.06, delay: 0 });
    playNote(130.81, { type: 'sine', dur: 1.2, vol: 0.06, delay: 0.8 });
  },

  'Pop': () => {
    // Catchy synth hook — bright, bouncy, earworm melody with vibrato
    [523, 523, 659, 784, 659, 523, 440, 523].forEach((f, i) =>
      playNote(f, { type: 'sine', dur: 0.3, delay: i * 0.15, vol: 0.13, vibrato: true, vibratoRate: 4, vibratoDepth: 0.004 })
    );
    // Punchy bass underneath
    [261.63, 261.63, 220, 196].forEach((f, i) =>
      playNote(f, { type: 'triangle', dur: 0.25, delay: i * 0.3, vol: 0.09 })
    );
    // Shimmer pad
    playChord([523.25, 659.25, 783.99], { type: 'sine', dur: 2.5, stagger: 0.02, vol: 0.03, vibrato: true, vibratoRate: 2 });
  },

  'Rock': () => {
    // Power chord riff: E5 - G5 - A5 - E5 with distorted sawtooth + drums
    const riff = [
      { f: [164.81, 246.94], d: 0.4, t: 0 },      // E5
      { f: [196, 293.66], d: 0.3, t: 0.45 },       // G5
      { f: [220, 329.63], d: 0.3, t: 0.8 },         // A5
      { f: [164.81, 246.94], d: 0.6, t: 1.15 },    // E5 sustained
    ];
    riff.forEach(({ f, d, t }) => {
      f.forEach((freq) => {
        playNote(freq, { type: 'sawtooth', dur: d, delay: t, vol: 0.10 });
        playNote(freq * 1.005, { type: 'sawtooth', dur: d, delay: t, vol: 0.06, detune: 8 }); // thicken
      });
    });
    // Drum pattern
    setTimeout(playKick, 0);
    setTimeout(playHiHat, 200);
    setTimeout(playSnare, 450);
    setTimeout(playHiHat, 650);
    setTimeout(playKick, 800);
    setTimeout(playKick, 950);
    setTimeout(playSnare, 1150);
    setTimeout(playHiHat, 1350);
  },

  'Hip-hop / Rap': () => {
    // Trap-style: 808 sub bass + hi-hat rolls + snare
    // Sub bass melody
    [55, 55, 65.41, 55, 49, 55].forEach((f, i) =>
      playNote(f, { type: 'sine', dur: 0.35, delay: i * 0.25, vol: 0.18 })
    );
    // Hi-hat rolls
    for (let i = 0; i < 12; i++) {
      setTimeout(playHiHat, i * 125);
    }
    // Snares on 2 and 4
    setTimeout(playSnare, 375);
    setTimeout(playSnare, 1125);
    // Kick pattern
    setTimeout(playKick, 0);
    setTimeout(playKick, 250);
    setTimeout(playKick, 750);
    setTimeout(playKick, 1000);
    // Dark pad
    playChord([55, 65.41, 82.41], { type: 'triangle', dur: 2.5, stagger: 0.01, vol: 0.04 });
  },

  'R&B / Soul': () => {
    // Smooth Cmaj9 → Dm7 → Em7 chord progression with vibrato
    // Cmaj9
    [130.81, 261.63, 329.63, 392, 493.88, 587.33].forEach((f, i) =>
      playNote(f, { type: 'triangle', dur: 1.4, delay: i * 0.04, vol: 0.08, vibrato: true, vibratoRate: 3.5, vibratoDepth: 0.006, reverb: true })
    );
    // Dm7
    [146.83, 293.66, 349.23, 440, 523.25].forEach((f, i) =>
      playNote(f, { type: 'triangle', dur: 1.4, delay: 0.9 + i * 0.04, vol: 0.07, vibrato: true, vibratoRate: 3.5, vibratoDepth: 0.006, reverb: true })
    );
    // Silky bass
    playNote(65.41, { type: 'sine', dur: 1.2, vol: 0.07, delay: 0 });
    playNote(73.42, { type: 'sine', dur: 1.2, vol: 0.07, delay: 0.9 });
  },

  'Country': () => {
    // Twangy chicken-pickin' G-C-D with bends
    // G lick
    playBendNote(392, 415, 0.25, 'triangle', 0.13);
    playNote(494, { type: 'triangle', dur: 0.2, delay: 0.2, vol: 0.12 });
    playBendNote(440, 494, 0.3, 'triangle', 0.12);
    // C walkup
    setTimeout(() => {
      [261.63, 294, 329.63, 392].forEach((f, i) =>
        playNote(f, { type: 'triangle', dur: 0.3, delay: i * 0.15, vol: 0.11 })
      );
    }, 600);
    // D resolve
    setTimeout(() => {
      playBendNote(294, 311, 0.3, 'triangle', 0.12);
      playNote(370, { type: 'triangle', dur: 0.4, delay: 0.2, vol: 0.11 });
      playNote(440, { type: 'triangle', dur: 0.5, delay: 0.35, vol: 0.10, reverb: true });
    }, 1200);
    // Bass
    playNote(98, { type: 'sine', dur: 0.8, vol: 0.06 });
    playNote(130.81, { type: 'sine', dur: 0.8, vol: 0.06, delay: 0.6 });
    playNote(146.83, { type: 'sine', dur: 0.8, vol: 0.06, delay: 1.2 });
  },

  'Ballad': () => {
    // Slow piano-like rising passage with long sustain + reverb
    [261.63, 293.66, 329.63, 392, 440, 523.25, 659.25, 783.99].forEach((f, i) =>
      playNote(f, { type: 'sine', dur: 1.5, delay: i * 0.2, vol: 0.10, reverb: true, vibrato: true, vibratoRate: 2, vibratoDepth: 0.003 })
    );
    // Warm chord bed
    playChord([130.81, 164.81, 196], { type: 'sine', dur: 3.0, stagger: 0.02, vol: 0.04, reverb: true });
    // Gentle high sparkle at the end
    playNote(1046.50, { type: 'sine', dur: 1.2, delay: 1.8, vol: 0.04, reverb: true });
  },

  'Lullaby': () => {
    // Music box melody — Twinkle Twinkle pattern with long reverb tails
    const melody = [523, 523, 784, 784, 880, 880, 784, 0, 698, 698, 659, 659, 587, 587, 523];
    melody.forEach((f, i) => {
      if (f > 0) playNote(f, { type: 'triangle', dur: 0.5, delay: i * 0.2, vol: 0.08, reverb: true });
    });
    // Soft pad
    playChord([261.63, 392, 523.25], { type: 'sine', dur: 3.5, stagger: 0.02, vol: 0.03, reverb: true, vibrato: true, vibratoRate: 1.5 });
  },

  'Electronic': () => {
    // Four-on-the-floor with synth stabs and pitch sweeps
    // Kick pattern
    for (let i = 0; i < 4; i++) setTimeout(playKick, i * 375);
    // Off-beat hi-hats
    for (let i = 0; i < 4; i++) setTimeout(playHiHat, 187 + i * 375);
    // Synth stab chord
    playChord([329.63, 415.30, 523.25], { type: 'square', dur: 0.15, stagger: 0.01, vol: 0.10, delay: 0 });
    playChord([329.63, 415.30, 523.25], { type: 'square', dur: 0.15, stagger: 0.01, vol: 0.10, delay: 0.75 });
    // Rising pitch sweep
    playBendNote(220, 880, 1.0, 'sawtooth', 0.06);
    // Drop bass
    setTimeout(() => playNote(55, { type: 'sine', dur: 0.8, vol: 0.15 }), 1500);
    setTimeout(() => playChord([329.63, 415.30, 523.25, 659.25], { type: 'square', dur: 0.3, stagger: 0.01, vol: 0.12 }), 1500);
  },

  'Jazz': () => {
    // Dm9 → G13 → Cmaj7 — classic ii-V-I with walking bass
    // Dm9
    [146.83, 261.63, 329.63, 392, 523.25].forEach((f, i) =>
      playNote(f, { type: 'triangle', dur: 1.4, delay: i * 0.04, vol: 0.07, vibrato: true, vibratoRate: 3, vibratoDepth: 0.005, reverb: true })
    );
    // G13
    [196, 246.94, 349.23, 440, 587.33].forEach((f, i) =>
      playNote(f, { type: 'triangle', dur: 1.4, delay: 0.8 + i * 0.04, vol: 0.07, vibrato: true, vibratoRate: 3, vibratoDepth: 0.005, reverb: true })
    );
    // Cmaj7
    [130.81, 261.63, 329.63, 392, 493.88].forEach((f, i) =>
      playNote(f, { type: 'triangle', dur: 1.8, delay: 1.6 + i * 0.04, vol: 0.07, vibrato: true, vibratoRate: 3, vibratoDepth: 0.005, reverb: true })
    );
    // Walking bass
    [146.83, 164.81, 174.61, 196, 185, 174.61, 164.81, 130.81].forEach((f, i) =>
      playNote(f, { type: 'triangle', dur: 0.35, delay: i * 0.3, vol: 0.08 })
    );
  },

  'Reggaeton': () => {
    // Dembow riddim — the signature reggaeton pattern, 2+ seconds
    // The iconic dembow: BOOM-ch-ka-BOOM-ch-ka-BOOM
    for (let bar = 0; bar < 2; bar++) {
      const off = bar * 750;
      setTimeout(playKick, off);
      setTimeout(playHiHat, off + 125);
      setTimeout(playSnare, off + 250);
      setTimeout(playHiHat, off + 375);
      setTimeout(playKick, off + 500);
      setTimeout(playHiHat, off + 625);
    }
    // Bass melody (perreo style)
    [82.41, 82.41, 73.42, 82.41, 98, 82.41].forEach((f, i) =>
      playNote(f, { type: 'sine', dur: 0.2, delay: i * 0.25, vol: 0.14 })
    );
    // Synth lead stab
    playChord([329.63, 392, 493.88], { type: 'square', dur: 0.1, stagger: 0.01, vol: 0.08, delay: 0 });
    playChord([329.63, 392, 493.88], { type: 'square', dur: 0.1, stagger: 0.01, vol: 0.08, delay: 0.75 });
  },

  'Retro 80s': () => {
    // Synth-wave arpeggio with detuned sawtooth + gated reverb snare
    // Arp pattern (A minor: A-C-E-A-E-C)
    const arp = [440, 523.25, 659.25, 880, 659.25, 523.25, 440, 523.25, 659.25, 880];
    arp.forEach((f, i) => {
      playNote(f, { type: 'sawtooth', dur: 0.2, delay: i * 0.15, vol: 0.09 });
      playNote(f * 1.003, { type: 'sawtooth', dur: 0.2, delay: i * 0.15, vol: 0.05, detune: 5 }); // chorus effect
    });
    // Pad (Am7)
    playChord([220, 261.63, 329.63, 392], { type: 'sawtooth', dur: 3.0, stagger: 0.01, vol: 0.03, vibrato: true, vibratoRate: 0.5, vibratoDepth: 0.002 });
    // Gated snare hits
    setTimeout(playSnare, 375);
    setTimeout(playSnare, 1125);
    // Kick
    setTimeout(playKick, 0);
    setTimeout(playKick, 750);
  },
};

export function playGenreSound(genreName: string) {
  const fn = GENRE_SOUNDS[genreName];
  if (fn) fn();
  else playNote(523.25, { type: 'sine', dur: 0.3 });
}

// =====================================================
// FLOWER SOUNDS — rich 2-3 second musical phrases
// =====================================================
export const FLOWER_SOUNDS: Record<number, { baseFreq: number }> = {
  1: { baseFreq: 523 },
  2: { baseFreq: 440 },
  3: { baseFreq: 392 },
  4: { baseFreq: 349 },
  5: { baseFreq: 1047 },
  6: { baseFreq: 330 },
};

export function playFlowerBurst(num: number) {
  switch (num) {
    case 1: // Dreamy harp arpeggio — C major ascending with reverb
      [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.50].forEach((f, i) =>
        playNote(f, { type: 'sine', dur: 1.2, delay: i * 0.1, vol: 0.12, reverb: true, vibrato: true, vibratoRate: 3, vibratoDepth: 0.003 })
      );
      // Add shimmer octave doubles
      [523.25, 659.25, 783.99].forEach((f, i) =>
        playNote(f * 2, { type: 'sine', dur: 0.8, delay: 0.3 + i * 0.12, vol: 0.05, reverb: true })
      );
      break;

    case 2: // Warm music box melody — descending lullaby phrase
      [880, 784, 659, 523, 440, 523, 659].forEach((f, i) =>
        playNote(f, { type: 'triangle', dur: 0.5, delay: i * 0.15, vol: 0.11, reverb: true })
      );
      // Soft pad underneath
      playChord([261.63, 329.63, 392], { type: 'sine', dur: 2.5, stagger: 0.02, vol: 0.04, vibrato: true, vibratoRate: 2 });
      break;

    case 3: // Playful pizzicato bounce
      [523, 659, 784, 659, 523, 784, 1047].forEach((f, i) =>
        playNote(f, { type: 'triangle', dur: 0.2, delay: i * 0.1, vol: 0.14 })
      );
      // Staccato bass
      [261.63, 329.63].forEach((f, i) =>
        playNote(f, { type: 'sine', dur: 0.3, delay: i * 0.3, vol: 0.08 })
      );
      break;

    case 4: // Ethereal wind chimes — random-ish high tones with long tails
      [1568, 1319, 1760, 1175, 1397, 1568, 2093].forEach((f, i) =>
        playNote(f, { type: 'sine', dur: 1.8, delay: i * 0.12, vol: 0.07, reverb: true, vibrato: true, vibratoRate: 6, vibratoDepth: 0.008 })
      );
      // Low warmth
      playNote(196, { type: 'sine', dur: 2.5, vol: 0.04, vibrato: true, vibratoRate: 1.5 });
      break;

    case 5: // Bright celesta melody — twinkling star
      [1047, 1319, 1568, 1319, 1047, 880, 1047, 1319, 1568].forEach((f, i) =>
        playNote(f, { type: 'triangle', dur: 0.35, delay: i * 0.11, vol: 0.10, reverb: true })
      );
      // Glitter harmonics
      [2093, 2637, 3136].forEach((f, i) =>
        playNote(f, { type: 'sine', dur: 0.6, delay: 0.5 + i * 0.15, vol: 0.03, reverb: true })
      );
      break;

    case 6: // Deep marimba groove — warm and rhythmic
      [330, 392, 440, 523, 440, 392, 330, 294].forEach((f, i) =>
        playNote(f, { type: 'triangle', dur: 0.6, delay: i * 0.13, vol: 0.13 })
      );
      // Soft chord swell
      playChord([165, 196, 247], { type: 'sine', dur: 2.0, stagger: 0.03, vol: 0.05, delay: 0.2, vibrato: true });
      break;

    default:
      playChord([523, 659, 784], { type: 'sine', dur: 0.6, stagger: 0.08, vol: 0.15 });
  }
}

// ==== Theremin for flower dragging ====
let thereminOsc: OscillatorNode | null = null;
let thereminGain: GainNode | null = null;
let thereminLfo: OscillatorNode | null = null;
let thereminLfoGain: GainNode | null = null;

export function startTheremin(baseFreq: number) {
  const ctx = getAudio();
  const dest = getMaster();
  if (!ctx || !dest) return;
  stopTheremin();
  thereminOsc = ctx.createOscillator();
  thereminGain = ctx.createGain();
  thereminOsc.type = 'sine';
  thereminOsc.frequency.value = baseFreq;
  thereminLfo = ctx.createOscillator();
  thereminLfoGain = ctx.createGain();
  thereminLfo.frequency.value = 4.5;
  thereminLfoGain.gain.value = baseFreq * 0.012;
  thereminLfo.connect(thereminLfoGain).connect(thereminOsc.frequency);
  thereminGain.gain.setValueAtTime(0.0001, ctx.currentTime);
  thereminGain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.1);
  thereminOsc.connect(thereminGain);
  thereminGain.connect(dest);
  thereminOsc.start();
  thereminLfo.start();
}

export function updateTheremin(freq: number) {
  if (thereminOsc) {
    const ctx = getAudio();
    if (!ctx) return;
    try {
      thereminOsc.frequency.exponentialRampToValueAtTime(Math.max(80, freq), ctx.currentTime + 0.05);
    } catch {}
    if (thereminLfoGain) thereminLfoGain.gain.value = freq * 0.012;
  }
}

export function stopTheremin() {
  if (thereminOsc) {
    try {
      const ctx = audioCtx;
      if (ctx) {
        thereminGain!.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
        thereminOsc.stop(ctx.currentTime + 0.22);
        thereminLfo!.stop(ctx.currentTime + 0.22);
      }
    } catch {}
    thereminOsc = thereminGain = thereminLfo = thereminLfoGain = null;
  }
}

// =====================================================
// VOICE SYNTHESIS — optimized for natural sound
// =====================================================
let preferredVoice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null;
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;

  // Priority list: most natural-sounding voices first
  // Windows 11 "Natural" voices are significantly better
  const preferred = [
    'Microsoft Aria Online (Natural) - English (United States)',
    'Microsoft Jenny Online (Natural) - English (United States)',
    'Microsoft Ava Online (Natural) - English (United States)',
    'Microsoft Emma Online (Natural) - English (United States)',
    'Microsoft Ana Online (Natural) - English (United States)',
    'Microsoft Steffan Online (Natural) - English (United States)',
    // macOS
    'Samantha',
    'Karen',
    'Moira',
    // Chrome
    'Google US English',
  ];

  for (const name of preferred) {
    const v = voices.find((v) => v.name === name);
    if (v) return v;
  }

  // Fallback: any voice with "Natural" or "Neural" in the name
  const natural = voices.find(
    (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Online'))
  );
  if (natural) return natural;

  // Last resort: any English voice
  return voices.find((v) => v.lang === 'en-US') || voices.find((v) => v.lang.startsWith('en')) || null;
}

export function initVoice() {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.onvoiceschanged = () => {
    preferredVoice = pickVoice();
  };
  // Some browsers need a delay
  setTimeout(() => { if (!preferredVoice) preferredVoice = pickVoice(); }, 100);
  setTimeout(() => { if (!preferredVoice) preferredVoice = pickVoice(); }, 500);
}

export function speakText(text: string) {
  if (globalMuted) return;
  if (!('speechSynthesis' in window)) return;
  const clean = text.replace(/[✿★✦✨♥☁🔊🔇—–]/g, '').replace(/\s+/g, ' ').trim();
  if (!clean) return;

  setTimeout(() => {
    if (globalMuted) return;
    speechSynthesis.cancel();

    const voice = preferredVoice || pickVoice();
    const isNatural = voice?.name?.includes('Natural') || voice?.name?.includes('Neural');

    const utter = new SpeechSynthesisUtterance(clean);
    utter.voice = voice;
    utter.lang = 'en-US';

    if (isNatural) {
      // Natural voices sound great with minimal tweaking
      utter.rate = 0.92;
      utter.pitch = 1.0;
      utter.volume = 0.85;
    } else {
      // Non-natural voices need more help
      utter.rate = 0.82;
      utter.pitch = 1.08;
      utter.volume = 0.8;
    }

    speechSynthesis.speak(utter);
  }, 200);
}

// Legacy exports for backward compat
export function toggleVoiceEnabled(): boolean {
  globalMuted = !globalMuted;
  setGlobalMute(globalMuted);
  return !globalMuted;
}

export function isVoiceEnabled(): boolean {
  return !globalMuted;
}
