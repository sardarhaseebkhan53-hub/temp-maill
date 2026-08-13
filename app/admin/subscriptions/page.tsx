import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Page() {
  await requirePermission("admin.plans.write");
  const rows = await prisma.subscription.findMany({
    include: { user: true, plan: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Subscriptions</h1>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border bg-card p-3 text-sm">
            {r.user.email} · {r.plan.name} · {r.status}
          </li>
        ))}
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">No subscriptions yet.</p> : null}
      </ul>
    </div>
  );
}
