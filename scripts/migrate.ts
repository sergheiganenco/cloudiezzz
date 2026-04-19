import "dotenv/config";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.log("[migrate] No database URL found, skipping migrations.");
  process.exit(0);
}

// Only run against Turso/libsql in production
if (!url.startsWith("libsql://") && !url.startsWith("https://")) {
  console.log("[migrate] Local SQLite — skipping remote migrations.");
  process.exit(0);
}

const client = createClient({ url, authToken });

// Add new migrations here as simple SQL statements.
// Each migration is idempotent (safe to run multiple times).
const migrations: string[] = [
  // Add isFeatured column to Review table
  `ALTER TABLE "Review" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false`,
];

async function run() {
  console.log("[migrate] Running migrations against Turso...");

  for (const sql of migrations) {
    try {
      await client.execute(sql);
      console.log(`[migrate] OK: ${sql.slice(0, 60)}...`);
    } catch (err: any) {
      // "duplicate column" means it already exists — that's fine
      if (err.message?.includes("duplicate column") || err.message?.includes("already exists")) {
        console.log(`[migrate] SKIP (already exists): ${sql.slice(0, 60)}...`);
      } else {
        console.error(`[migrate] FAIL: ${sql.slice(0, 60)}...`);
        console.error(err.message);
        process.exit(1);
      }
    }
  }

  console.log("[migrate] Done.");
}

run();
