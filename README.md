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
- Technical SEO: per-page metadata, JSON-LD, breadcrumbs, curated sitemap, and layered index control that keeps mailbox contents out of search
- PWA chrome (the mail service itself is not claimed to work offline)

We do **not** claim the product is anonymous or untraceable.

## Quick start (no Docker)

```bash
cp .env.example .env
npm install
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). In the default mock configuration, a clearly labelled `.test` inbox is created on first paint. Use **Send local test** to exercise storage, SSE/polling, sanitization, and the reader. Mock mode does not receive mail from the public internet.

Seeded operator (change immediately):

- Email: `ADMIN_EMAIL` (default `admin@haven.local`)
- Password: `ADMIN_PASSWORD` (default `ChangeMe_Admin_123!`)

### Environment troubleshooting

`config/env.ts` validates `process.env` on first use. Values are trimmed and a
single pair of wrapping quotes is stripped, and a blank assignment (`ADMIN_EMAIL=`)
counts as unset, so the schema default applies.

If a value is still invalid the behaviour depends on `NODE_ENV`:

- **development / test** — the bad variable is ignored, the default is used and a
  single `[env] Ignoring invalid environment variable(s) …` warning is logged.
  A malformed optional value will not take the site down while you are working.
- **production** — startup throws and lists every offending variable, so a bad
  deploy fails fast instead of serving broken pages.

So if you see `Invalid environment: ADMIN_EMAIL: Invalid email`, check that line
in your `.env`: it is usually a stray space, a smart quote, or a missing domain.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start Next.js on `0.0.0.0:3000` |
| `npm run db:seed` | Seed the database (run once, or after schema changes) |
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
| [`docs/seo.md`](docs/seo.md) | Metadata, structured data, keyword map, and index control |

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

Use the provider-specific webhook aliases:

- Mailgun: `POST /api/webhooks/mailgun/inbound` (signed multipart form, including attachments)
- Postmark: `POST /api/webhooks/postmark/inbound` (JSON plus webhook Basic Auth)
- Custom SMTP receiver: `POST /api/v1/inbound/smtp` (normalized JSON plus HMAC)

### Making a real `.com` inbox receive mail

Haven deliberately does not seed unrelated public `.com` names. A realistic address is not a working address unless the deployment controls its DNS and receiving path.

1. Register or use a `.com` domain you control.
2. Set `EMAIL_DOMAINS=mail.your-domain.com` and select `EMAIL_INBOUND_PROVIDER`.
3. Configure the provider credentials shown in `.env.example`.
4. Add the provider’s receiving MX records in DNS. For a custom SMTP receiver, set `EMAIL_EXPECTED_MX` to its public hostname.
5. Configure the provider webhook to the corresponding HTTPS endpoint above.
6. Run `npm run db:seed`, then use **Admin → Domains → Verify MX**.
7. Check `/api/health`: `publicMailDelivery.ok` must be `true` before launch.
8. Send an end-to-end message from an unrelated external mailbox and confirm it appears.

Domains remain `DEGRADED` and cannot be assigned until the expected MX target is verified. Provider authentication and webhook signature checks fail closed. A valid, receiving `.com` address can still be rejected by eBay, chat platforms, or other third parties under their own disposable-email and anti-abuse policies; Haven cannot bypass those policies.

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
