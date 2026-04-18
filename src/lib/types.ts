export interface CommissionFormData {
  // Step 1 – Format & buyer info
  package: string;
  buyer_name: string;
  buyer_email: string;
  due_date: string;
  buyer_phone: string;

  // Step 2 – Recipient
  rec_name: string;
  rec_age: string;
  relationship: string;
  occasion: string;
  others: string;

  // Step 3 – Story
  how_met: string;
  memories: string;
  love_about: string;
  feeling: string;
  one_line: string;
  avoid: string;

  // Step 4 – Sound
  mood: string;
  genre: string[];
  language: string;
  vocal: string;
  references: string;

  // Step 5 – Lyrics
  must_include: string;
  catchphrase: string;
  credit: string;
  lyric_tone: string;
  rating: string;
  approve: string;

  // Step 6 – Extras & review
  addons: string[];
  anything_else: string;
  couponCode: string;
  discountPercent: number;

  // Internal (set after submission)
  _orderId?: string;
}

export interface Package {
  id: string;
  name: string;
  wasPrice: number;
  nowPrice: number;
  description: string;
  features: string[];
  badge?: string;
}

export interface Addon {
  id: string;
  label: string;
  description: string;
  price: number;
}

export interface Mood {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  quote: string;
  occasion: string;
  date: string;
}

export interface CommissionApiResponse {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  accessToken?: string;
  error?: string;
}

export interface QuickReply {
  id: string;
  label: string;
  response: string;
}

export interface ChatMessage {
  id: string;
  from: 'user' | 'bot';
  text: string;
  timestamp: Date;
}
