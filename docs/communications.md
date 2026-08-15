# Communications — Temporary Email & Temporary Phone/SMS

HAVEN runs two real inbound communication systems behind provider
abstractions. Nothing is hardcoded to a single vendor: the active adapter is
chosen from environment variables, and a development **mock** exists for each
side. Production never silently falls back to a mock.

## Providers

| System | Env switch | Adapters |
| --- | --- | --- |
| Inbound email | `EMAIL_INBOUND_PROVIDER` | `mock` (dev), `mailgun`, `postmark`, `smtp` |
| SMS / phone numbers | `SMS_PROVIDER` | `mock` (dev), `twilio`, `telnyx`, `vonage` |

Mock adapters are refused when `NODE_ENV=production`
(`allowMockProviders()` in `config/env.ts`). Admin → *Email providers* /
*SMS providers* shows every adapter with its enabled/health state; provider
rows live in the `EmailProvider` / `SmsProvider` tables and are seeded, never
created with secrets in plaintext.

### Required environment variables

```
EMAIL_INBOUND_PROVIDER=mock | mailgun | postmark | smtp
MAILGUN_API_KEY=            MAILGUN_WEBHOOK_SIGNING_KEY=   MAILGUN_DOMAIN=
POSTMARK_SERVER_TOKEN=      POSTMARK_WEBHOOK_USER=         POSTMARK_WEBHOOK_PASS=

SMS_PROVIDER=mock | twilio | telnyx | vonage
TWILIO_ACCOUNT_SID=  TWILIO_AUTH_TOKEN=   TWILIO_WEBHOOK_AUTH=user:pass
TELNYX_API_KEY=      TELNYX_PUBLIC_KEY=            # Ed25519 webhook verify key
VONAGE_API_KEY=      VONAGE_API_SECRET=

MAILBOX_TTL_MINUTES=10        # free-plan mailbox lifetime fallback
SMS_NUMBER_TTL_MINUTES=10     # number assignment lifetime fallback
```

Admin-tunable (SystemSetting): `sms.default_ttl_minutes`,
`sms.quarantine_minutes` (default 1440 = 24 h), message retention keys.

## Webhooks

Canonical inbound endpoints (aliases of the versioned API routes):

```
POST /api/webhooks/mailgun/inbound      POST /api/webhooks/twilio/sms
POST /api/webhooks/postmark/inbound     POST /api/webhooks/telnyx/sms
                                        POST /api/webhooks/vonage/sms
(Versioned equivalents: /api/v1/inbound/:provider, /api/v1/sms/inbound/:provider.)
```

**Signatures are always verified before parsing.** Verification never passes
because a header merely exists:

- **Mailgun** — HMAC-SHA256 of `timestamp + token` against the webhook signing
  key, with a freshness window on the timestamp.
- **Postmark** — HTTP basic auth against `POSTMARK_WEBHOOK_USER/PASS`.
- **Twilio** — HMAC-SHA1 of the URL + sorted POST params, compared against
  `X-Twilio-Signature` (`lib` helper `twilioSignature`).
- **Telnyx** — Ed25519 over `timestamp|payload` using `TELNYX_PUBLIC_KEY`
  (`telnyx/telnyx-signature-ed25519` headers, 300 s tolerance).
- **Vonage** — MD5 or HMAC-SHA256 signature field from the payload.

If the signing secret is not configured, verification **fails closed** (403).

## Deduplication

Webhook retries never create duplicate rows:

- Email: `idempotencyKey = providerKey:mailboxId` (**unique**, scoped per
  mailbox) in `EmailMessage`.
- SMS: `idempotencyKey = providerKey:numberId` (**unique**, scoped per number
  assignment — spec: unique `phoneNumberId + providerMessageId`) in
  `SmsMessage`.

## Email pipeline

`server/services/inbound.ts`: verify → normalize → per-recipient store with
HTML sanitization (sanitize-html allowlist), attachment
classification/size-limit/scan hooks, blocked-sender checks, spam scoring,
retention-aware storage, and SSE publish to open inboxes. Mailbox lifecycle
(collision-safe address generation, TTL extension, access via owner session
or `publicToken`) lives in `server/services/mailbox.ts`.

## SMS pipeline & number lifecycle

```
AVAILABLE ──assign──▶ ASSIGNED ──cron/expiry──▶ EXPIRED
     ▲                   │                         │
     │                   └── user "Expire" ─▶ RELEASING
quarantine graduates     │        ▲                │
     └────────────── QUARANTINED ◀┴── provider release
```

`server/services/sms.ts`:

- `provisionNumber` picks from the live provider pool (mock pool in dev;
  real carrier inventory via `listAvailable` in production). If the pool is
  empty the API answers 404 with *“No temporary numbers are currently
  available for this country.”* — never a fabricated number.
- Every exit from an assignment — user release **or** natural expiry swept by
  `sweepSmsNumbers` (60 s in-process cron, `server/jobs/index.ts`) — funnels
  through `releaseNumber`: provider release, then **QUARANTINED** with
  `quarantineUntil = now + sms.quarantine_minutes`.
- `ingestSms` refuses traffic to any number that is not currently `ASSIGNED`
  and unexpired (410). A quarantined/released number's late-arriving SMS can
  therefore never reach the next renter. Quarantined numbers graduate back to
  `AVAILABLE` only after the window elapses.
- `listAvailableNumbers` excludes e164s with a live or quarantined
  assignment row.

## Access control (no IDOR)

Reads/writes on mailboxes and numbers require the owner session **or** the
one-time `publicToken` returned at creation (`?token=`, body `token`, or the
httpOnly cookie). `assertSmsNumberAccess` / `canAccessMailbox` enforce this
on every route — messages, extend, release, QR. Sequential/enumerated ids are
never authorization.

## OTP detection

`lib/otp.ts` extracts a verification code **only when one is actually
present**: 4–8 digit codes including separated forms (`482 913`, `482-913`),
prefixed forms (`G-482913`), and bare-code messages — with conservative
keyword-window rules so order numbers and dates are not invented into codes.
The detected code is stored on the message (`detectedCode`) while the
original body is preserved verbatim; the UI renders a "VERIFICATION CODE /
copy" card only when a code was detected, for both email and SMS.

## Testing

- `tests/unit/otp.test.ts` — detection shapes & false-positive rejection.
- `tests/unit/webhook-signatures.test.ts` — Twilio/Telnyx/Vonage signature
  math, positive and negative.
- `tests/integration/sms.test.ts` — full lifecycle: assign → webhook → OTP →
  dedupe → IDOR denial → expiry sweep → quarantine → graduated availability.

Gates before shipping: `npm run lint`, `npm run typecheck`, `npm run test`,
`npm run build`.
