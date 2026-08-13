import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Page() {
  await requirePermission("admin.security.write");
  const [events, bans] = await Promise.all([
    prisma.securityEvent.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.ipBan.findMany({ orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Security</h1>
      <h2 className="font-semibold mb-2">IP bans</h2>
      <ul className="space-y-1 text-sm mb-6">
        {bans.map((b) => (
          <li key={b.id} className="font-mono">
            {b.cidr} · {b.reason}
          </li>
        ))}
        {bans.length === 0 ? <li className="text-muted-foreground">None</li> : null}
      </ul>
      <h2 className="font-semibold mb-2">Events</h2>
      <ul className="space-y-1 text-sm">
        {events.map((e) => (
          <li key={e.id}>
            {e.createdAt.toLocaleString()} · {e.type} · {e.ip}
          </li>
        ))}
      </ul>
    </div>
  );
}
