import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Page() {
  await requirePermission("admin.analytics.read");
  const keys = await prisma.apiKey.count();
  const logs = await prisma.apiRequestLog.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-2">API</h1>
      <p className="text-sm text-muted-foreground mb-4">{keys} keys issued</p>
      <ul className="space-y-2">
        {logs.map((l) => (
          <li key={l.id} className="rounded-xl border bg-card p-3 text-xs font-mono">
            {l.createdAt.toISOString()} {l.method} {l.path} {l.status} {l.durationMs}ms
          </li>
        ))}
      </ul>
    </div>
  );
}
