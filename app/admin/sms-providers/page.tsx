import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Page() {
  await requirePermission("admin.providers.write");
  const rows = await prisma.smsProvider.findMany();
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">SMS providers</h1>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border bg-card p-3 text-sm">
            {r.name} · {r.adapter} · {r.enabled ? "enabled" : "disabled"} · {r.healthStatus}
          </li>
        ))}
      </ul>
    </div>
  );
}
