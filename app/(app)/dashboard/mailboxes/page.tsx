import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listUserMailboxes, toPublicMailbox } from "@/server/services/mailbox";

export default async function MailboxesPage() {
  const { user } = await requireUser();
  const rows = await listUserMailboxes(user.id);
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Inboxes</h1>
      <ul className="mt-6 space-y-3">
        {rows.map((b) => {
          const pub = toPublicMailbox(b);
          return (
            <li key={b.id} className="rounded-2xl border bg-card p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-sm">{pub.address}</p>
                <p className="text-xs text-muted-foreground">
                  {pub.state} · {pub.unreadCount} unread
                </p>
              </div>
              <Link href="/inbox" className="text-sm text-primary">
                Open
              </Link>
            </li>
          );
        })}
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">No saved inboxes yet.</p> : null}
      </ul>
    </div>
  );
}
