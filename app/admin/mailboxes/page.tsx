import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Page() {
  await requirePermission("admin.mailboxes.read");
  const rows = await prisma.temporaryMailbox.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { domain: true },
  });
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Mailboxes</h1>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border bg-card p-3 text-sm">
            <span className="font-mono">{r.address}</span> · {r.state} · {r.messageCount} messages
          </li>
        ))}
      </ul>
    </div>
  );
}
