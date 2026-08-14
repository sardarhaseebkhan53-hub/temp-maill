import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { adminKpis } from "@/server/services/stats";
import { formatMoney } from "@/lib/utils";

export default async function AdminHome() {
  await requirePermission("admin.access");
  const k = await adminKpis();

  const groups: { title: string; cards: [string, string | number, string?][] }[] = [
    {
      title: "Audience",
      cards: [
        ["Users", k.users],
        ["New users (30d)", k.newUsers],
        ["Active users (30d)", k.activeUsers],
        ["Premium subscribers", k.premium],
      ],
    },
    {
      title: "Product",
      cards: [
        ["Temporary emails generated", k.mailboxes],
        ["Active mailboxes", k.activeMailboxes],
        ["Emails received (total)", k.messagesTotal],
        ["Emails received today", k.messagesToday],
      ],
    },
    {
      title: "Revenue",
      cards: [
        ["Recognized revenue", formatMoney(k.revenueCents)],
        ["Pending payments", k.pendingPayments, "/admin/payments"],
        ["Approved payments", k.approvedPayments, "/admin/payments"],
        ["API calls today", k.apiToday],
      ],
    },
    {
      title: "Operations",
      cards: [
        ["Ad slots enabled", `${k.enabledSlots} / ${k.totalSlots}`, "/admin/ads"],
        ["Open abuse reports", k.openAbuse, "/admin/reports"],
      ],
    },
  ];

  return (
    <div className="min-w-0 space-y-8">
      <header className="min-w-0">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">Operations</h1>
        <p className="mt-1 text-sm text-slate-400">
          Aggregate counters only — Haven does not collect personal information for analytics.
        </p>
      </header>

      {groups.map((group) => (
        <section key={group.title} className="min-w-0">
          <h2 className="mb-3 text-sm font-bold text-white">{group.title}</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {group.cards.map(([label, value, href]) => {
              const card = (
                <>
                  <div className="truncate text-xs text-slate-400">{label}</div>
                  <div className="mt-1 truncate font-display text-2xl font-bold tabular text-white">
                    {typeof value === "number" ? value.toLocaleString() : value}
                  </div>
                </>
              );
              return href ? (
                <Link
                  key={label}
                  href={href}
                  className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-[#00f5a0]/30"
                >
                  {card}
                </Link>
              ) : (
                <div
                  key={label}
                  className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  {card}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <section className="min-w-0">
        <h2 className="mb-3 text-sm font-bold text-white">Daily series</h2>
        <div className="min-w-0 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-white/[0.07] text-left text-xs text-slate-400">
                <th className="p-3 font-semibold">Day</th>
                <th className="p-3 font-semibold">Inboxes</th>
                <th className="p-3 font-semibold">Messages</th>
                <th className="p-3 font-semibold">Signups</th>
              </tr>
            </thead>
            <tbody>
              {k.series.map((s) => (
                <tr key={s.id} className="border-b border-white/[0.05] last:border-0">
                  <td className="p-3 text-slate-300">{s.day}</td>
                  <td className="p-3 tabular text-slate-300">{s.mailboxesCreated}</td>
                  <td className="p-3 tabular text-slate-300">{s.messagesReceived}</td>
                  <td className="p-3 tabular text-slate-300">{s.signups}</td>
                </tr>
              ))}
              {k.series.length === 0 ? (
                <tr>
                  <td className="p-3 text-slate-500" colSpan={4}>
                    No rollups yet. They appear as traffic arrives.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
