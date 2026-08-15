import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inboundProviderReadiness } from "@/server/services/email-delivery";
import { getSmsProvider } from "@/server/providers/sms";
import { getEnv } from "@/config/env";

/**
 * Operator-facing webhook health page.
 *
 * Reports on three surfaces:
 *   1. Inbound provider webhooks (Mailgun / Postmark / SMTP) — readiness
 *      and recent accept/reject counts from security events.
 *   2. SMS provider webhooks (Twilio / Telnyx / Vonage) — readiness and
 *      the live adapter's health.
 *   3. Outbound webhooks (per-user `Webhook` rows) — pending / failed /
 *      succeeded counts from `WebhookDelivery` so a degraded third-party
 *      target is visible before users notice.
 *
 * Secrets are never rendered.
 */
export default async function Page() {
  await requirePermission("admin.providers.write");
  const env = getEnv();
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60_000);

  const delivery = inboundProviderReadiness();
  const smsHealth = await getSmsProvider().health().catch(() => ({
    ok: false,
    detail: "SMS provider unavailable",
  }));

  const [acceptedIn, rejectedIn, pendingOut, failedOut, succeededOut, lastFailed] =
    await Promise.all([
      prisma.securityEvent.count({
        where: { type: "inbound.accepted", createdAt: { gte: oneDayAgo } },
      }),
      prisma.securityEvent.count({
        where: { type: "inbound.rejected", createdAt: { gte: oneDayAgo } },
      }),
      prisma.webhookDelivery.count({
        where: { status: "PENDING", createdAt: { gte: oneDayAgo } },
      }),
      prisma.webhookDelivery.count({
        where: { status: "FAILED", createdAt: { gte: oneDayAgo } },
      }),
      prisma.webhookDelivery.count({
        where: { status: "SUCCESS", createdAt: { gte: oneDayAgo } },
      }),
      prisma.webhookDelivery.findMany({
        where: { status: "FAILED" },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { webhook: { select: { url: true } } },
      }),
    ]);

  const inboundWebhookUrls: { provider: string; url: string }[] = [
    { provider: "mailgun", url: "/api/webhooks/mailgun/inbound" },
    { provider: "postmark", url: "/api/webhooks/postmark/inbound" },
    { provider: "smtp", url: "/api/v1/inbound/smtp" },
  ];
  const smsWebhookUrls: { provider: string; url: string }[] = [
    { provider: "twilio", url: "/api/webhooks/twilio/sms" },
    { provider: "telnyx", url: "/api/webhooks/telnyx/sms" },
    { provider: "vonage", url: "/api/webhooks/vonage/sms" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Webhooks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live health for every webhook surface: inbound email, inbound SMS, and per-user
          outbound webhooks. The console does not display URL secrets.
        </p>
      </div>

      <section
        className={`rounded-xl border p-4 text-sm ${
          delivery.ready
            ? "border-success/30 bg-success/10"
            : delivery.status === "DEVELOPMENT"
              ? "border-warning/30 bg-warning/10"
              : "border-destructive/30 bg-destructive/10"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">
            Inbound email — {delivery.provider} · {delivery.status}
          </h2>
          <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
            {delivery.ready ? "ready" : "misconfigured"}
          </span>
        </div>
        <p className="mt-2 text-xs">{delivery.detail}</p>
        <p className="mt-2 text-xs">
          Last 24h: <span className="font-mono font-semibold text-success">{acceptedIn}</span>{" "}
          accepted ·{" "}
          <span className="font-mono font-semibold text-destructive">{rejectedIn}</span> rejected
        </p>
      </section>

      <section
        className={`rounded-xl border p-4 text-sm ${
          smsHealth.ok
            ? "border-success/30 bg-success/10"
            : "border-destructive/30 bg-destructive/10"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Inbound SMS — {env.SMS_PROVIDER}</h2>
          <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
            {smsHealth.ok ? "ready" : "misconfigured"}
          </span>
        </div>
        <p className="mt-2 text-xs">{smsHealth.detail}</p>
      </section>

      <section className="rounded-xl border bg-card p-4 text-sm">
        <h2 className="font-semibold">Outbound webhooks (per-user, 24h)</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Succeeded
            </p>
            <p className="mt-1 text-2xl font-semibold text-success">{succeededOut}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Pending retry
            </p>
            <p className="mt-1 text-2xl font-semibold text-warning">{pendingOut}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Failed (terminal)
            </p>
            <p className="mt-1 text-2xl font-semibold text-destructive">{failedOut}</p>
          </div>
        </div>
        {lastFailed.length > 0 ? (
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recent failed deliveries
            </h3>
            <ul className="mt-2 divide-y divide-white/[0.05]">
              {lastFailed.map((d) => (
                <li
                  key={d.id}
                  className="grid min-w-0 grid-cols-1 gap-1 py-2 text-xs sm:grid-cols-[180px_minmax(0,1fr)_auto]"
                >
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {new Date(d.createdAt).toLocaleString()}
                  </span>
                  <span className="min-w-0 truncate font-mono text-[11px]">
                    {d.webhook.url} · {d.event}
                  </span>
                  <span className="font-mono text-[11px] text-destructive">
                    {d.lastError ? truncate(d.lastError, 60) : `status ${d.lastStatus ?? "?"}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border bg-card p-4 text-sm">
        <h2 className="font-semibold">Inbound webhook URLs to paste on the carrier</h2>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Email
            </h3>
            <ul className="mt-1 space-y-1 font-mono text-xs text-muted-foreground">
              {inboundWebhookUrls.map((w) => (
                <li key={w.provider}>
                  {w.provider}: {w.url}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              SMS
            </h3>
            <ul className="mt-1 space-y-1 font-mono text-xs text-muted-foreground">
              {smsWebhookUrls.map((w) => (
                <li key={w.provider}>
                  {w.provider}: {w.url}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}
