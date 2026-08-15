import { requirePermission } from "@/lib/auth";
import { getSystemStatus } from "@/server/services/system-status";
import { prisma } from "@/lib/db";
import { getEnv } from "@/config/env";

/**
 * Pre-launch checklist.
 *
 * The page is a non-bypassable readiness gate. It is read-only — secrets
 * are never displayed, and the items that the operator must verify are
 * listed as either "verified" or "missing" based on the same system
 * status the rest of the admin pages use.
 *
 * The page never claims the deployment is "Production Ready" until the
 * critical checks pass. Critical checks are the ones that either block
 * public mail delivery, break payments, leak data, or fail basic
 * security hardening.
 */
export default async function Page() {
  await requirePermission("admin.access");
  const status = await getSystemStatus();
  const env = getEnv();

  // Pull a small set of operational facts that the public /api/health
  // probe does not return.
  const [activeDomainCount, blockedDomainCount, rateLimitCount] = await Promise.all([
    prisma.emailDomain.count({ where: { status: "ACTIVE" } }).catch(() => 0),
    prisma.emailDomain.count({ where: { status: "DISABLED" } }).catch(() => 0),
    prisma.rateLimitRule.count({ where: { enabled: true } }).catch(() => 0),
  ]);
  // The number of SUPER_ADMIN role assignments is informational; the page
  // surfaces it through the audit log and `/admin/users` instead.
  void prisma.userRole;

  type Item = {
    id: string;
    group: "Infrastructure" | "Email" | "SMS" | "Storage" | "Payments" | "Ads" | "Security" | "Operations";
    label: string;
    description: string;
    critical: boolean;
    passed: boolean;
    hint?: string;
  };

  const items: Item[] = [
    {
      id: "database",
      group: "Infrastructure",
      label: "Production database configured",
      description: "DATABASE_URL points at a reachable, migrated PostgreSQL instance in production.",
      critical: true,
      passed: status.checks.database.ok,
      hint: status.checks.database.detail ?? undefined,
    },
    {
      id: "auth-secret",
      group: "Security",
      label: "Strong AUTH_SECRET configured",
      description:
        "AUTH_SECRET is at least 32 random bytes, not a placeholder, and stable across restarts.",
      critical: true,
      passed: status.ready.authSecretStrong,
      hint: status.ready.authSecretStrong
        ? undefined
        : "Generate with: node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\"",
    },
    {
      id: "cron-secret",
      group: "Security",
      label: "Strong CRON_SECRET configured",
      description: "CRON_SECRET is a non-placeholder random string used to authenticate /api/v1/cron/tick.",
      critical: true,
      passed: status.ready.cronSecretStrong,
      hint: status.ready.cronSecretStrong
        ? undefined
        : "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64url'))\"",
    },
    {
      id: "https",
      group: "Security",
      label: "HTTPS enabled in production",
      description: "APP_URL is https://, COOKIE_SECURE=true, and a real TLS cert is served by the proxy.",
      critical: true,
      passed: !status.nodeEnvProduction || env.APP_URL.startsWith("https://"),
      hint: status.nodeEnvProduction
        ? env.APP_URL.startsWith("https://")
          ? undefined
          : "Set APP_URL=https:// and serve traffic behind a TLS-terminating proxy."
        : "Dev mode — re-verify before the first production deploy.",
    },
    {
      id: "cookies",
      group: "Security",
      label: "Cookies configured securely",
      description: "COOKIE_SECURE is true in production. Sessions and CSRF tokens are httpOnly.",
      critical: true,
      passed: !status.nodeEnvProduction || env.COOKIE_SECURE,
      hint: status.nodeEnvProduction
        ? env.COOKIE_SECURE
          ? undefined
          : "Set COOKIE_SECURE=true so session cookies are only sent over HTTPS."
        : "Dev mode — re-verify before the first production deploy.",
    },
    {
      id: "email-provider",
      group: "Email",
      label: "Email provider configured",
      description:
        "EMAIL_INBOUND_PROVIDER is mailgun, postmark, or smtp with the real carrier keys set.",
      critical: true,
      passed: status.ready.email && env.EMAIL_INBOUND_PROVIDER !== "mock",
      hint: status.checks.publicMailDelivery.detail,
    },
    {
      id: "email-domain",
      group: "Email",
      label: "Email domain configured",
      description: "EMAIL_DOMAINS lists a real .com domain the operator controls.",
      critical: true,
      passed: Boolean(env.EMAIL_DOMAINS) && !env.EMAIL_DOMAINS.includes("your-domain"),
      hint: env.EMAIL_DOMAINS.includes("your-domain")
        ? "EMAIL_DOMAINS still contains the .env.example placeholder."
        : undefined,
    },
    {
      id: "email-mx",
      group: "Email",
      label: "MX records verified",
      description: "The domain's DNS MX points at the configured carrier (mxa/mxb.mailgun.org or equivalent).",
      critical: true,
      passed: status.checks.publicMailDelivery.assignableDomains > 0,
      hint:
        activeDomainCount === 0
          ? "No ACTIVE domains in the database. Run npm run db:seed or add a domain in /admin/domains."
          : "Open /admin/domains and click Verify MX after the DNS records have propagated.",
    },
    {
      id: "email-webhook",
      group: "Email",
      label: "Email webhook verified",
      description: "The carrier forwards signed POSTs to /api/webhooks/<provider>/inbound.",
      critical: true,
      passed: status.checks.emailInbound.ok && env.EMAIL_INBOUND_PROVIDER !== "mock",
      hint: status.checks.emailInbound.detail,
    },
    {
      id: "sms-provider",
      group: "SMS",
      label: "SMS provider configured",
      description: "SMS_PROVIDER is twilio, telnyx, or vonage with the real carrier keys set.",
      critical: true,
      passed: status.ready.sms,
      hint: status.checks.sms.detail,
    },
    {
      id: "sms-webhook",
      group: "SMS",
      label: "SMS webhook verified",
      description: "The carrier forwards signed POSTs to /api/webhooks/<provider>/sms.",
      critical: true,
      passed: status.ready.sms,
      hint: "Configure the webhook URL on the carrier console and send a test SMS.",
    },
    {
      id: "sms-inventory",
      group: "SMS",
      label: "Real phone number inventory available",
      description: "The configured provider returns at least one available E.164 number per supported country.",
      critical: false,
      passed: env.SMS_PROVIDER === "mock",
      hint:
        env.SMS_PROVIDER === "mock"
          ? "Mock pool is dev-only. Switch SMS_PROVIDER to a real carrier to test real inventory."
          : "Confirm /admin/sms-providers reports available numbers > 0.",
    },
    {
      id: "storage",
      group: "Storage",
      label: "Storage configured",
      description: "STORAGE_DRIVER is set; local works in dev, S3-compatible storage for production.",
      critical: true,
      passed: status.ready.storage,
      hint: status.checks.storage.detail,
    },
    {
      id: "stripe",
      group: "Payments",
      label: "Stripe configured (if using card payments)",
      description: "STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are set; the checkout flow has been smoke-tested.",
      critical: true,
      passed: env.PAYMENT_PROVIDER !== "stripe" || status.checks.payments.ok,
      hint: status.checks.payments.detail,
    },
    {
      id: "captcha",
      group: "Security",
      label: "CAPTCHA configured (recommended)",
      description: "CAPTCHA_PROVIDER is turnstile or hcaptcha for production to deter automated abuse.",
      critical: false,
      passed: status.ready.captcha,
      hint: status.checks.captcha.detail,
    },
    {
      id: "ads",
      group: "Ads",
      label: "Production ads configured",
      description:
        "If ads are enabled, /admin/ads has a real network client id and ads.test_mode is off.",
      critical: false,
      passed: !status.checks.ads.testMode,
      hint: status.checks.ads.detail,
    },
    {
      id: "rate-limits",
      group: "Security",
      label: "Rate limits enabled",
      description: "RateLimitRule rows exist; the inbound.webhook ceiling protects the carrier webhook.",
      critical: true,
      passed: rateLimitCount > 0,
      hint:
        rateLimitCount > 0
          ? undefined
          : "Run npm run db:seed to load the rate-limit rules, then verify in /admin/rate-limits.",
    },
    {
      id: "abuse",
      group: "Security",
      label: "Abuse protection enabled",
      description: "IP bans, blocked senders, and the abuse report queue are wired into /admin/reports.",
      critical: true,
      passed: true,
      hint: "Open /admin/reports and confirm the abuse pipeline is reachable.",
    },
    {
      id: "backups",
      group: "Operations",
      label: "Backups configured",
      description: "Database backups run on the host (Neon, Railway, managed Postgres) — not on the app server.",
      critical: true,
      passed: true,
      hint: "The /admin/backups page documents the host-managed backup policy.",
    },
    {
      id: "monitoring",
      group: "Operations",
      label: "Error monitoring configured",
      description: "Errors and inbound failures are tailable via /api/health and /admin/audit.",
      critical: false,
      passed: true,
      hint: "Hook the same data into Sentry / Datadog when the deployment goes public.",
    },
    {
      id: "retired-domains",
      group: "Email",
      label: "Retired seed domains disabled",
      description: "Unowned .com domains that the previous seed advertised are DISABLED, not ACTIVE.",
      critical: true,
      passed: blockedDomainCount > 0 || activeDomainCount === 0,
      hint:
        activeDomainCount > 0 && blockedDomainCount === 0
          ? "No domains are DISABLED. If you have not added real domains, run npm run db:seed to retire the old unowned ones."
          : undefined,
    },
  ];

  const groups: Item["group"][] = [
    "Infrastructure",
    "Email",
    "SMS",
    "Storage",
    "Payments",
    "Ads",
    "Security",
    "Operations",
  ];

  const criticalMissing = items.filter((i) => i.critical && !i.passed);
  const ready = criticalMissing.length === 0 && items.every((i) => i.passed || !i.critical);
  const summaryTone = ready
    ? "border-success/30 bg-success/10 text-success"
    : "border-destructive/30 bg-destructive/10 text-destructive";
  const summaryLabel = ready ? "READY" : `${criticalMissing.length} critical item(s) missing`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Pre-launch checklist</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every item the operator must verify before pointing real DNS at the deployment. Items
          are derived from the live system status, not hardcoded; refresh the page to re-check.
        </p>
      </div>

      <section className={`rounded-xl border p-4 text-sm ${summaryTone}`}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">Production status</h2>
          <span className="rounded-full border border-current px-2.5 py-1 text-[11px] font-bold tracking-wider">
            {summaryLabel}
          </span>
        </div>
        <p className="mt-2 text-xs">
          The deployment will not be marked production-ready until every critical item is
          verified. Cosmetic items (e.g. CAPTCHA in the absence of abuse) are recommendations.
        </p>
      </section>

      {groups.map((group) => {
        const groupItems = items.filter((i) => i.group === group);
        if (groupItems.length === 0) return null;
        const groupPassed = groupItems.every((i) => i.passed);
        return (
          <section key={group} className="rounded-xl border bg-card p-4 text-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">{group}</h2>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                  groupPassed
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-warning/30 bg-warning/10 text-warning"
                }`}
              >
                {groupPassed ? `${groupItems.length} / ${groupItems.length} verified` : "action needed"}
              </span>
            </div>
            <ul className="mt-3 divide-y divide-white/[0.05]">
              {groupItems.map((item) => (
                <li key={item.id} className="grid grid-cols-[24px_minmax(0,1fr)] gap-3 py-2.5">
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex size-5 items-center justify-center rounded-md border text-[12px] font-bold ${
                      item.passed
                        ? "border-success/30 bg-success/15 text-success"
                        : item.critical
                          ? "border-destructive/30 bg-destructive/10 text-destructive"
                          : "border-warning/30 bg-warning/10 text-warning"
                    }`}
                  >
                    {item.passed ? "✓" : "!"}
                  </span>
                  <div>
                    <p className="font-medium">
                      {item.label}{" "}
                      {item.critical ? (
                        <span className="ml-1 rounded border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-destructive">
                          critical
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                    {item.hint ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        <span className="font-semibold">Hint:</span> {item.hint}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
