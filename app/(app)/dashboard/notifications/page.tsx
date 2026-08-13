import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function NotificationsPage() {
  const { user } = await requireUser();
  const rows = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Notifications</h1>
      <ul className="mt-6 space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border bg-card p-4">
            <p className="font-medium">{r.title}</p>
            <p className="text-sm text-muted-foreground">{r.body}</p>
          </li>
        ))}
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">You are all caught up.</p> : null}
      </ul>
    </div>
  );
}
