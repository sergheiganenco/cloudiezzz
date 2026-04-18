import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// dev.db lives at project root (prisma.config.ts resolves file:./dev.db from root)
const adapter = new PrismaBetterSqlite3({ url: `file:${path.resolve(__dirname, '..', 'dev.db')}` });
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

async function main() {
  // ── Admin user ────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cloudiezzz.com' },
    update: {},
    create: {
      email: 'admin@cloudiezzz.com',
      name: 'Cloudiezzz Admin',
      passwordHash: hashPassword('admin123'), // change in production!
      role: 'admin',
    },
  });
  console.log('Admin user:', admin.email);

  // ── Sample creator ────────────────────────────────────────────────
  const creator = await prisma.user.upsert({
    where: { email: 'maya@cloudiezzz.com' },
    update: {},
    create: {
      email: 'maya@cloudiezzz.com',
      name: 'Maya Chen',
      passwordHash: hashPassword('creator123'),
      role: 'creator',
      bio: 'Singer-songwriter specializing in acoustic love songs and heartfelt ballads.',
      specialties: 'Acoustic / Folk,Ballad,Pop',
    },
  });
  console.log('Creator:', creator.email);

  // ── Coupons ───────────────────────────────────────────────────────
  const coupons = [
    { code: 'CLOUD25', discountPercent: 25, label: '25% off' },
    { code: 'WELCOME10', discountPercent: 10, label: '10% off' },
    { code: 'FIRSTSONG', discountPercent: 20, label: '20% off your first song' },
    { code: 'CLOUDFRIEND', discountPercent: 20, label: '20% off (referral)' },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: {
        code: c.code,
        discountPercent: c.discountPercent,
        label: c.label,
        isActive: true,
      },
    });
    console.log('Coupon:', c.code);
  }

  // ── Audio samples ─────────────────────────────────────────────────
  const samples = [
    {
      title: 'Anniversary Serenade',
      description: 'A heartfelt acoustic ballad for a 10th wedding anniversary',
      genre: 'Acoustic / Folk',
      mood: 'romantic',
      occasion: 'Anniversary',
      language: 'en',
      audioUrl: '/samples/anniversary-serenade.mp3',
      duration: 30,
      sortOrder: 1,
    },
    {
      title: 'Birthday Bop',
      description: 'An upbeat pop celebration for a milestone birthday',
      genre: 'Pop',
      mood: 'upbeat',
      occasion: 'Birthday',
      language: 'en',
      audioUrl: '/samples/birthday-bop.mp3',
      duration: 30,
      sortOrder: 2,
    },
    {
      title: 'Wedding Waltz',
      description: 'A cinematic orchestral piece for a first dance',
      genre: 'Ballad',
      mood: 'cinematic',
      occasion: 'Wedding',
      language: 'en',
      audioUrl: '/samples/wedding-waltz.mp3',
      duration: 30,
      sortOrder: 3,
    },
    {
      title: 'Lullaby for Luna',
      description: 'A gentle lullaby written for a newborn',
      genre: 'Lullaby',
      mood: 'mellow',
      occasion: 'Just because',
      language: 'en',
      audioUrl: '/samples/lullaby-luna.mp3',
      duration: 30,
      sortOrder: 4,
    },
    {
      title: 'Graduation Anthem',
      description: 'An inspiring hip-hop track for a college graduation',
      genre: 'Hip-hop / Rap',
      mood: 'upbeat',
      occasion: 'Graduation',
      language: 'en',
      audioUrl: '/samples/graduation-anthem.mp3',
      duration: 30,
      sortOrder: 5,
    },
  ];

  for (const s of samples) {
    const existing = await prisma.audioSample.findFirst({ where: { title: s.title } });
    if (!existing) {
      await prisma.audioSample.create({ data: s });
      console.log('Sample:', s.title);
    }
  }

  console.log('\nSeed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
