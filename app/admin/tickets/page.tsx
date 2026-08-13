import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Page() {
  await requirePermission("admin.tickets.write");
  const rows = await prisma.supportTicket.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Tickets</h1>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border bg-card p-3 text-sm">
            {r.status} · {r.email} · {r.subject}
          </li>
        ))}
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">No tickets.</p> : null}
      </ul>
    </div>
  );
}
