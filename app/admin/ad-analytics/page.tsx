import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Page() {
  await requirePermission("admin.analytics.read");
  const impressions = await prisma.adImpression.findMany({ take: 30, orderBy: { day: "desc" } });
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-2">Ad analytics</h1>
      <p className="text-sm text-muted-foreground mb-4">Internal counts only — never fabricated revenue.</p>
      <ul className="space-y-2">
        {impressions.map((r) => (
          <li key={r.id} className="rounded-xl border bg-card p-3 text-sm">
            {r.day} · {r.count} impressions · est. {(r.estimatedCents / 100).toFixed(2)}
          </li>
        ))}
        {impressions.length === 0 ? <p className="text-sm text-muted-foreground">No recorded impressions yet.</p> : null}
      </ul>
    </div>
  );
}
