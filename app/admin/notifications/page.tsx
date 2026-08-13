import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Page() {
  await requirePermission("admin.access");
  const rows = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Announcements</h1>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border bg-card p-3 text-sm">
            {r.kind} · {r.title} · {r.enabled ? "on" : "off"}
          </li>
        ))}
      </ul>
    </div>
  );
}
