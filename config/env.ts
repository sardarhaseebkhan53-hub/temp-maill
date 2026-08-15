import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().default("http://localhost:3000"),
  APP_NAME: z.string().default("Haven"),
  DATABASE_URL: z.string().default("file:./dev.db"),
  AUTH_SECRET: z.string().min(16).default("local-dev-auth-secret-please-change-in-production-32b"),
  REDIS_URL: z.string().optional().default(""),
  SESSION_COOKIE_NAME: z.string().default("haven_session"),
  SESSION_TTL_DAYS: z.coerce.number().default(14),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  ADMIN_EMAIL: z.string().email().default("admin@haven.local"),
  ADMIN_PASSWORD: z.string().default("ChangeMe_Admin_123!"),
  EMAIL_INBOUND_PROVIDER: z.enum(["mock", "mailgun", "postmark", "smtp"]).default("mock"),
  MAILGUN_API_KEY: z.string().optional().default(""),
  MAILGUN_WEBHOOK_SIGNING_KEY: z.string().optional().default(""),
  MAILGUN_DOMAIN: z.string().optional().default(""),
  /** Comma-separated domains controlled by this deployment and offered to users. */
  EMAIL_DOMAINS: z.string().optional().default(""),
  /** Comma-separated MX hostnames/suffixes expected during DNS verification. */
  EMAIL_EXPECTED_MX: z.string().optional().default(""),
  POSTMARK_SERVER_TOKEN: z.string().optional().default(""),
  POSTMARK_WEBHOOK_USER: z.string().optional().default(""),
  POSTMARK_WEBHOOK_PASS: z.string().optional().default(""),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_FROM: z.string().default("Haven <noreply@haven.local>"),
  SMS_PROVIDER: z.enum(["mock", "twilio", "telnyx", "vonage"]).default("mock"),
  TWILIO_ACCOUNT_SID: z.string().optional().default(""),
  TWILIO_AUTH_TOKEN: z.string().optional().default(""),
  TELNYX_API_KEY: z.string().optional().default(""),
  TELNYX_PUBLIC_KEY: z.string().optional().default(""),
  VONAGE_API_KEY: z.string().optional().default(""),
  VONAGE_API_SECRET: z.string().optional().default(""),
  // Default lifetimes; DB admin settings override these fallbacks.
  MAILBOX_TTL_MINUTES: z.coerce.number().int().min(1).max(24 * 60).default(10),
  SMS_NUMBER_TTL_MINUTES: z.coerce.number().int().min(1).max(24 * 60).default(10),
  PAYMENT_PROVIDER: z.enum(["stripe", "manual"]).default("manual"),
  STRIPE_SECRET_KEY: z.string().optional().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),
  STRIPE_PUBLISHABLE_KEY: z.string().optional().default(""),
  ADS_PROVIDER: z.string().default("none"),
  ADSENSE_CLIENT_ID: z.string().optional().default(""),
  CAPTCHA_PROVIDER: z.enum(["none", "turnstile", "hcaptcha"]).default("none"),
  TURNSTILE_SITE_KEY: z.string().optional().default(""),
  TURNSTILE_SECRET_KEY: z.string().optional().default(""),
  HCAPTCHA_SITE_KEY: z.string().optional().default(""),
  HCAPTCHA_SECRET_KEY: z.string().optional().default(""),
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  S3_ENDPOINT: z.string().optional().default(""),
  S3_REGION: z.string().optional().default(""),
  S3_BUCKET: z.string().optional().default(""),
  S3_ACCESS_KEY: z.string().optional().default(""),
  S3_SECRET_KEY: z.string().optional().default(""),
  ATTACHMENT_SCANNER: z.enum(["none", "clamav", "cloud"]).default("none"),
  CLAMAV_HOST: z.string().optional().default(""),
  CLAMAV_PORT: z.coerce.number().default(3310),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  GITHUB_CLIENT_ID: z.string().optional().default(""),
  GITHUB_CLIENT_SECRET: z.string().optional().default(""),
  CRON_SECRET: z.string().default("local-dev-cron-secret"),
  // Search engine ownership verification. Supplied per deployment; never
  // hardcode a verification token in source.
  GOOGLE_SITE_VERIFICATION: z.string().optional().default(""),
  BING_SITE_VERIFICATION: z.string().optional().default(""),
});

export type AppEnv = z.infer<typeof schema>;

/**
 * Variables that must be explicitly configured in production. Everything else
 * may quietly fall back to the schema default.
 */
const PRODUCTION_REQUIRED: ReadonlyArray<keyof AppEnv> = [
  "APP_URL",
  "DATABASE_URL",
  "AUTH_SECRET",
  "ADMIN_EMAIL",
  "CRON_SECRET",
];

/**
 * `.env` files are hand-edited, so values routinely arrive with stray quotes,
 * trailing whitespace (very common when copy/pasting on Windows) or as an
 * empty assignment such as `ADMIN_EMAIL=`. Zod `.default()` only kicks in for
 * `undefined`, so an empty or padded value used to blow up the whole render
 * with "Invalid environment: ADMIN_EMAIL: Invalid email". Normalise first and
 * treat blank values as "not set".
 */
function normalizeRawEnv(source: NodeJS.ProcessEnv): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, rawValue] of Object.entries(source)) {
    if (typeof rawValue !== "string") continue;
    let value = rawValue.trim();
    // Strip a single pair of matching surrounding quotes: DATABASE_URL="file:./dev.db"
    if (value.length >= 2) {
      const first = value[0];
      const last = value[value.length - 1];
      if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
        value = value.slice(1, -1).trim();
      }
    }
    if (value === "") continue; // let the schema default apply
    out[key] = value;
  }
  return out;
}

function formatIssues(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
}

let cached: AppEnv | null = null;
let warned = false;

/**
 * Parse and cache the process environment.
 *
 * Behaviour on invalid values:
 *  - production: throw, listing every offending variable (fail fast on deploy).
 *  - development/test: log one warning naming the bad variables, drop them and
 *    fall back to the schema defaults so `next dev` still boots. A malformed
 *    optional credential should never turn the home page into a 500.
 */
export function getEnv(): AppEnv {
  if (cached) return cached;

  const raw = normalizeRawEnv(process.env);
  const parsed = schema.safeParse(raw);
  if (parsed.success) {
    cached = parsed.data;
    return cached;
  }

  const isProd = raw.NODE_ENV === "production";
  const issues = formatIssues(parsed.error);

  if (isProd) {
    throw new Error(
      `Invalid environment: ${issues}. Fix these variables in your deployment configuration (see .env.example).`,
    );
  }

  // Drop the offending keys and re-parse so defaults take over.
  const invalidKeys = new Set(
    parsed.error.issues.map((i) => String(i.path[0])).filter((k) => k && k !== "undefined"),
  );
  const fallbackInput: Record<string, string> = { ...raw };
  for (const key of invalidKeys) delete fallbackInput[key];

  const fallback = schema.safeParse(fallbackInput);
  if (!fallback.success) {
    // Should not happen — every field has a default — but keep the original
    // hard failure rather than returning a half-built config.
    throw new Error(`Invalid environment: ${formatIssues(fallback.error)}`);
  }

  if (!warned) {
    warned = true;
    console.warn(
      `[env] Ignoring invalid environment variable(s) and using defaults instead: ${issues}. ` +
        `Update your .env file (see .env.example) — these values are rejected in production.`,
    );
  }

  cached = fallback.data;
  return cached;
}

/** Clear the memoised config. Intended for tests. */
export function resetEnvCache(): void {
  cached = null;
  warned = false;
}

/**
 * Variables that are missing or still using a built-in default. Useful for a
 * deployment readiness check; empty array means production-ready.
 */
export function missingProductionEnv(): string[] {
  const raw = normalizeRawEnv(process.env);
  return PRODUCTION_REQUIRED.filter((key) => !raw[key]).map(String);
}

export function isProduction(): boolean {
  return getEnv().NODE_ENV === "production";
}

export function isTest(): boolean {
  return getEnv().NODE_ENV === "test" || process.env.VITEST === "true";
}

export function allowMockProviders(): boolean {
  return !isProduction();
}
