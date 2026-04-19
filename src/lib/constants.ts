import type { Package, Addon, Mood, Language, Review, QuickReply } from './types';

export const STEPS = [
  { id: 1, label: 'Format' },
  { id: 2, label: 'Recipient' },
  { id: 3, label: 'Story' },
  { id: 4, label: 'Sound' },
  { id: 5, label: 'Lyrics' },
  { id: 6, label: 'Review' },
];

export const PACKAGES: Package[] = [
  {
    id: 'Basic',
    name: 'Basic',
    wasPrice: 0,
    nowPrice: 39,
    description: 'One song, one revision, MP3 delivery.',
    features: ['1 song', '1 revision', 'MP3 delivery', '72-hour turnaround'],
  },
  {
    id: 'Standard',
    name: 'Standard',
    wasPrice: 0,
    nowPrice: 79,
    description: 'Two versions, two revisions, lyric sheet.',
    features: ['2 versions', '2 revisions', 'Lyric sheet', '48-hour turnaround'],
  },
  {
    id: 'Premium',
    name: 'Premium',
    wasPrice: 0,
    nowPrice: 149,
    description: 'Three versions, unlimited revisions, lyric video.',
    features: ['3 versions', 'Unlimited revisions', 'Lyric video', '24-hour turnaround'],
  },
  {
    id: 'Business',
    name: 'Business',
    wasPrice: 0,
    nowPrice: 299,
    description: 'Commercial license, discovery call, multiple cuts for ads & brands.',
    features: ['Commercial licensing', 'Discovery call', '3 versions (full + short cuts)', 'Unlimited revisions', 'Priority 5-day delivery'],
  },
];

export const PACKAGE_TIMES: Record<string, string> = {
  Basic: 'within 72 hours',
  Standard: 'within 48 hours',
  Premium: 'within 24 hours',
  Business: 'within 5 days',
};

export const RELATIONSHIPS = [
  'Spouse / Partner', 'Parent', 'Child',
  'Friend', 'Sibling', 'Colleague',
  'Client', 'Myself', 'Other',
];

export const OCCASION_TYPES = [
  'Birthday', 'Anniversary', 'Wedding',
  'Proposal', 'Memorial', 'Graduation',
  'Retirement', 'Apology', 'Just because',
  'Brand or business',
];

export const GENRES = [
  'Acoustic / Folk', 'Pop', 'Rock',
  'Hip-hop / Rap', 'R&B / Soul', 'Country',
  'Ballad', 'Lullaby', 'Electronic',
  'Jazz', 'Reggaeton', 'Retro 80s',
];

export const MOODS: Mood[] = [
  { id: 'heartfelt', label: 'Heartfelt', emoji: '💝', description: 'emotional' },
  { id: 'upbeat', label: 'Upbeat', emoji: '🎉', description: 'celebratory' },
  { id: 'playful', label: 'Playful', emoji: '😄', description: 'light & funny' },
  { id: 'romantic', label: 'Romantic', emoji: '🌹', description: 'intimate' },
  { id: 'cinematic', label: 'Cinematic', emoji: '🎬', description: 'epic' },
  { id: 'mellow', label: 'Mellow', emoji: '🌙', description: 'chill' },
];

export const VOCAL_OPTIONS = ['Male', 'Female', 'Duet', 'No preference'];

export const LYRIC_TONES = ['Poetic / Metaphorical', 'Direct / Literal', 'Humorous', 'A mix'];

export const CONTENT_RATINGS = ['Clean', 'Mild language', 'Explicit allowed'];

export const APPROVAL_OPTIONS = ['Yes, send for approval', 'No, surprise me'];

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'pt-br', name: 'Portuguese (Brazil)', flag: '🇧🇷' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
  { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
  { code: 'cs', name: 'Czech', flag: '🇨🇿' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
  { code: 'da', name: 'Danish', flag: '🇩🇰' },
  { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
  { code: 'el', name: 'Greek', flag: '🇬🇷' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'fa', name: 'Persian', flag: '🇮🇷' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'ms', name: 'Malay', flag: '🇲🇾' },
  { code: 'tl', name: 'Filipino', flag: '🇵🇭' },
  { code: 'zh', name: 'Chinese (Mandarin)', flag: '🇨🇳' },
  { code: 'yue', name: 'Chinese (Cantonese)', flag: '🇹🇼' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'multi', name: 'Mixed languages', flag: '🌍' },
  { code: 'other', name: 'Other (specify in notes)', flag: '✿' },
];

export const ADDONS: Addon[] = [
  { id: 'lyric-video', label: 'Lyric video', description: 'Animated lyric video', price: 25 },
  { id: 'alt-genre', label: 'Alternate genre version', description: 'Different style arrangement', price: 30 },
  { id: 'instrumental', label: 'Instrumental / karaoke', description: 'Instrumental or karaoke version', price: 15 },
  { id: 'lyric-card', label: 'Printed lyric card', description: 'Printed lyric card, mailed', price: 20 },
  { id: 'rush', label: 'Rush 24-hour delivery', description: 'Rush 24-hour delivery', price: 0 },
];

// Rush is 50% of subtotal, not a fixed price
export const RUSH_MULTIPLIER = 0.5;

export const COUPONS: Record<string, { discount: number; label: string }> = {
  'CLOUD25': { discount: 0.25, label: '25% off' },
  'WELCOME10': { discount: 0.10, label: '10% off' },
  'FIRSTSONG': { discount: 0.20, label: '20% off your first song' },
};

export const DEFAULT_COUPON = 'CLOUD25';

export const REVIEWS: Review[] = [
  {
    id: '1',
    author: 'Marcus T.',
    avatar: 'M',
    rating: 5,
    quote: 'My wife cried for ten minutes straight when I played it at our anniversary dinner. They captured every little detail I wrote about — the way she laughs, our trip to Italy, even our cat\'s name. Best gift I\'ve ever given.',
    occasion: '10th anniversary',
    date: '2025-01-10',
  },
  {
    id: '2',
    author: 'Anya K.',
    avatar: 'A',
    rating: 5,
    quote: 'I ordered a song in Russian for my grandmother\'s 80th birthday. The lyrics were beautiful and authentic — not just translated, but felt like they understood her story. The whole family was in tears. Thank you, Cloudiezzz!',
    occasion: 'Grandma\'s 80th 🎂',
    date: '2025-02-14',
  },
  {
    id: '3',
    author: 'Jamie R.',
    avatar: 'J',
    rating: 5,
    quote: 'Used the Premium package for my best friend\'s wedding speech. Delivered in 22 hours, two beautiful versions to choose from, and a lyric video that made the whole reception go silent. Worth every penny!',
    occasion: 'Wedding surprise 💍',
    date: '2025-03-01',
  },
];

export const QUICK_REPLIES: QuickReply[] = [
  { id: 'timeline', label: '⏱ How long?', response: 'Most songs are ready within 48–72 hours. Rush 24-hour delivery is available too! ⚡' },
  { id: 'languages', label: '🌍 Languages?', response: 'We write in English, Russian, Spanish, and mixed language. Just pick your preference in the form! 🌍' },
  { id: 'refund', label: '↩ Refund?', response: 'If you\'re not happy after revisions, we offer a full refund within 7 days. Your happiness comes first ❤' },
  { id: 'order', label: '✿ Order now', response: 'Wonderful! Just scroll up and fill out the 6-step form. It only takes about 5 minutes ✿' },
];

export const CHAT_REPLIES: Record<string, string> = {
  'how long': 'Most songs are ready within 48–72 hours. Rush 24-hour delivery is available too! ⚡',
  'language': 'We write in English, Russian, Spanish, and mixed language. Just pick your preference in the form! 🌍',
  'refund': 'If you\'re not happy after revisions, we offer a full refund within 7 days. Your happiness comes first ❤',
  'order': 'Wonderful! Just scroll up and fill out the 6-step form. It only takes about 5 minutes ✿',
  'price': 'Packages range from $39 (Basic) to $299+ (Business). Use code CLOUD25 for 25% off!',
  'discount': 'Yes! Use code CLOUD25 at checkout for 25% off your first song ✨',
  'sample': 'We have samples on our Instagram @cloudiezzz — and you can preview the vibe in the mood selector!',
  'contact': 'Email hello@cloudiezzz.com or WhatsApp +1 (555) 555-0100. We reply within hours!',
  'default': 'Great question! For detailed help, please email hello@cloudiezzz.com or send a WhatsApp — we\'ll get back to you within hours ✿',
};
