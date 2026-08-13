# Haven architecture

## North star

A visitor receives a working disposable inbox on first paint. Mail is sanitized before it is shown. Expiry is a database event, not a client guess.

## Layers

```
app/                 routes (marketing, app, admin, api)
components/          UI primitives + feature composites
features/            (hooks live in /hooks; composites in components/features)
server/services      provider-agnostic business logic
server/providers     email, sms, payment, ads, captcha, storage, scanner
server/jobs          expiry, retention, webhooks, analytics
lib/                 auth, crypto, rate limit, sanitize, settings, orm
database/            prisma schema (Postgres contract) + sqlite DDL + seed
```

## Service abstraction

`Service` + `ServiceInstance` wrap every provisioned resource. Temporary mailboxes and SMS numbers both hang off an instance. New products register a `Service` row and attach their own table.

## Mailbox state

`ACTIVE → EXPIRING_SOON → EXPIRED → PURGED`

Transitions are written to `MailboxEvent`. The UI reads server state (SSE + fetch). A job (`expire-mailboxes`, `purge-retention`) owns the clock.

## Inbound pipeline

`SMTP/Webhook → Provider adapter (verify + parse) → size/MIME checks → mailbox resolve → sanitize → store → pub/sub → client`

Unknown, expired, blocked, and duplicate (idempotency key) deliveries are explicit skip reasons.

## Auth & RBAC

- Optional accounts. Baseline inbox is guest-token + signed cookie.
- Sessions: signed JWT cookie pointing at a `Session` row (hash, expiry, revoke).
- Passwords: Argon2id.
- Roles: `SUPER_ADMIN / ADMIN / MODERATOR / SUPPORT / ANALYST / USER` via `RolePermission` matrix. Checks go through `hasPermission`, not `if (role === ...)`.
- MFA columns exist (`totpSecretEnc`, `RecoveryCode`).

## Money

Plans and prices are rows. Stripe events are signature-verified. Manual rails stay `PENDING` until an admin approves. The browser never sets `Subscription.status`.

## Config

`SystemSetting` and `FeatureFlag` are the knobs. TTL, retention, maintenance, ads, registration — no deploy required.

## Realtime

`cache.publish(mailbox:{id})`. Redis when `REDIS_URL` is set; otherwise an in-process EventEmitter. SSE endpoint degrades to polling.

## Jobs

`POST /api/v1/cron/tick` (shared secret) and `instrumentation.ts` scheduler:

- expire mailboxes
- purge bodies/attachments
- reconcile subscriptions
- deliver webhooks (SSRF-aware)
- roll up analytics
