import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

let _prisma: any;

function createPrismaClient() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require('../generated/prisma/client');

  const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) throw new Error('DATABASE_URL or TURSO_DATABASE_URL is required');

  // If it's a libsql/turso URL, use the libSQL adapter
  if (url.startsWith('libsql://') || url.startsWith('https://')) {
    const client = createClient({ url, authToken });
    const adapter = new PrismaLibSQL(client);
    return new PrismaClient({ adapter });
  }

  // Fallback for local SQLite file (dev only)
  const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
  const path = require('path');
  const adapter = new PrismaBetterSqlite3({
    url: `file:${path.resolve(process.cwd(), 'dev.db')}`,
  });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: any };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
