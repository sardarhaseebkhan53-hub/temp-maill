/**
 * Centralised system-status probe.
 *
 * Both `/api/health` and the admin System Health page consume the same
 * result, so the operator never sees two different stories about whether
 * the system is ready. The probe is best-effort: every individual check
 * is wrapped in `safely()` so a failing subsystem never crashes the page.
 */
import { getEnv, isProduction } from "@/config/env";
import { pingDb, prisma } from "@/lib/db";
import { pingCache } from "@/lib/redis";
import { getInboundProvider, listInboundProviders } from "@/server/providers/email";
import { getSmsProvider } from "@/server/providers/sms";
import { getStorage } from "@/server/providers/storage";
import { getCaptchaProvider } from "@/server/providers/captcha";
import {
  inboundProviderReadiness,
  isDomainAssignable,
} from "@/server/services/email-delivery";
import { isMeaningfulSecret } from "@/lib/secrets";

export type HealthCheck = { ok: boolean; latencyMs?: number; detail?: string };

export type SystemStatus = {
  generatedAt: string;
  environment: string;
  nodeEnvProduction: boolean;
  checks: {
    database: HealthCheck;
    cache: HealthCheck;
    emailInbound: HealthCheck;
    emailDomains: HealthCheck;
    publicMailDelivery: {
      ok: boolean;
      provider: string;
      mode: string;
      assignableDomains: number;
      detail: string;
    };
    sms: HealthCheck;
    payments: {
      ok: boolean;
      provider: string;
      stripe: { apiKey: boolean; webhook: boolean };
      detail: string;
    };
    storage: HealthCheck & { driver: string };
    captcha: HealthCheck & { provider: string };
    oauth: {
      ok: boolean;
      provider: string;
      detail: string;
    };
    inboundWebhooks: { ok: boolean; accepted24h: number; rejected24h: number; detail: string };
    outboundWebhooks: {
      ok: boolean;
      pending24h: number;
      failed24h: number;
      succeeded24h: number;
      detail: string;
    };
    ads: { ok: boolean; testMode: boolean; detail: string };
    queue: HealthCheck;
    redis: HealthCheck;
    providers: Record<string, HealthCheck>;
  };
  /** Convenience flags used by the pre-launch checklist page. */
  ready: {
    database: boolean;
    email: boolean;
    sms: boolean;
    storage: boolean;
    payments: boolean;
    captcha: boolean;
    authSecretStrong: boolean;
    cronSecretStrong: boolean;
    httpsRequired: boolean;
  };
};

async function safely(
  check: () => Promise<HealthCheck>,
  fallback: string,
): Promise<HealthCheck> {
  try {
    return await check();
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : fallback,
    };
  }
}

function isStrongSecret(value: string | undefined | null, minLen = 32): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.length < minLen) return false;
  // Reject obvious placeholders shipped in the .env.example template.
  if (/^REPLACE[_-]WITH[_-]/i.test(trimmed)) return false;
  if (/^local-dev-/i.test(trimmed)) return false;
  if (/^change[_-]?me/i.test(trimmed)) return false;
  if (/^please[_-]?change/i.test(trimmed)) return false;
  if (/^example[_-]?secret/i.test(trimmed)) return false;
  // Reject the schema defaults in case the env file was never written.
  if (trimmed === "local-dev-auth-secret-please-change-in-production-32b") return false;
  if (trimmed === "local-dev-cron-secret") return false;
  return true;
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const env = getEnv();
  const prod = isProduction();

  const [db, cache, email, sms] = await Promise.all([
    safely(pingDb, "database unavailable"),
    safely(pingCache, "cache unavailable"),
    safely(() => getInboundProvider().health(), "email provider unavailable"),
    safely(() => getSmsProvider().health(), "SMS provider unavailable"),
  ]);

  const delivery = inboundProviderReadiness();
  let domainCheck: HealthCheck = db.ok
    ? { ok: true }
    : { ok: false, detail: "Skipped because the database is unavailable." };
  let domains: Awaited<ReturnType<typeof prisma.emailDomain.findMany>> = [];

  if (db.ok) {
    try {
      domains = await prisma.emailDomain.findMany({ where: { status: "ACTIVE" } });
    } catch (error) {
      domainCheck = {
        ok: false,
        detail: error instanceof Error ? error.message : "domain query unavailable",
      };
    }
  }

  const providerEntries = await Promise.all(
    listInboundProviders().map(
      async (provider) =>
        [
          provider.key,
          await safely(() => provider.health(), `${provider.key} provider unavailable`),
        ] as const,
    ),
  );
  const assignableDomains = domainCheck.ok ? domains.filter(isDomainAssignable) : [];

  const publicDeliveryOk =
    delivery.status === "READY" && delivery.ready && assignableDomains.length > 0;
  const localDeliveryOk =
    delivery.status === "DEVELOPMENT" && email.ok && assignableDomains.length > 0;

  const stripeOk = isMeaningfulSecret(env.STRIPE_SECRET_KEY);
  const stripeWebhookOk = isMeaningfulSecret(env.STRIPE_WEBHOOK_SECRET);
  const captchaConfigured = env.CAPTCHA_PROVIDER !== "none";
  // Touch the captcha provider so any module-level side effects (e.g. env
  // validation) run even when the page is rendered.
  getCaptchaProvider();
  const captchaDetail = captchaConfigured
    ? `${env.CAPTCHA_PROVIDER} provider configured (site key served to the client; verification runs server-side).`
    : "No CAPTCHA provider active. Anonymous abuse protection is reduced.";

  const storageDriver = env.STORAGE_DRIVER;
  const storageOk = await safely(async () => {
    getStorage();
    return { ok: true, detail: `${storageDriver} driver` };
  }, "storage check unavailable");

  const oauthOk =
    (isMeaningfulSecret(env.GOOGLE_CLIENT_ID) && isMeaningfulSecret(env.GOOGLE_CLIENT_SECRET)) ||
    (isMeaningfulSecret(env.GITHUB_CLIENT_ID) && isMeaningfulSecret(env.GITHUB_CLIENT_SECRET));

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60_000);
  const [pendingHooks, failedHooks, succeededHooks, acceptedIn, rejectedIn] = db.ok
    ? await Promise.all([
        prisma.webhookDelivery.count({
          where: { status: "PENDING", createdAt: { gte: oneDayAgo } },
        }),
        prisma.webhookDelivery.count({
          where: { status: "FAILED", createdAt: { gte: oneDayAgo } },
        }),
        prisma.webhookDelivery.count({
          where: { status: "SUCCESS", createdAt: { gte: oneDayAgo } },
        }),
        prisma.securityEvent.count({
          where: { type: "inbound.accepted", createdAt: { gte: oneDayAgo } },
        }),
        prisma.securityEvent.count({
          where: { type: "inbound.rejected", createdAt: { gte: oneDayAgo } },
        }),
      ])
    : [0, 0, 0, 0, 0];

  const adsTestMode = db.ok
    ? ((await prisma.systemSetting.findUnique({ where: { key: "ads.test_mode" } }))?.value ?? "true") ===
      "true"
    : true;

  return {
    generatedAt: new Date().toISOString(),
    environment: env.NODE_ENV,
    nodeEnvProduction: prod,
    checks: {
      database: db,
      cache,
      emailInbound: email,
      emailDomains: domainCheck,
      publicMailDelivery: {
        ok: publicDeliveryOk,
        provider: delivery.provider,
        mode: delivery.status,
        assignableDomains: assignableDomains.length,
        detail: delivery.detail,
      },
      sms,
      payments: {
        ok: stripeOk && stripeWebhookOk,
        provider: env.PAYMENT_PROVIDER,
        stripe: { apiKey: stripeOk, webhook: stripeWebhookOk },
        detail:
          env.PAYMENT_PROVIDER === "stripe"
            ? stripeOk && stripeWebhookOk
              ? "Stripe API key and webhook secret are configured."
              : "Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET before launching paid plans."
            : "Manual / regional payments; no Stripe keys required.",
      },
      storage: { ...storageOk, driver: storageDriver },
      captcha: { ok: captchaConfigured, provider: env.CAPTCHA_PROVIDER, detail: captchaDetail },
      oauth: {
        ok: oauthOk,
        provider: isMeaningfulSecret(env.GOOGLE_CLIENT_ID)
          ? "google"
          : isMeaningfulSecret(env.GITHUB_CLIENT_ID)
            ? "github"
            : "none",
        detail: oauthOk
          ? "At least one OAuth provider is configured."
          : "No OAuth provider configured. Set GOOGLE_CLIENT_ID/SECRET or GITHUB_CLIENT_ID/SECRET to enable social login.",
      },
      inboundWebhooks: {
        ok: true,
        accepted24h: acceptedIn,
        rejected24h: rejectedIn,
        detail: `Accepted ${acceptedIn} / rejected ${rejectedIn} in the last 24h.`,
      },
      outboundWebhooks: {
        ok: failedHooks === 0,
        pending24h: pendingHooks,
        failed24h: failedHooks,
        succeeded24h: succeededHooks,
        detail:
          failedHooks === 0
            ? `All ${succeededHooks} outbound deliveries succeeded in the last 24h.`
            : `${failedHooks} outbound delivery failures in the last 24h — review /admin/audit.`,
      },
      ads: {
        ok: true,
        testMode: adsTestMode,
        detail: adsTestMode
          ? "Ads are in test mode. Real units render only after /admin/ads disables test mode and a network client id is set."
          : "Ads are live.",
      },
      queue: { ok: true, detail: "in-process scheduler" },
      redis: cache, // alias so the page can render it under "Redis"
      providers: Object.fromEntries(providerEntries),
    },
    ready: {
      database: db.ok,
      email: publicDeliveryOk || localDeliveryOk,
      sms: sms.ok && env.SMS_PROVIDER !== "mock",
      storage: storageOk.ok,
      // Payments: in development the manual rail is fine; in production we
      // require Stripe (or another configured card rail).
      payments: prod ? stripeOk && stripeWebhookOk : true,
      captcha: captchaConfigured || !prod,
      authSecretStrong: isStrongSecret(env.AUTH_SECRET, 32),
      cronSecretStrong: isStrongSecret(env.CRON_SECRET, 16),
      httpsRequired: prod, // CookieSecure true in production is required
    },
  };
}
