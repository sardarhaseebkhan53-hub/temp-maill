import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Page() {
  await requirePermission("admin.plans.write");
  const rows = await prisma.plan.findMany({ include: { prices: true, limits: true }, orderBy: { sortOrder: "asc" } });
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Plans</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((p) => (
          <div key={p.id} className="rounded-2xl border bg-card p-4">
            <h2 className="font-semibold">{p.name}</h2>
            <p className="text-sm text-muted-foreground">{p.description}</p>
            <ul className="mt-3 text-xs space-y-1">
              {p.prices.map((pr: { id: string; currency: string; interval: string; amountCents: number }) => (
                <li key={pr.id}>
                  {pr.currency} {pr.interval} · {(pr.amountCents / 100).toFixed(2)}
                </li>
              ))}
            </ul>
            <ul className="mt-3 text-xs text-muted-foreground">
              {p.limits.map((l: { id: string; key: string; value: string }) => (
                <li key={l.id}>
                  {l.key} = {l.value}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
