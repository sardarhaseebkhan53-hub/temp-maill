import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Page() {
  await requirePermission("admin.plans.write");
  const rows = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Coupons</h1>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border bg-card p-3 text-sm font-mono">
            {r.code} · {r.percentOff ? `${r.percentOff}%` : r.amountOffCents} · {r.redeemedCount} used · {r.active ? "active" : "off"}
          </li>
        ))}
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">No coupons yet. Create them via settings API or seed.</p> : null}
      </ul>
    </div>
  );
}
