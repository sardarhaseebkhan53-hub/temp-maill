import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Per-rule rate-limit table. Each row reflects a live rule from the database
 * (no hardcoded fallbacks). Rules are evaluated by lib/rate-limit; admins
 * edit them through the settings or by direct DB writes.
 */
export default async function Page() {
  await requirePermission("admin.security.write");
  const rows = await prisma.rateLimitRule.findMany({ orderBy: { key: "asc" } });
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60_000);

  // Last-hour event volume per key so operators can see if a limit is hot.
  // The mini ORM has no groupBy, so we collect counts in a single query.
  const recentEvents: any[] = await prisma.securityEvent.findMany({
    where: { createdAt: { gte: hourAgo } },
    select: { type: true },
  });
  const volumeByType = new Map<string, number>();
  for (const ev of recentEvents) {
    const key = String(ev.type);
    volumeByType.set(key, (volumeByType.get(key) ?? 0) + 1);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Rate limits</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Per-rule limits applied by <code>lib/rate-limit</code>. The table is sourced from
          the database — edit a row to change the limit, window, or burst. <code>inbound.webhook</code> is
          the ceiling that protects the Mailgun / Postmark / SMTP endpoints.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No rate limit rules configured. Run <code>npm run db:seed</code> to load the
            defaults.
          </div>
        ) : null}
        {rows.map((r) => {
          const lastHour = volumeByType.get(r.key) ?? 0;
          const utilization = r.windowSec > 0 && r.limit > 0 ? (lastHour / r.limit) * 100 : 0;
          const tone =
            utilization > 90
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : utilization > 60
                ? "border-warning/30 bg-warning/10 text-warning"
                : "border-border bg-card";
          return (
            <article key={r.id} className={`rounded-xl border p-4 text-sm ${tone}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-mono text-sm font-semibold">{r.key}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Scope: <code>{r.scope}</code> · Window: {r.windowSec}s · Burst: {r.burst}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                    r.enabled
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  {r.enabled ? "enabled" : "disabled"}
                </span>
              </div>
              <p className="mt-3 text-xs">
                {r.limit} requests per {r.windowSec}s window (≈ {Math.round((r.limit / Math.max(1, Number(r.windowSec))) * 60)} req/min steady,{" "}
                {Math.round(((r.limit + r.burst) / Math.max(1, Number(r.windowSec))) * 60)} req/min peak).
              </p>
              <p className="mt-2 text-xs">
                Last hour events: <span className="font-mono font-semibold">{lastHour}</span>{" "}
                ({utilization.toFixed(0)}% of the {r.windowSec}s budget applied over an hour).
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
