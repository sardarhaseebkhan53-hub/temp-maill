/**
 * Loads `.env` before anything else in the seed imports `lib/db`.
 *
 * `lib/db` opens the SQLite file at module-evaluation time using
 * `process.env.DATABASE_URL`, so the environment has to be populated before
 * that import is evaluated. Next.js loads `.env` automatically, but `tsx`
 * (which runs `npm run db:seed`) does not — without this, the seed writes to
 * the default `dev.db` while the running app reads the file named in `.env`,
 * leaving the app with an empty EmailDomain table and every guest mailbox
 * creation failing with DOMAIN_UNAVAILABLE.
 *
 * This module must stay the FIRST import of `database/seed/index.ts`; ES
 * modules are evaluated in declaration order, which is what guarantees the
 * env is ready before `lib/db` initialises.
 */
import { existsSync } from "node:fs";
import path from "node:path";

for (const file of [".env.local", ".env"]) {
  const full = path.resolve(process.cwd(), file);
  if (!existsSync(full)) continue;
  try {
    // Node >= 20.12 / 22. Existing values win, matching Next.js precedence.
    process.loadEnvFile(full);
  } catch {
    /* malformed or unreadable env file — fall back to the process env */
  }
}

export {};
