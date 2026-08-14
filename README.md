# Haven

Temporary email and privacy services. A stranger lands on the homepage, receives a working disposable inbox in under two seconds, reads sanitized mail, and leaves — no account required.

Haven is a **privacy services platform**. Temporary email ships first. SMS, API, and later tools (file drop, burner links, chat, SMTP sandbox) register as `Service` rows instead of one-off plumbing.

## What you get

- Instant disposable inboxes (created on page load)
- Real-time inbox over SSE, with capped polling fallback
- Hostile-mail pipeline: MIME checks, HTML allowlist, sandboxed viewer, attachment allowlist, optional scanner
- Server-enforced expiry and retention jobs
- Database-driven domains, plans, limits, ads, flags, and copy
- Accounts (optional): aliases, API keys, billing, sessions
- Stripe + admin-configurable manual/regional payments (JazzCash / Easypaisa / bank). Premium never activates from a client claim.
- Database-driven advertising with ten administrable slots; every paid plan is ad-free
- Admin console with RBAC and audit logs
- Public API with hashed keys (`tmp_live_` / `tmp_test_`)
- SEO landers, blog, legal pages, i18n (EN/UR/HI/AR/ES/FR/DE, RTL for AR/UR)
- PWA chrome (the mail service itself is not claimed to work offline)

We do **not** claim the product is anonymous or untraceable.

## Quick start (no Docker)

```bash
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). An inbox is created on first paint.

Seeded operator (change immediately):

- Email: `ADMIN_EMAIL` (default `admin@haven.local`)
- Password: `ADMIN_PASSWORD` (default `ChangeMe_Admin_123!`)

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Seed if needed and start Next.js on `0.0.0.0:3000` |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest (unit, integration, security) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |

## Documentation

| Doc | Contents |
| --- | --- |
| [`docs/architecture.md`](docs/architecture.md) | Layers, data flow, and design rules |
| [`docs/api.md`](docs/api.md) | Public HTTP API |
| [`docs/advertising.md`](docs/advertising.md) | Ad slots, admin configuration, and placement policy |
| [`docs/payments.md`](docs/payments.md) | Stripe and manual payment configuration and review |

## Local data

Development uses **SQLite** via Node’s built-in `node:sqlite` (no Docker, no extra database process). The Prisma schema in `database/prisma/schema.prisma` is the production contract for PostgreSQL.

- SQLite file: `database/data/dev.db` (from `DATABASE_URL=file:./dev.db`)
- Attachments: `database/data/attachments/`
- Redis is optional. If `REDIS_URL` is unset, rate limits and SSE fan-out use an in-memory fallback.

## Production database (PostgreSQL)

1. Provision managed Postgres (Neon, Railway, Render, RDS, …).
2. Set `DATABASE_URL` to the Postgres URL.
3. Point Prisma at that database (`provider = "postgresql"` in the schema) and run `prisma migrate deploy`.
4. Keep using the same service layer — models are 1:1 with the SQLite tables.

Until you switch the provider, local `npm run dev` stays on SQLite so the product runs on a laptop.

## Environment

See `.env.example`. Nothing secret belongs in git. In production you **must** set a long `AUTH_SECRET`.

Inbound email adapters:

| `EMAIL_INBOUND_PROVIDER` | Endpoint |
| --- | --- |
| `mailgun` | `POST /api/v1/inbound/mailgun` |
| `postmark` | `POST /api/v1/inbound/postmark` |
| `smtp` | `POST /api/v1/inbound/smtp` (HMAC `x-haven-smtp-signature`) |
| `mock` | Development only — never enabled when `NODE_ENV=production` |

Point the provider’s inbound route / MX at a Haven domain you added in **Admin → Domains**.

SMS adapters: `twilio`, `vonage`, `mock` (dev). Payments: `stripe` (signed webhooks) or `manual`.

## Deploy

No Docker is required.

**Vercel** — connect the repo, set env vars, attach Neon/Supabase Postgres + Upstash Redis. Add a cron against `POST /api/v1/cron/tick` with `x-cron-secret`.

**Railway / Render** — Node 20+, `npm run build` / `npm run start`, managed Postgres + Redis. Same cron.

**VPS** — `npm run build && npm run start` behind Caddy/nginx. Run a systemd timer or cron for `/api/v1/cron/tick`. Optionally run an SMTP receiver that HMAC-posts into `/api/v1/inbound/smtp`.

Jobs also start in-process from `instrumentation.ts` for single-node deploys.

## Product paths

- `/` live generator
- `/temporary-email`, `/temp-mail`, `/disposable-email`, `/10-minute-mail`, `/temporary-inbox`, `/private-email`
- `/temporary-email-api`, `/developer-api`
- `/temporary-phone`, `/sms-receiver`
- `/inbox` current box
- `/dashboard` registered users
- `/admin` operators
- `/privacy` `/terms` `/cookies` `/acceptable-use` `/abuse` `/security`

## Security notes

- Email HTML is sanitized server-side and rendered in a sandboxed iframe with a strict CSP (`sandbox` has no `allow-scripts` / `allow-same-origin`).
- Attachment downloads use `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`.
- The image proxy refuses localhost, link-local, and RFC1918 targets.
- API keys are hashed. Sessions are httpOnly cookies.
- Admin actions are permission-checked and audit-logged.

## License

Proprietary — all rights reserved unless you add a license file.
