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
  POSTMARK_SERVER_TOKEN: z.string().optional().default(""),
  POSTMARK_WEBHOOK_USER: z.string().optional().default(""),
  POSTMARK_WEBHOOK_PASS: z.string().optional().default(""),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_FROM: z.string().default("Haven <noreply@haven.local>"),
  SMS_PROVIDER: z.enum(["mock", "twilio", "vonage"]).default("mock"),
  TWILIO_ACCOUNT_SID: z.string().optional().default(""),
  TWILIO_AUTH_TOKEN: z.string().optional().default(""),
  VONAGE_API_KEY: z.string().optional().default(""),
  VONAGE_API_SECRET: z.string().optional().default(""),
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
});

export type AppEnv = z.infer<typeof schema>;

let cached: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment: ${issues}`);
  }
  cached = parsed.data;
  return cached;
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
