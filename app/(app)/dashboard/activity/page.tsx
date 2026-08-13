import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function ActivityPage() {
  const { user } = await requireUser();
  const rows = await prisma.activityLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Activity</h1>
      <ul className="mt-6 space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border bg-card p-3 text-sm">
            {r.action} · {r.createdAt.toLocaleString()}
          </li>
        ))}
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">No activity yet.</p> : null}
      </ul>
    </div>
  );
}
