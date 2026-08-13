import { requirePermission } from "@/lib/auth";
import { adminKpis } from "@/server/services/stats";
import { formatMoney } from "@/lib/utils";

export default async function AdminHome() {
  await requirePermission("admin.access");
  const k = await adminKpis();
  const cards = [
    ["Users", k.users],
    ["Active users (30d)", k.activeUsers],
    ["Mailboxes", k.mailboxes],
    ["Messages today", k.messagesToday],
    ["Active mailboxes", k.activeMailboxes],
    ["Premium", k.premium],
    ["Pending payments", k.pendingPayments],
    ["Open abuse", k.openAbuse],
    ["API today", k.apiToday],
    ["Recognized revenue", formatMoney(k.revenueCents)],
  ];
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Operations</h1>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5 mt-6">
        {cards.map(([l, n]) => (
          <div key={String(l)} className="rounded-2xl border bg-card p-4">
            <div className="text-xs text-muted-foreground">{l}</div>
            <div className="font-display text-2xl tabular mt-1">{n}</div>
          </div>
        ))}
      </div>
      <h2 className="font-semibold mt-10 mb-3">Daily series</h2>
      <div className="rounded-2xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-3">Day</th>
              <th className="p-3">Inboxes</th>
              <th className="p-3">Messages</th>
              <th className="p-3">Signups</th>
            </tr>
          </thead>
          <tbody>
            {k.series.map((s) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="p-3">{s.day}</td>
                <td className="p-3 tabular">{s.mailboxesCreated}</td>
                <td className="p-3 tabular">{s.messagesReceived}</td>
                <td className="p-3 tabular">{s.signups}</td>
              </tr>
            ))}
            {k.series.length === 0 ? (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={4}>
                  No rollups yet. They appear as traffic arrives.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
