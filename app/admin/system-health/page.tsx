import { requirePermission } from "@/lib/auth";
import { getSystemStatus } from "@/server/services/system-status";

/**
 * System Health — unified view of every provider the deployment depends
 * on, plus the pre-launch readiness signals. Data is read by the same
 * `getSystemStatus()` that serves `/api/health`, so an operator looking
 * at the admin console and a caller of the public health endpoint see
 * exactly the same story.
 *
 * Secrets are never rendered. Status labels are based on real
 * configuration: an obvious `.env.example` placeholder is reported as
 * "not configured" by `lib/secrets.isMeaningfulSecret()`.
 */
export default async function Page() {
  await requirePermission("admin.access");
  const status = await getSystemStatus();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">System health</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every provider and subsystem this deployment depends on. Data comes from the same
          probe as <code>/api/health</code>. The page refreshes on every visit; secrets are
          never rendered.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Generated {new Date(status.generatedAt).toLocaleString()} · environment{" "}
          <code>{status.environment}</code>
        </p>
      </div>

      <section className="grid gap-3 md:grid-cols-2">
        <CheckCard
          title="Database"
          ok={status.ready.database}
          okText="CONNECTED"
          badText="ERROR"
          detail={status.checks.database.detail ?? ""}
          metric={status.checks.database.latencyMs ? `${status.checks.database.latencyMs} ms` : null}
        />
        <CheckCard
          title="Email"
          ok={status.ready.email}
          okText="READY"
          badText="NOT CONFIGURED"
          detail={status.checks.publicMailDelivery.detail}
          metric={`${status.checks.publicMailDelivery.assignableDomains} assignable domain(s)`}
        />
        <CheckCard
          title="SMS"
          ok={status.ready.sms}
          okText="READY"
          badText={status.environment === "production" ? "NOT CONFIGURED" : "MOCK (DEV ONLY)"}
          detail={status.checks.sms.detail ?? ""}
          metric={null}
        />
        <CheckCard
          title="Storage"
          ok={status.ready.storage}
          okText="READY"
          badText="ERROR"
          detail={status.checks.storage.detail ?? ""}
          metric={`driver: ${status.checks.storage.driver}`}
        />
        <CheckCard
          title="Payments"
          ok={status.ready.payments}
          okText="READY"
          badText="NOT CONFIGURED"
          detail={status.checks.payments.detail}
          metric={`provider: ${status.checks.payments.provider}`}
        />
        <CheckCard
          title="CAPTCHA"
          ok={status.ready.captcha}
          okText={status.checks.captcha.provider === "none" ? "DISABLED" : "READY"}
          badText="DISABLED"
          detail={status.checks.captcha.detail}
          metric={`provider: ${status.checks.captcha.provider}`}
        />
        <CheckCard
          title="Ads"
          ok={status.checks.ads.ok}
          okText={status.checks.ads.testMode ? "TEST" : "PRODUCTION"}
          badText="DISABLED"
          detail={status.checks.ads.detail}
          metric={null}
        />
        <CheckCard
          title="Cron / Jobs"
          ok={status.checks.queue.ok}
          okText="HEALTHY"
          badText="ERROR"
          detail={status.checks.queue.detail ?? "in-process scheduler"}
          metric={null}
        />
        <CheckCard
          title="Redis / cache"
          ok={status.checks.cache.ok}
          okText="CONNECTED"
          badText="FALLBACK"
          detail={status.checks.cache.detail ?? "in-memory cache"}
          metric={status.checks.cache.latencyMs ? `${status.checks.cache.latencyMs} ms` : null}
        />
        <CheckCard
          title="OAuth (optional)"
          ok={status.checks.oauth.ok}
          okText="READY"
          badText="DISABLED"
          detail={status.checks.oauth.detail}
          metric={`provider: ${status.checks.oauth.provider}`}
        />
      </section>

      <section className="rounded-xl border bg-card p-4 text-sm">
        <h2 className="font-semibold">Inbound webhooks (last 24h)</h2>
        <p className="mt-1 text-xs text-muted-foreground">{status.checks.inboundWebhooks.detail}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Accepted" value={status.checks.inboundWebhooks.accepted24h} />
          <Stat label="Rejected" value={status.checks.inboundWebhooks.rejected24h} />
          <Stat
            label="Accepted rate"
            value={
              status.checks.inboundWebhooks.accepted24h +
                status.checks.inboundWebhooks.rejected24h ===
              0
                ? "—"
                : `${Math.round(
                    (status.checks.inboundWebhooks.accepted24h /
                      (status.checks.inboundWebhooks.accepted24h +
                        status.checks.inboundWebhooks.rejected24h)) *
                      100,
                  )}%`
            }
          />
          <Stat label="Mode" value={status.environment} />
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4 text-sm">
        <h2 className="font-semibold">Outbound webhooks (last 24h)</h2>
        <p className="mt-1 text-xs text-muted-foreground">{status.checks.outboundWebhooks.detail}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Succeeded" value={status.checks.outboundWebhooks.succeeded24h} />
          <Stat label="Pending" value={status.checks.outboundWebhooks.pending24h} />
          <Stat label="Failed" value={status.checks.outboundWebhooks.failed24h} />
          <Stat
            label="Health"
            value={status.checks.outboundWebhooks.ok ? "healthy" : "degraded"}
          />
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4 text-sm">
        <h2 className="font-semibold">Email adapters (live)</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {Object.entries(status.checks.providers).map(([key, value]) => (
            <div key={key} className="rounded-lg border bg-muted/30 p-3 text-xs">
              <p className="font-semibold capitalize">{key}</p>
              <p className="mt-1 text-muted-foreground">
                {value.ok ? "ready" : "not ready"}
                {value.detail ? ` · ${value.detail}` : ""}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function CheckCard({
  title,
  ok,
  okText,
  badText,
  detail,
  metric,
}: {
  title: string;
  ok: boolean;
  okText: string;
  badText: string;
  detail: string | undefined;
  metric: string | null;
}) {
  const tone = ok
    ? "border-success/30 bg-success/10"
    : "border-warning/30 bg-warning/10";
  return (
    <article className={`rounded-xl border p-4 text-sm ${tone}`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">{title}</h2>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider ${
            ok
              ? "border-success/30 bg-success/10 text-success"
              : "border-warning/30 bg-warning/10 text-warning"
          }`}
        >
          {ok ? okText : badText}
        </span>
      </div>
      <p className="mt-2 text-xs">{detail}</p>
      {metric ? <p className="mt-2 font-mono text-[11px] text-muted-foreground">{metric}</p> : null}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-base">{value}</p>
    </div>
  );
}
