import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Page() {
  await requirePermission("admin.audit.read");
  const rows = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Audit log</h1>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border bg-card p-3 text-sm">
            {r.createdAt.toLocaleString()} · {r.actorEmail || r.actorId} · {r.action} · {r.targetType} {r.targetId}
          </li>
        ))}
      </ul>
    </div>
  );
}
