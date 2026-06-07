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
  // Add tempo column to Order (Sound step)
  `ALTER TABLE "Order" ADD COLUMN "tempo" TEXT`,
  // Add reviewRequestedAt column to Order (persist the review-request state)
  `ALTER TABLE "Order" ADD COLUMN "reviewRequestedAt" DATETIME`,
  // Performance indexes on Order
  `CREATE INDEX IF NOT EXISTS "Order_paymentStatus_idx" ON "Order"("paymentStatus")`,
  `CREATE INDEX IF NOT EXISTS "Order_creatorId_status_idx" ON "Order"("creatorId", "status")`,
  `CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt")`,
  // Unique constraints on Stripe identifiers (prevents double-processing a payment)
  `CREATE UNIQUE INDEX IF NOT EXISTS "Order_stripeSessionId_key" ON "Order"("stripeSessionId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Order_stripePaymentId_key" ON "Order"("stripePaymentId")`,
];

async function run() {
  console.log("[migrate] Running migrations against Turso...");

  for (const sql of migrations) {
    try {
      await client.execute(sql);
      console.log(`[migrate] OK: ${sql.slice(0, 60)}...`);
    } catch (err: any) {
      const msg = err.message || "";
      // "duplicate column" / "already exists" means it's already applied — that's fine
      if (msg.includes("duplicate column") || msg.includes("already exists")) {
        console.log(`[migrate] SKIP (already exists): ${sql.slice(0, 60)}...`);
      } else if (sql.startsWith("CREATE")) {
        // Index creation failures (e.g. pre-existing duplicate data for a new
        // unique index) shouldn't block a deploy — warn loudly and move on.
        console.warn(`[migrate] WARN (index not applied): ${sql.slice(0, 60)}...`);
        console.warn(msg);
      } else {
        console.error(`[migrate] FAIL: ${sql.slice(0, 60)}...`);
        console.error(msg);
        process.exit(1);
      }
    }
  }

  console.log("[migrate] Done.");
}

run();
