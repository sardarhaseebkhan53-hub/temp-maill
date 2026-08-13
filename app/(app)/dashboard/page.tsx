import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const { user } = await requireUser();
  const [mailboxes, unread, aliases, keys, notes] = await Promise.all([
    prisma.temporaryMailbox.count({ where: { userId: user.id, state: { in: ["ACTIVE", "EXPIRING_SOON"] } } }),
    prisma.temporaryMailbox.aggregate({ where: { userId: user.id }, _sum: { unreadCount: true } }),
    prisma.alias.count({ where: { userId: user.id, status: { not: "DELETED" } } }),
    prisma.apiKey.count({ where: { userId: user.id, revokedAt: null } }),
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Hello{user.displayName ? `, ${user.displayName}` : ""}</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Plan {user.planKey}
        {user.subscriptionStatus ? ` · ${user.subscriptionStatus}` : ""}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mt-8">
        {[
          ["Active inboxes", mailboxes, "/dashboard/mailboxes"],
          ["Unread", unread._sum.unreadCount ?? 0, "/inbox"],
          ["Aliases", aliases, "/dashboard/aliases"],
          ["API keys", keys, "/dashboard/api-keys"],
        ].map(([l, n, href]) => (
          <Link key={String(l)} href={String(href)} className="rounded-2xl border bg-card p-5">
            <div className="text-sm text-muted-foreground">{l}</div>
            <div className="font-display text-3xl tabular mt-1">{n}</div>
          </Link>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/inbox" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm">
          Open inbox
        </Link>
        <Link href="/dashboard/aliases" className="rounded-lg border px-4 py-2 text-sm">
          New alias
        </Link>
        <Link href="/pricing" className="rounded-lg border px-4 py-2 text-sm">
          Upgrade
        </Link>
      </div>
      <h2 className="font-display text-xl font-semibold mt-10 mb-3">Recent notices</h2>
      <ul className="space-y-2">
        {notes.map((n) => (
          <li key={n.id} className="rounded-xl border bg-card p-4">
            <p className="font-medium">{n.title}</p>
            <p className="text-sm text-muted-foreground">{n.body}</p>
          </li>
        ))}
        {notes.length === 0 ? <p className="text-sm text-muted-foreground">No notices yet.</p> : null}
      </ul>
    </div>
  );
}
