import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getEnv } from "@/config/env";
import { publicStats } from "@/server/services/stats";

/**
 * Internal analytics overview. Surfaces the rollups that the
 * internal analytics provider maintains. When the operator wires
 * up an external provider (e.g. Plausible) it is configured via
 * environment variables and recorded here for visibility.
 */
export default async function Page() {
  await requirePermission("admin.analytics.read");
  const env = getEnv();
  const [series, totals, signupToday] = await Promise.all([
    prisma.analyticsDaily.findMany({ orderBy: { day: "desc" }, take: 14 }),
    prisma.analyticsDaily.aggregate({
      _sum: {
        visitors: true,
        mailboxesCreated: true,
        messagesReceived: true,
        signups: true,
        premiumStarts: true,
        apiRequests: true,
        revenueCents: true,
        adImpressions: true,
      },
    }),
    prisma.analyticsDaily.findFirst({
      where: { day: new Date().toISOString().slice(0, 10) },
    }),
  ]);
  const stats = await publicStats();

  const totalsRow = totals._sum;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Internal analytics. Counts are written from the application code itself — no
          third-party tracker runs in development.
        </p>
      </div>

      <section className="rounded-xl border bg-card p-4 text-sm">
        <h2 className="font-semibold">Configuration</h2>
        <ul className="mt-2 space-y-1 font-mono text-xs">
          <li className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">ANALYTICS_PROVIDER</span>
            <span>{env.ANALYTICS_PROVIDER}</span>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Mode</span>
            <span>{env.NODE_ENV === "production" ? "production" : "development"}</span>
          </li>
        </ul>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total visitors (14d)", totalsRow.visitors ?? 0],
          ["Mailboxes created (14d)", totalsRow.mailboxesCreated ?? 0],
          ["Messages received (14d)", totalsRow.messagesReceived ?? 0],
          ["Signups (14d)", totalsRow.signups ?? 0],
          ["Premium starts (14d)", totalsRow.premiumStarts ?? 0],
          ["API requests (14d)", totalsRow.apiRequests ?? 0],
          ["Revenue (14d, cents)", totalsRow.revenueCents ?? 0],
          ["Ad impressions (14d)", totalsRow.adImpressions ?? 0],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border bg-card p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 text-2xl font-semibold">{String(value)}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border bg-card p-4 text-sm">
        <h2 className="font-semibold">Public stats (what the home page advertises)</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <Stat label="Active mailboxes" value={stats.activeMailboxes ?? 0} />
          <Stat label="Mail messages (all-time)" value={stats.messagesReceived ?? 0} />
          <Stat label="Mailboxes created (all-time)" value={stats.mailboxesCreated ?? 0} />
          <Stat label="Active email domains" value={stats.activeDomains ?? 0} />
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4 text-sm">
        <h2 className="font-semibold">Daily rollups (last 14 days)</h2>
        {series.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            No analytics rows yet. They appear as traffic arrives.
          </p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[480px] text-xs">
              <thead>
                <tr className="border-b border-white/[0.07] text-left text-slate-400">
                  <th className="py-1.5 pr-3 font-semibold">Day</th>
                  <th className="py-1.5 pr-3 text-right font-semibold">Inboxes</th>
                  <th className="py-1.5 pr-3 text-right font-semibold">Messages</th>
                  <th className="py-1.5 pr-3 text-right font-semibold">Signups</th>
                  <th className="py-1.5 pr-3 text-right font-semibold">API</th>
                </tr>
              </thead>
              <tbody>
                {series
                  .slice()
                  .reverse()
                  .map((row) => (
                    <tr key={row.id} className="border-b border-white/[0.05] last:border-0">
                      <td className="py-1.5 pr-3 text-slate-300">{row.day}</td>
                      <td className="py-1.5 pr-3 text-right tabular text-slate-300">
                        {row.mailboxesCreated}
                      </td>
                      <td className="py-1.5 pr-3 text-right tabular text-slate-300">
                        {row.messagesReceived}
                      </td>
                      <td className="py-1.5 pr-3 text-right tabular text-slate-300">
                        {row.signups}
                      </td>
                      <td className="py-1.5 pr-3 text-right tabular text-slate-300">
                        {row.apiRequests}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
        {signupToday ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Today’s row exists: {signupToday.mailboxesCreated} inboxes, {signupToday.messagesReceived} messages, {signupToday.signups} signups.
          </p>
        ) : null}
      </section>
    </div>
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
