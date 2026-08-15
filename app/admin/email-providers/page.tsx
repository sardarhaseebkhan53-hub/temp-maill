import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getInboundProvider, listInboundProviders } from "@/server/providers/email";
import { inboundProviderReadiness, expectedMxHosts } from "@/server/services/email-delivery";
import { getEnv } from "@/config/env";
import { isMeaningfulSecret as isRealSecret } from "@/lib/secrets";

/**
 * Email provider control surface. Shows:
 *   - the selected adapter and its live health
 *   - the configured Mailgun/Postmark/SMTP environment variables
 *     (with secrets masked)
 *   - the exact inbound webhook URL the operator must paste into the
 *     carrier console
 *   - the configured expected-MX host(s) that the DNS verification will
 *     match against
 *   - one card per configured provider with its seeded health
 *
 * The "MISCONFIGURED" banner cannot be suppressed with a non-empty env
 * var: obvious placeholders like "REPLACE_WITH_..." or "your-domain.com"
 * are detected by lib/secrets and reported honestly so the operator
 * cannot accidentally launch with an unwired configuration.
 */
export default async function Page() {
  await requirePermission("admin.providers.write");
  const env = getEnv();
  const selected = inboundProviderReadiness();
  const liveHealth = await getInboundProvider().health().catch(() => ({
    ok: false,
    detail: "unavailable",
  }));
  const rows = await prisma.emailProvider.findMany({ orderBy: { name: "asc" } });
  const mxTargets = expectedMxHosts();

  // Probe each configured adapter so the console reflects what the live
  // adapter would report (not just the row from the seed).
  const adapterHealth = await Promise.all(
    listInboundProviders().map(async (provider) => {
      const health = await provider.health().catch(() => ({
        ok: false,
        detail: "unavailable",
      }));
      return { key: provider.key, health };
    }),
  );

  const envRows = [
    { label: "EMAIL_INBOUND_PROVIDER", value: env.EMAIL_INBOUND_PROVIDER, present: true },
    { label: "EMAIL_DOMAINS", value: env.EMAIL_DOMAINS, present: Boolean(env.EMAIL_DOMAINS) },
    { label: "EMAIL_EXPECTED_MX", value: env.EMAIL_EXPECTED_MX, present: Boolean(env.EMAIL_EXPECTED_MX) },
    {
      label: "MAILGUN_API_KEY",
      present: isRealSecret(env.MAILGUN_API_KEY),
      secret: true,
    },
    {
      label: "MAILGUN_WEBHOOK_SIGNING_KEY",
      present: isRealSecret(env.MAILGUN_WEBHOOK_SIGNING_KEY),
      secret: true,
    },
    { label: "MAILGUN_DOMAIN", value: env.MAILGUN_DOMAIN, present: Boolean(env.MAILGUN_DOMAIN) },
    {
      label: "POSTMARK_SERVER_TOKEN",
      present: isRealSecret(env.POSTMARK_SERVER_TOKEN),
      secret: true,
    },
    {
      label: "POSTMARK_WEBHOOK_USER",
      present: isRealSecret(env.POSTMARK_WEBHOOK_USER),
      secret: true,
    },
    {
      label: "POSTMARK_WEBHOOK_PASS",
      present: isRealSecret(env.POSTMARK_WEBHOOK_PASS),
      secret: true,
    },
    { label: "SMTP_HOST", value: env.SMTP_HOST, present: Boolean(env.SMTP_HOST) },
    { label: "SMTP_PORT", value: String(env.SMTP_PORT), present: true },
    {
      label: "SMTP_USER",
      present: isRealSecret(env.SMTP_USER),
      secret: true,
    },
    {
      label: "SMTP_PASS",
      present: isRealSecret(env.SMTP_PASS),
      secret: true,
    },
    { label: "SMTP_FROM", value: env.SMTP_FROM, present: true },
  ];

  const webhookUrls: { key: string; url: string }[] = [
    { key: "mailgun", url: "/api/webhooks/mailgun/inbound" },
    { key: "postmark", url: "/api/webhooks/postmark/inbound" },
    { key: "smtp", url: "/api/v1/inbound/smtp" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Email providers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Provider selection comes from <code>EMAIL_INBOUND_PROVIDER</code>. Credentials stay
          server-side; this console only reflects the configuration shape.
        </p>
      </div>

      <section
        className={`rounded-xl border p-4 ${
          selected.ready
            ? "border-success/30 bg-success/10"
            : selected.status === "DEVELOPMENT"
              ? "border-warning/30 bg-warning/10"
              : "border-destructive/30 bg-destructive/10"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold capitalize">Selected: {selected.provider}</h2>
          <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
            {selected.status.replaceAll("_", " ")}
          </span>
        </div>
        <p className="mt-2 text-sm">{selected.detail}</p>
        <p className="mt-1 text-xs opacity-75">
          Runtime adapter health: {liveHealth.ok ? "ready" : "not ready"}
          {liveHealth.detail ? ` · ${liveHealth.detail}` : ""}
        </p>
        {!isRealSecret(env.MAILGUN_WEBHOOK_SIGNING_KEY) ? (
          <p className="mt-2 text-xs text-destructive">
            MAILGUN_WEBHOOK_SIGNING_KEY is unset or still has the .env example placeholder. Set the
            real value before pointing public DNS at this deployment.
          </p>
        ) : null}
      </section>

      <section className="rounded-xl border bg-card p-4 text-sm">
        <h2 className="font-semibold">Inbound webhook URLs</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Paste exactly one of these into the carrier console. The handler verifies the
          provider-specific signature, parses the body, and stores the message in the matching
          mailbox.
        </p>
        <ul className="mt-2 space-y-1 font-mono text-xs text-muted-foreground">
          {webhookUrls.map((w) => (
            <li key={w.key}>
              {w.key}: {w.url}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border bg-card p-4 text-sm">
        <h2 className="font-semibold">Expected MX verification hosts</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          DNS verification accepts an exact host or any subdomain. Defaults follow
          EMAIL_EXPECTED_MX, then fall back to the selected provider.
        </p>
        {mxTargets.length === 0 ? (
          <p className="mt-2 text-xs text-warning">
            No expected MX hosts configured. Set <code>EMAIL_EXPECTED_MX</code> or rely on the
            provider default.
          </p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {mxTargets.map((h) => (
              <li key={h} className="rounded-full border bg-muted px-2.5 py-1 font-mono text-xs">
                {h}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border bg-card p-4 text-sm">
        <h2 className="font-semibold">Environment configuration</h2>
        <ul className="mt-2 space-y-1 font-mono text-xs">
          {envRows.map((row: { label: string; value?: string; present: boolean; secret?: boolean }) => (
            <li key={row.label} className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{row.label}</span>
              <span
                className={row.present ? "text-foreground" : "text-muted-foreground italic"}
              >
                {row.present
                  ? row.secret
                    ? "configured (hidden)"
                    : row.value || "—"
                  : "unset"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border bg-card p-4 text-sm">
        <h2 className="font-semibold">All configured adapters</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {rows.map((p) => {
            const active = p.key === selected.provider;
            return (
              <article key={p.id} className="rounded-xl border bg-muted/30 p-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      {p.adapter}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      active
                        ? "border-success/30 bg-success/10 text-success"
                        : "text-muted-foreground"
                    }`}
                  >
                    {active ? "selected" : p.enabled ? "enabled" : "disabled"}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">Health: {p.healthStatus}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4 text-sm">
        <h2 className="font-semibold">Adapter health (live)</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {adapterHealth.map(({ key, health }) => (
            <article key={key} className="rounded-xl border bg-muted/30 p-3 text-xs">
              <p className="font-semibold capitalize">{key}</p>
              <p className="mt-1 text-muted-foreground">
                {health.ok ? "ready" : "not ready"}
                {health.detail ? ` · ${health.detail}` : ""}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
