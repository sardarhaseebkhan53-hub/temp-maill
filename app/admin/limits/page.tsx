import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getEnv } from "@/config/env";
import { getSettings } from "@/lib/settings";

/**
 * Limits and retention overview. Combines the database-driven
 * `SystemSetting` values with the environment fallbacks so the
 * operator sees the live numbers without grepping through env files.
 *
 * Mailbox TTL, premium TTL, extension ceiling, retention windows, and
 * the per-Plan cap are surfaced here. The /admin/settings page is
 * where these are edited at runtime; this page is the read-only
 * surface that proves what the application is actually applying.
 */
export default async function Page() {
  await requirePermission("admin.settings.write");
  const env = getEnv();
  const settings = await getSettings();
  const plans = await prisma.plan.findMany({
    orderBy: { sortOrder: "asc" },
    include: { limits: true, prices: true },
  });
  const rateLimits = await prisma.rateLimitRule.findMany({ orderBy: { key: "asc" } });

  const limitRows: { key: string; value: string; source: "env" | "db" | "default" }[] = [
    {
      key: "mailbox.default_ttl_minutes",
      value: settings["mailbox.default_ttl_minutes"] ?? String(env.MAILBOX_TTL_MINUTES),
      source: settings["mailbox.default_ttl_minutes"] ? "db" : "env",
    },
    {
      key: "mailbox.premium_ttl_minutes",
      value: settings["mailbox.premium_ttl_minutes"] ?? "1440",
      source: settings["mailbox.premium_ttl_minutes"] ? "db" : "default",
    },
    {
      key: "mailbox.expiring_soon_minutes",
      value: settings["mailbox.expiring_soon_minutes"] ?? "5",
      source: settings["mailbox.expiring_soon_minutes"] ? "db" : "default",
    },
    {
      key: "mailbox.max_extension_minutes",
      value: settings["mailbox.max_extension_minutes"] ?? "120",
      source: settings["mailbox.max_extension_minutes"] ? "db" : "default",
    },
    {
      key: "mailbox.max_message_bytes",
      value: settings["mailbox.max_message_bytes"] ?? String(2 * 1024 * 1024),
      source: settings["mailbox.max_message_bytes"] ? "db" : "default",
    },
    {
      key: "mailbox.max_attachment_bytes",
      value: settings["mailbox.max_attachment_bytes"] ?? String(5 * 1024 * 1024),
      source: settings["mailbox.max_attachment_bytes"] ? "db" : "default",
    },
    {
      key: "message.retention_minutes_free",
      value: settings["message.retention_minutes_free"] ?? "1440",
      source: settings["message.retention_minutes_free"] ? "db" : "default",
    },
    {
      key: "message.retention_minutes_premium",
      value: settings["message.retention_minutes_premium"] ?? "10080",
      source: settings["message.retention_minutes_premium"] ? "db" : "default",
    },
    {
      key: "sms.default_ttl_minutes",
      value: settings["sms.default_ttl_minutes"] ?? String(env.SMS_NUMBER_TTL_MINUTES),
      source: settings["sms.default_ttl_minutes"] ? "db" : "env",
    },
    {
      key: "sms.quarantine_minutes",
      value: settings["sms.quarantine_minutes"] ?? "1440",
      source: settings["sms.quarantine_minutes"] ? "db" : "default",
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Limits &amp; retention</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mailbox TTL, message size, attachment size, retention windows, and per-Plan caps.
          The database values win when set; environment variables are the fallback.
        </p>
      </div>

      <section className="rounded-xl border bg-card p-4 text-sm">
        <h2 className="font-semibold">Operational limits</h2>
        <ul className="mt-2 divide-y divide-white/[0.05] font-mono text-xs">
          {limitRows.map((row) => (
            <li key={row.key} className="flex items-center justify-between gap-2 py-1.5">
              <span className="text-muted-foreground">{row.key}</span>
              <span className="flex items-center gap-2">
                <span className="text-foreground">{row.value}</span>
                <span
                  className={`rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-wider ${
                    row.source === "db"
                      ? "border-success/30 bg-success/10 text-success"
                      : row.source === "env"
                        ? "border-warning/30 bg-warning/10 text-warning"
                        : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {row.source}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border bg-card p-4 text-sm">
        <h2 className="font-semibold">Plans &amp; pricing</h2>
        {plans.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            No plans configured. Run <code>npm run db:seed</code> to load the default plans.
          </p>
        ) : (
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {plans.map((p) => (
              <article key={p.id} className="rounded-xl border bg-muted/30 p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{p.name}</p>
                  <span className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] uppercase">
                    {p.key}
                  </span>
                </div>
                {p.description ? (
                  <p className="mt-1 text-muted-foreground">{p.description}</p>
                ) : null}
                {p.limits.length > 0 ? (
                  <ul className="mt-2 space-y-0.5 font-mono text-[10px] text-muted-foreground">
                    {p.limits.map((limit: { id: string; key: string; value: string }) => (
                      <li key={limit.id}>
                        {limit.key} = {limit.value}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-card p-4 text-sm">
        <h2 className="font-semibold">Rate limit rules</h2>
        {rateLimits.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            No rate-limit rules. Run <code>npm run db:seed</code> to load the defaults.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-white/[0.05] font-mono text-xs">
            {rateLimits.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 py-1.5">
                <span className="text-muted-foreground">{r.key}</span>
                <span>
                  {r.limit} / {r.windowSec}s · burst {r.burst} · {r.scope}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
