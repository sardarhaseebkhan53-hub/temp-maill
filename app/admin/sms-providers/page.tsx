import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSmsProvider } from "@/server/providers/sms";
import { getEnv, isProduction } from "@/config/env";
import { listAvailableNumbers, listSupportedCountries } from "@/server/services/sms";
import { Errors } from "@/lib/errors";

/**
 * SMS provider control surface. Operators see:
 *   - which adapter is selected and its health (live + seeded)
 *   - the configured environment variables (with secrets masked)
 *   - the inbound webhook URL each adapter expects
 *   - real countries + number inventory the selected provider can serve
 *     right now (or "no real provider" / "mock only" states)
 *   - live counts: active, expired, quarantined, blocked assignments
 *
 * Mock adapter is highlighted so it cannot be mistaken for a production
 * setup — its pool uses 555-01xx and 7700-900xxx reserved ranges that
 * never carry real carrier traffic.
 */
export default async function Page() {
  await requirePermission("admin.providers.write");
  const env = getEnv();
  const selectedKey = env.SMS_PROVIDER;
  const selected = getSmsProvider(selectedKey);
  const liveHealth = await selected.health().catch(() => ({ ok: false, detail: "unavailable" }));
  const rows = await prisma.smsProvider.findMany({ orderBy: { name: "asc" } });
  const activeProvider =
    (await prisma.smsProvider.findFirst({ where: { enabled: true } })) ?? rows[0];

  const isMockSelected = selectedKey === "mock";
  const showRealInventory = !isMockSelected && !isProduction() ? false : !isMockSelected;

  // Inventory is best-effort — the selected provider's API may be unreachable.
  let supportedCountries: string[] = [];
  let inventoryError: string | null = null;
  let availableCount = 0;
  if (showRealInventory) {
    try {
      const [countries, available] = await Promise.all([
        listSupportedCountries(),
        listAvailableNumbers(),
      ]);
      supportedCountries = countries;
      availableCount = available.length;
    } catch (error) {
      inventoryError = error instanceof Error ? error.message : "provider query failed";
    }
  }

  // Live assignment counts. These are real database facts, not mock data.
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60_000);
  const [activeCount, quarantinedCount, blockedCount, recentCount] = await Promise.all([
    prisma.smsNumber.count({
      where: { status: "ASSIGNED", expiresAt: { gt: now } },
    }),
    prisma.smsNumber.count({
      where: { status: "QUARANTINED", quarantineUntil: { gt: now } },
    }),
    prisma.smsNumber.count({ where: { status: "BLOCKED" } }),
    prisma.smsNumber.count({
      where: { createdAt: { gt: oneDayAgo } },
    }),
  ]);

  const webhookUrls: { key: string; url: string }[] = [
    { key: "twilio", url: "/api/webhooks/twilio/sms" },
    { key: "telnyx", url: "/api/webhooks/telnyx/sms" },
    { key: "vonage", url: "/api/webhooks/vonage/sms" },
  ];

  const envRows: { label: string; value: string; present: boolean; secret?: boolean }[] = [
    { label: "SMS_PROVIDER", value: env.SMS_PROVIDER, present: true },
    {
      label: "TWILIO_ACCOUNT_SID",
      value: env.TWILIO_ACCOUNT_SID,
      present: Boolean(env.TWILIO_ACCOUNT_SID),
      secret: true,
    },
    {
      label: "TWILIO_AUTH_TOKEN",
      value: env.TWILIO_AUTH_TOKEN,
      present: Boolean(env.TWILIO_AUTH_TOKEN),
      secret: true,
    },
    {
      label: "TELNYX_API_KEY",
      value: env.TELNYX_API_KEY,
      present: Boolean(env.TELNYX_API_KEY),
      secret: true,
    },
    {
      label: "TELNYX_PUBLIC_KEY",
      value: env.TELNYX_PUBLIC_KEY,
      present: Boolean(env.TELNYX_PUBLIC_KEY),
      secret: true,
    },
    {
      label: "VONAGE_API_KEY",
      value: env.VONAGE_API_KEY,
      present: Boolean(env.VONAGE_API_KEY),
      secret: true,
    },
    {
      label: "VONAGE_API_SECRET",
      value: env.VONAGE_API_SECRET,
      present: Boolean(env.VONAGE_API_SECRET),
      secret: true,
    },
    { label: "SMS_NUMBER_TTL_MINUTES", value: String(env.SMS_NUMBER_TTL_MINUTES), present: true },
  ];

  // Defensive: surface a hint if the user happens to land here in production
  // with a non-production mock.
  if (isMockSelected && isProduction()) {
    throw Errors.providerDown("SMS");
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">SMS providers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The selected adapter reads from <code>SMS_PROVIDER</code>. Real credentials stay in
          the deployment environment — the console only reflects what is configured.
        </p>
      </div>

      <section
        className={`rounded-xl border p-4 ${
          liveHealth.ok
            ? "border-success/30 bg-success/10"
            : "border-destructive/30 bg-destructive/10"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold capitalize">Selected: {selectedKey}</h2>
          <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
            {liveHealth.ok ? "ready" : "misconfigured"}
          </span>
        </div>
        <p className="mt-2 text-sm">{liveHealth.detail || "No detail."}</p>
        {isMockSelected ? (
          <p className="mt-2 text-xs text-warning">
            Mock pool uses reserved 555-01xx and 7700-900xxx numbers — it never receives real
            SMS. Configure a real adapter (twilio, telnyx, vonage) before launch.
          </p>
        ) : null}
        {activeProvider ? (
          <p className="mt-1 text-xs opacity-75">
            Seed health: {activeProvider.healthStatus}
            {activeProvider.lastError ? ` · ${activeProvider.lastError}` : ""}
          </p>
        ) : null}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Active assignments", activeCount],
          ["Quarantined", quarantinedCount],
          ["Blocked", blockedCount],
          ["Created (24h)", recentCount],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border bg-card p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border bg-card p-4 text-sm">
        <h2 className="font-semibold">Real countries the selected provider can serve</h2>
        {isMockSelected ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Mock mode only — the pool is reserved for development. Switch <code>SMS_PROVIDER</code>{" "}
            to twilio, telnyx, or vonage to see real inventory.
          </p>
        ) : inventoryError ? (
          <p className="mt-2 text-xs text-destructive">
            Provider query failed: {inventoryError}
          </p>
        ) : supportedCountries.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            The selected provider returned no available numbers. It is either out of stock or its
            credentials are not yet configured.
          </p>
        ) : (
          <>
            <p className="mt-1 text-xs text-muted-foreground">
              {availableCount} available number{availableCount === 1 ? "" : "s"} currently in
              Haven's pool (excluding any assigned / blocked / quarantined).
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {supportedCountries.map((c) => (
                <li
                  key={c}
                  className="rounded-full border bg-muted px-2.5 py-1 font-mono text-xs"
                >
                  {c}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="rounded-xl border bg-card p-4 text-sm">
        <h2 className="font-semibold">Environment configuration</h2>
        <ul className="mt-2 space-y-1 font-mono text-xs">
          {envRows.map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{row.label}</span>
              <span
                className={
                  row.present
                    ? "text-foreground"
                    : "text-muted-foreground italic"
                }
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
        <h2 className="font-semibold">Inbound webhook URLs</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Configure exactly one of these on the carrier console. The handler verifies the
          provider-specific signature and assigns the message to the matching <code>SmsNumber</code>.
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
        <h2 className="font-semibold">All configured adapters</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {rows.map((p) => {
            const active = p.key === selectedKey;
            return (
              <article key={p.id} className="rounded-xl border bg-muted/30 p-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{p.adapter}</p>
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
    </div>
  );
}
