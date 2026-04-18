'use client';

import { useState, useCallback, useRef } from 'react';
import type { ChatMessage } from '@/lib/types';

// =====================================================
// ENHANCED PATTERN-MATCHING CHAT ENGINE
// =====================================================

interface ChatReply {
  text: string;
  followUps?: string[];
}

// Each topic has multiple trigger patterns (synonyms) for better matching
const TOPICS: { patterns: string[]; reply: ChatReply }[] = [
  // Pricing
  {
    patterns: ['price', 'cost', 'how much', 'expensive', 'cheap', 'afford', 'pay', 'pricing', 'budget', 'fee', 'rate', 'worth', 'package', 'packages', 'plan', 'plans', 'tier', 'basic', 'standard', 'premium', 'business', 'included', 'include', 'what do i get', 'what comes with', 'difference', 'compare'],
    reply: {
      text: "Here are our packages! 💰\n\n• Basic ($39) — 1 song, 1 revision, MP3, 72h delivery\n• Standard ($79) — 2 versions, 2 revisions, lyric sheet, 48h\n• Premium ($149) — 3 versions, unlimited revisions, lyric video, 24h\n• Business ($299) — brief call, licensing, stems, jingles, 5 days\n\nAll packages include professional production & custom lyrics from your story. Use code CLOUD25 for 25% off!",
      followUps: ['How long does delivery take?', 'Do you have a discount?', 'How do I order?'],
    },
  },
  // Timeline
  {
    patterns: ['how long', 'time', 'fast', 'quick', 'delivery', 'turnaround', 'when', 'deadline', 'rush', 'urgent', 'hurry', 'soon'],
    reply: {
      text: "Most songs are ready within 48–72 hours! ⚡\n\n• Basic — 72 hours\n• Standard — 48 hours\n• Premium — 24 hours\n• Rush add-on — cuts any package to ~12 hours\n\nNeed it even sooner? Just let us know in the form and we'll do our best!",
      followUps: ['How much is rush delivery?', 'What if I need it today?'],
    },
  },
  // Languages
  {
    patterns: ['language', 'spanish', 'french', 'russian', 'chinese', 'japanese', 'korean', 'portuguese', 'german', 'arabic', 'hindi', 'translate', 'bilingual', 'english'],
    reply: {
      text: "We write songs in 30+ languages! 🌍\n\nEnglish, Russian, Spanish, French, German, Italian, Portuguese, Japanese, Korean, Chinese, Arabic, Hindi, and many more.\n\nYou can even mix languages in one song — just pick 'Mixed languages' in the form!",
      followUps: ['Can you mix two languages?', 'How accurate are the lyrics?'],
    },
  },
  // Refund
  {
    patterns: ['refund', 'money back', 'cancel', 'not happy', 'unsatisfied', 'disappointed', 'guarantee', 'return'],
    reply: {
      text: "Your happiness comes first! ❤️\n\nIf you're not satisfied after revisions, we offer a full refund within 7 days — no questions asked. We've never had an unhappy customer yet, but the safety net is there!",
      followUps: ['How many revisions do I get?', 'What if I want changes?'],
    },
  },
  // Revisions
  {
    patterns: ['revision', 'change', 'edit', 'modify', 'adjust', 'tweak', 'redo', 'fix', 'update', 'not right'],
    reply: {
      text: "Every package includes revisions! ✏️\n\n• Basic — 1 revision\n• Standard — 2 revisions\n• Premium — unlimited revisions!\n\nJust tell us what you'd like changed and we'll make it perfect. Most people love their song on the first try!",
      followUps: ['What counts as a revision?', 'How long do revisions take?'],
    },
  },
  // Order / how to start
  {
    patterns: ['order', 'start', 'begin', 'commission', 'get started', 'buy', 'purchase', 'book', 'hire', 'create'],
    reply: {
      text: "Wonderful! Getting started is easy! ✿\n\n1️⃣ Fill out the 6-step form above (~5 min)\n2️⃣ Choose your package & style\n3️⃣ Our artists craft your song\n4️⃣ Review, revise if needed, enjoy!\n\nJust scroll up to begin — the more details you share, the more magical your song will be!",
      followUps: ['What details do you need?', 'How long does it take?'],
    },
  },
  // Discount / coupon
  {
    patterns: ['discount', 'coupon', 'code', 'promo', 'deal', 'offer', 'sale', 'cloud25', 'save'],
    reply: {
      text: "Yes! Use code CLOUD25 at checkout for 25% off! ✨\n\nThat brings the Basic package down to just ~$29. It's already applied by default in the form, but you can also try WELCOME10 (10% off) or FIRSTSONG (20% off).",
      followUps: ['What are the packages?', 'How do I order?'],
    },
  },
  // Samples / examples
  {
    patterns: ['sample', 'example', 'hear', 'listen', 'preview', 'demo', 'portfolio', 'showcase'],
    reply: {
      text: "Great question! 🎵\n\nCheck out samples on our Instagram @cloudiezzz — we post snippets of delivered songs (with permission). You can also preview the mood and genre vibe using the selectors in step 4 of the form!",
      followUps: ['What genres do you offer?', 'Can I choose the singer?'],
    },
  },
  // Contact
  {
    patterns: ['contact', 'email', 'phone', 'whatsapp', 'telegram', 'reach', 'talk', 'human', 'support', 'help me'],
    reply: {
      text: "We're always here for you! 💌\n\n• Email: hello@cloudiezzz.com\n• WhatsApp: +1 (555) 555-0100\n• Telegram: @cloudiezzz\n• Instagram: @cloudiezzz\n\nWe typically reply within 1-2 hours, even on weekends!",
      followUps: ['What are your hours?', 'Where are you based?'],
    },
  },
  // Gift / surprise
  {
    patterns: ['gift', 'surprise', 'present', 'birthday', 'anniversary', 'wedding', 'proposal', 'valentine', 'christmas', 'mother', 'father'],
    reply: {
      text: "A custom song is the most unforgettable gift! 🎁\n\nWhether it's a birthday, anniversary, wedding, or proposal — we've made people laugh, cry, and everything in between. Just fill out the form with your story and we'll turn it into music.\n\nPro tip: the more specific details you share (inside jokes, memories, pet names), the more magical it becomes!",
      followUps: ['How long does it take?', 'What\'s the best package for a gift?'],
    },
  },
  // Genres / style
  {
    patterns: ['genre', 'style', 'acoustic', 'pop', 'rock', 'hip hop', 'rap', 'country', 'jazz', 'r&b', 'soul', 'electronic', 'reggaeton', 'ballad', 'lullaby'],
    reply: {
      text: "We offer 12 genres to match any vibe! 🎸\n\nAcoustic/Folk, Pop, Rock, Hip-hop/Rap, R&B/Soul, Country, Ballad, Lullaby, Electronic, Jazz, Reggaeton, and Retro 80s.\n\nYou can pick multiple genres and we'll blend them. Try the genre selector in step 4 — each one plays a preview sound!",
      followUps: ['Can you mix genres?', 'What mood options are there?'],
    },
  },
  // Singer / voice
  {
    patterns: ['singer', 'voice', 'vocal', 'male', 'female', 'duet', 'who sings', 'artist'],
    reply: {
      text: "You get to choose! 🎤\n\nIn step 4 you can pick:\n• Male voice\n• Female voice\n• Duet (both!)\n• No preference (we'll match the mood)\n\nOur artists are professional session singers with warm, expressive voices.",
      followUps: ['Can I hear a sample?', 'What genres do you offer?'],
    },
  },
  // How it works / process
  {
    patterns: ['how does', 'how do', 'process', 'works', 'what happens', 'step', 'explain'],
    reply: {
      text: "Here's how the magic happens! ✿\n\n1️⃣ You fill out a fun 6-step form (~5 min)\n2️⃣ Pick your package, mood, genre & language\n3️⃣ Our songwriters craft lyrics from YOUR story\n4️⃣ Professional artists record & produce it\n5️⃣ You receive your song (MP3 + extras)\n6️⃣ Request revisions if needed\n\nThe whole thing takes 24–72 hours depending on your package!",
      followUps: ['What details do you need from me?', 'How much does it cost?'],
    },
  },
  // Business / commercial
  {
    patterns: ['business', 'commercial', 'jingle', 'brand', 'company', 'corporate', 'advertising', 'marketing', 'license', 'licensing'],
    reply: {
      text: "We do business songs too! 🏢\n\nOur Business package ($299) includes:\n• A discovery call with our team\n• Full licensing rights\n• Stems & instrumentals\n• Perfect for jingles, ads, and brand anthems\n\nDelivery takes about 5 days for the full commercial treatment.",
      followUps: ['What\'s included in the license?', 'Can I use it in ads?'],
    },
  },
  // Greetings
  {
    patterns: ['hello', 'hi', 'hey', 'hola', 'sup', 'good morning', 'good evening', 'good afternoon', 'yo', 'howdy', 'greetings'],
    reply: {
      text: "Hey there! 👋 Welcome to Cloudiezzz! I'm Cloudie, your friendly song-ordering helper.\n\nI can help you with pricing, delivery times, languages, and more. What would you like to know?",
      followUps: ['How much does a song cost?', 'How does it work?', 'I want to order!'],
    },
  },
  // Thanks
  {
    patterns: ['thank', 'thanks', 'thx', 'appreciate', 'helpful', 'awesome', 'great', 'perfect', 'amazing', 'cool'],
    reply: {
      text: "You're so welcome! 💛 If you think of anything else, I'm right here. Can't wait to help you create something special!",
      followUps: ['How do I order?', 'What are the packages?'],
    },
  },
  // Hours / location
  {
    patterns: ['hours', 'open', 'close', 'based', 'location', 'where', 'timezone', 'available'],
    reply: {
      text: "We're available almost 24/7! 🕐\n\n• Mon–Fri: 9am–9pm EST\n• Sat–Sun: 11am–6pm EST\n• Based in Charlotte, NC\n• Serving customers worldwide 🌍\n\nAverage response time: under 2 hours!",
      followUps: ['How do I contact you?', 'Do you deliver internationally?'],
    },
  },
];

function findReply(text: string): ChatReply {
  const t = text.toLowerCase().trim();

  // Normalize common variations
  const normalized = t
    .replace(/what's/g, 'what is')
    .replace(/what're/g, 'what are')
    .replace(/how's/g, 'how is')
    .replace(/don't/g, 'do not')
    .replace(/can't/g, 'cannot')
    .replace(/i'd/g, 'i would')
    .replace(/[?!.,]/g, '');

  // Score each topic by how many patterns match (check both original and normalized)
  let bestScore = 0;
  let bestReply: ChatReply | null = null;

  for (const topic of TOPICS) {
    let score = 0;
    for (const pattern of topic.patterns) {
      if (t.includes(pattern) || normalized.includes(pattern)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestReply = topic.reply;
    }
  }

  if (bestReply) return bestReply;

  return {
    text: "Hmm, I'm not sure about that one! 🤔\n\nHere's what I can help with: pricing, delivery times, languages, genres, revisions, refunds, and more.\n\nFor anything else, email hello@cloudiezzz.com or WhatsApp us — a real human will get back to you within hours! ✿",
    followUps: ['What are the packages?', 'How does it work?', 'Contact support'],
  };
}

// =====================================================
// HOOK
// =====================================================

const welcomeMessage: ChatMessage = {
  id: 'welcome',
  from: 'bot',
  text: "Hi there! 👋 I'm Cloudie, your song-ordering helper. Ask me anything about custom songs, pricing, or how it all works!",
  timestamp: new Date(),
};

export function useChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [followUps, setFollowUps] = useState<string[]>([
    'How much does it cost?',
    'How long does it take?',
    'I want to order!',
  ]);
  const messageCount = useRef(0);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const addBotReply = useCallback((reply: ChatReply) => {
    setIsTyping(true);

    // Variable delay based on response length (feels more natural)
    const delay = Math.min(400 + reply.text.length * 3, 1500);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          from: 'bot',
          text: reply.text,
          timestamp: new Date(),
        },
      ]);
      setFollowUps(reply.followUps || []);
      messageCount.current++;

      // After several exchanges, nudge toward ordering
      if (messageCount.current === 4) {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: `bot-nudge-${Date.now()}`,
              from: 'bot',
              text: "By the way — if you're ready to get started, the form above only takes about 5 minutes! And code CLOUD25 gives you 25% off ✿",
              timestamp: new Date(),
            },
          ]);
        }, 2000);
      }
    }, delay);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMsg = text.trim();
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          from: 'user',
          text: userMsg,
          timestamp: new Date(),
        },
      ]);
      setInput('');
      setFollowUps([]);

      // Try AI-powered reply first, fall back to pattern matching
      try {
        const recentMessages = messages.slice(-10).map((m) => ({
          role: m.from === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMsg, history: recentMessages }),
        });
        const data = await res.json();
        if (data.source === 'ai' && data.reply) {
          addBotReply({ text: data.reply });
          return;
        }
      } catch {
        // API unavailable — fall through to pattern matching
      }
      addBotReply(findReply(text));
    },
    [addBotReply, messages]
  );

  const handleQuickReply = useCallback(
    (text: string) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          from: 'user',
          text,
          timestamp: new Date(),
        },
      ]);
      setFollowUps([]);
      addBotReply(findReply(text));
    },
    [addBotReply]
  );

  return {
    isOpen,
    messages,
    input,
    setInput,
    isTyping,
    followUps,
    toggle,
    sendMessage,
    handleQuickReply,
  };
}
