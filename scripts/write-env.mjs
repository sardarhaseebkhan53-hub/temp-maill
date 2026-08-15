// Generate a strong, project-specific .env file from operator-supplied
// credentials. The script never logs secrets back; it writes the file with
// restrictive permissions and prints only which fields were generated.
//
// Usage:
//   MAILGUN_API_KEY=<value> [MAILGUN_WEBHOOK_SIGNING_KEY=<value>] [MAILGUN_DOMAIN=<value>] [EMAIL_DOMAINS=<value>] [ADMIN_EMAIL=<value>] node scripts/write-env.mjs
//
// If the Mailgun webhook signing key or domain is not provided, the script
// writes obvious placeholders so the deployer remembers to fill them in
// before pointing real DNS at the application.
import { randomBytes } from "node:crypto";
import { writeFileSync, chmodSync } from "node:fs";
import { resolve } from "node:path";

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || "REPLACE_WITH_MAILGUN_API_KEY";
const MAILGUN_WEBHOOK_SIGNING_KEY = process.env.MAILGUN_WEBHOOK_SIGNING_KEY || "REPLACE_WITH_MAILGUN_WEBHOOK_SIGNING_KEY";
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || "your-domain.com";
const EMAIL_DOMAINS = process.env.EMAIL_DOMAINS || "your-domain.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@haven.local";

const AUTH_SECRET = randomBytes(48).toString("base64url");
const CRON_SECRET = randomBytes(32).toString("base64url");
const ADMIN_PASSWORD = randomBytes(18).toString("base64url");

const body = `# ─── Core ───────────────────────────────────────────────────────────────────
# Haven project environment. The default values here are tuned for local
# development; production deploys must override every blank with a real
# value supplied through the platform's secret manager.
NODE_ENV=development
APP_URL=http://localhost:3000
APP_NAME=Haven

# SQLite for local. Production: PostgreSQL connection string.
# Example Postgres: postgresql://user:pass@host:5432/haven?schema=public
DATABASE_URL="file:./dev.db"

# 32+ byte secret used to sign sessions, mailbox tokens, and CSRF tokens.
AUTH_SECRET=${AUTH_SECRET}

# ─── Redis (optional — in-memory fallback if unset) ─────────────────────────
REDIS_URL=

# ─── Session / cookies ──────────────────────────────────────────────────────
SESSION_COOKIE_NAME=haven_session
SESSION_TTL_DAYS=14
COOKIE_SECURE=false

# ─── Default admin (seeded on first run if no admin exists) ─────────────────
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}

# ─── Inbound email providers ────────────────────────────────────────────────
# Active adapter: mock | mailgun | postmark | smtp
# Real production deployments should set this to the provider that owns
# the receiving DNS for your .com domain (mailgun is the most common).
EMAIL_INBOUND_PROVIDER=mailgun

# Comma-separated .com domains this deployment owns and may offer. Set this
# to the domain (or subdomain) you control, e.g. mail.your-domain.com. DNS
# MX must point to the chosen receiver before addresses become assignable.
EMAIL_DOMAINS=${EMAIL_DOMAINS}

# Expected MX receiver hostname(s), comma-separated. mailgun.org is the
# correct target for Mailgun's mxa/mxb.mailgun.org MX records.
EMAIL_EXPECTED_MX=mailgun.org

# Mailgun uses TWO distinct credentials. They are not interchangeable.
#   - MAILGUN_API_KEY             -> Mailgun REST API (sending, account ops).
#   - MAILGUN_WEBHOOK_SIGNING_KEY -> HMAC-SHA256 verification of inbound
#                                    webhooks ONLY.
# Inbound mail cannot be verified until MAILGUN_WEBHOOK_SIGNING_KEY is set.
MAILGUN_API_KEY=${MAILGUN_API_KEY}
MAILGUN_WEBHOOK_SIGNING_KEY=${MAILGUN_WEBHOOK_SIGNING_KEY}
MAILGUN_DOMAIN=${MAILGUN_DOMAIN}

# Postmark: protect /api/webhooks/postmark/inbound with these Basic Auth values.
POSTMARK_SERVER_TOKEN=
POSTMARK_WEBHOOK_USER=
POSTMARK_WEBHOOK_PASS=

# Outbound transactional mail (optional — only used if SMTP is wired up).
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=Haven <noreply@haven.local>

# ─── SMS providers ──────────────────────────────────────────────────────────
SMS_PROVIDER=mock
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WEBHOOK_AUTH=
TELNYX_API_KEY=
TELNYX_PUBLIC_KEY=
VONAGE_API_KEY=
VONAGE_API_SECRET=

# Default mailbox / SMS number lifetimes in minutes.
MAILBOX_TTL_MINUTES=10
SMS_NUMBER_TTL_MINUTES=10

# ─── Payments ───────────────────────────────────────────────────────────────
PAYMENT_PROVIDER=manual
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLISHABLE_KEY=

# ─── SEO / Search Console ───────────────────────────────────────────────────
GOOGLE_SITE_VERIFICATION=
BING_SITE_VERIFICATION=

# ─── Ads ────────────────────────────────────────────────────────────────────
ADS_PROVIDER=none
ADSENSE_CLIENT_ID=
AD_MANAGER_NETWORK_CODE=

# ─── CAPTCHA ────────────────────────────────────────────────────────────────
CAPTCHA_PROVIDER=none
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
HCAPTCHA_SITE_KEY=
HCAPTCHA_SECRET_KEY=

# ─── Object storage (attachments) ───────────────────────────────────────────
STORAGE_DRIVER=local
S3_ENDPOINT=
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=

# ─── Attachment scanning ────────────────────────────────────────────────────
ATTACHMENT_SCANNER=none
CLAMAV_HOST=
CLAMAV_PORT=3310

# ─── OAuth (optional) ───────────────────────────────────────────────────────
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# ─── Analytics ──────────────────────────────────────────────────────────────
ANALYTICS_PROVIDER=internal

# ─── Cron / jobs ────────────────────────────────────────────────────────────
CRON_SECRET=${CRON_SECRET}
`;

const target = resolve(".env");
writeFileSync(target, body, { mode: 0o600 });
chmodSync(target, 0o600);
console.log(`Wrote ${target} (mode 0600).`);
console.log("ADMIN_PASSWORD, AUTH_SECRET, CRON_SECRET generated (not shown).");
if (MAILGUN_API_KEY === "REPLACE_WITH_MAILGUN_API_KEY") {
  console.log("MAILGUN_API_KEY is a placeholder — set it before any real inbound.");
} else {
  console.log("MAILGUN_API_KEY set from environment.");
}
if (MAILGUN_WEBHOOK_SIGNING_KEY === "REPLACE_WITH_MAILGUN_WEBHOOK_SIGNING_KEY") {
  console.log("MAILGUN_WEBHOOK_SIGNING_KEY is a placeholder — set it before any real inbound.");
} else {
  console.log("MAILGUN_WEBHOOK_SIGNING_KEY set from environment.");
}
console.log(`MAILGUN_DOMAIN=${MAILGUN_DOMAIN} EMAIL_DOMAINS=${EMAIL_DOMAINS}`);
