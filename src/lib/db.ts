import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

// Dynamic import to avoid webpack bundling issues with Prisma 7 ESM
let _prisma: any;

function createPrismaClient() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require('../generated/prisma/client');
  const adapter = new PrismaBetterSqlite3({
    url: `file:${path.resolve(process.cwd(), 'dev.db')}`,
  });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: any };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
