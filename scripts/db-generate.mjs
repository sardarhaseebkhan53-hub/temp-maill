#!/usr/bin/env node
// Wrapper around `prisma generate` that degrades gracefully in restricted
// network sandboxes where the Prisma engine binary cannot be downloaded.
//
// The Haven runtime never imports `@prisma/client` (the project uses a
// built-in `node:sqlite` shim — see `lib/orm.ts` and `lib/db.ts`), so a
// missing Prisma client does not block `npm run dev`, `npm run test`, or
// `npm run build`. The Prisma schema in `database/prisma/schema.prisma`
// stays the production contract for PostgreSQL deployments, where operators
// run `prisma generate` / `prisma migrate deploy` directly.
//
// Behavior:
//   1. Try `prisma generate`.
//   2. If it fails because the engine binary cannot be downloaded, warn and
//      exit 0 so local workflows continue. The schema is still validated
//      manually (CI / production still has full network access).

import { spawnSync } from "node:child_process";

const SCHEMA = "database/prisma/schema.prisma";

console.log("[db:generate] Running `prisma generate` against", SCHEMA);
// Pipe so we can inspect the output for network-failure patterns. Prisma
// sometimes writes the failure to stdout (via the inherited terminal) even
// when the actual error text comes from a child process.
const result = spawnSync("npx", ["--no-install", "prisma", "generate", `--schema=${SCHEMA}`], {
  stdio: ["ignore", "pipe", "pipe"],
  env: process.env,
  encoding: "utf8",
});

const stdout = (result.stdout || "").toString();
const stderr = (result.stderr || "").toString();
// Replay the captured output so the operator still sees what happened.
process.stdout.write(stdout);
process.stderr.write(stderr);

if (result.status === 0) {
  console.log("[db:generate] Prisma client generated.");
  process.exit(0);
}

// Heuristic: the only error we suppress is the engine-binary download failure.
// Anything else (bad schema, missing prisma binary on PATH) must still fail
// the script so the operator sees a real problem.
const combined = stdout + "\n" + stderr;
const isNetworkFailure =
  /binaries\.prisma\.sh/i.test(combined) ||
  /Client network socket disconnected/i.test(combined) ||
  /ENOTFOUND|ETIMEDOUT|ECONNRESET|EAI_AGAIN/i.test(combined) ||
  /SSL_ERROR_SYSCALL/i.test(combined) ||
  /secure TLS connection was established/i.test(combined);

if (isNetworkFailure) {
  console.warn(
    "\n[db:generate] WARNING: Prisma engine binary could not be downloaded.\n" +
      "[db:generate] Continuing without `@prisma/client` — the local SQLite\n" +
      "[db:generate] runtime does not import it. The schema file remains the\n" +
      "[db:generate] production contract and will be re-applied on deploy.\n",
  );
  process.exit(0);
}

console.error("[db:generate] `prisma generate` failed; see output above.");
process.exit(result.status ?? 1);
