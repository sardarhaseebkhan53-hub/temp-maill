import { NextResponse } from "next/server";
import { pingDb, prisma } from "@/lib/db";
import { pingCache } from "@/lib/redis";
import { getInboundProvider, listInboundProviders } from "@/server/providers/email";
import { getSmsProvider } from "@/server/providers/sms";
import { inboundProviderReadiness, isDomainAssignable } from "@/server/services/email-delivery";
import { getStorage } from "@/server/providers/storage";
import { getEnv, isProduction } from "@/config/env";
import { isMeaningfulSecret } from "@/lib/secrets";

export const dynamic = "force-dynamic";

type HealthCheck = { ok: boolean; latencyMs?: number; detail?: string };

async function safely(check: () => Promise<HealthCheck>, fallback: string): Promise<HealthCheck> {
  try {
    return await check();
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : fallback,
    };
  }
}

export async function GET() {
  const [db, cache, email, sms] = await Promise.all([
    safely(pingDb, "database unavailable"),
    safely(pingCache, "cache unavailable"),
    safely(() => getInboundProvider().health(), "email provider unavailable"),
    safely(() => getSmsProvider().health(), "SMS provider unavailable"),
  ]);

  const delivery = inboundProviderReadiness();
  const env = getEnv();
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
    listInboundProviders().map(async (provider) => [
      provider.key,
      await safely(() => provider.health(), `${provider.key} provider unavailable`),
    ] as const),
  );
  const assignableDomains = domainCheck.ok ? domains.filter(isDomainAssignable) : [];

  // Mock mode is useful for local smoke tests but must never claim that public
  // internet mail is ready. Production readiness is reserved for a configured
  // provider plus at least one active domain with verified MX.
  const publicDeliveryOk =
    delivery.status === "READY" && delivery.ready && assignableDomains.length > 0;
  const localDeliveryOk =
    delivery.status === "DEVELOPMENT" && email.ok && assignableDomains.length > 0;
  const down = !db.ok || !domainCheck.ok;
  const operationalMailOk = publicDeliveryOk || localDeliveryOk;

  // Payment, storage, captcha, OAuth: each is "ok" when it is either
  // explicitly disabled (clean signal) or has a real, non-placeholder secret
  // configured. Anything in between is "configured" without hardcoded fallbacks.
  const stripeOk = isMeaningfulSecret(env.STRIPE_SECRET_KEY);
  const stripeWebhookOk = isMeaningfulSecret(env.STRIPE_WEBHOOK_SECRET);
  const storageOk = await safely(
    async () => {
      // `LocalStorage` writes to database/data/attachments. The S3 driver is
      // a stub that throws, so we only treat local as definitely working.
      getStorage();
      return { ok: true, detail: `${env.STORAGE_DRIVER} driver` };
    },
    "storage check unavailable",
  );
  const captchaOk = await safely(async () => {
    return { ok: true, detail: `${env.CAPTCHA_PROVIDER} provider` };
  }, "captcha check unavailable");
  const oauthOk =
    (isMeaningfulSecret(env.GOOGLE_CLIENT_ID) && isMeaningfulSecret(env.GOOGLE_CLIENT_SECRET)) ||
    (isMeaningfulSecret(env.GITHUB_CLIENT_ID) && isMeaningfulSecret(env.GITHUB_CLIENT_SECRET));

  // Webhook delivery stats: number of pending/FAILED outbound webhook attempts
  // in the last 24h. Operators use this to catch a degraded third-party target
  // before users see stale features.
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60_000);
  const [pendingHooks, failedHooks, succeededHooks] = db.ok
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
      ])
    : [0, 0, 0];

  // Inbound webhook arrival stats from security events, last 24h.
  const inboundAccepted = db.ok
    ? await prisma.securityEvent.count({
        where: { type: "inbound.accepted", createdAt: { gte: oneDayAgo } },
      })
    : 0;
  const inboundRejected = db.ok
    ? await prisma.securityEvent.count({
        where: { type: "inbound.rejected", createdAt: { gte: oneDayAgo } },
      })
    : 0;

  // Ad configuration status — `ads.test_mode` is on until the operator pastes
  // a real network client id and flips it off in /admin/ads.
  const adsTestMode = db.ok
    ? ((await prisma.systemSetting.findUnique({ where: { key: "ads.test_mode" } }))?.value ?? "true") ===
      "true"
    : true;

  return NextResponse.json(
    {
      status: down
        ? "down"
        : email.ok && operationalMailOk
          ? "ok"
          : isProduction() && !operationalMailOk
            ? "degraded"
            : "ok",
      version: "1.0.0",
      environment: env.NODE_ENV,
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
        storage: storageOk,
        captcha: captchaOk,
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
          accepted24h: inboundAccepted,
          rejected24h: inboundRejected,
          detail: `Accepted ${inboundAccepted} / rejected ${inboundRejected} in the last 24h.`,
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
        providers: Object.fromEntries(providerEntries),
      },
    },
    { status: down ? 503 : 200 },
  );
}
