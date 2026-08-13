import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Page() {
  await requirePermission("admin.ads.write");
  const rows = await prisma.adPlacement.findMany({ include: { network: true } });
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Ad placements</h1>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border bg-card p-3 text-sm">
            {r.key} · {r.zone} · {r.network.name} · {r.enabled ? "on" : "off"} · exclude premium: {String(r.excludePremium)}
          </li>
        ))}
      </ul>
    </div>
  );
}
