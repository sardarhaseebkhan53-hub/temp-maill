import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Page() {
  await requirePermission("admin.security.write");
  const rows = await prisma.rateLimitRule.findMany();
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Rate limits</h1>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border bg-card p-3 text-sm">
            {r.key} · {r.scope} · {r.limit}/{r.windowSec}s · burst {r.burst}
          </li>
        ))}
      </ul>
    </div>
  );
}
