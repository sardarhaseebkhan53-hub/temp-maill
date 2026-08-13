import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function UsagePage() {
  const { user } = await requireUser();
  const keys = await prisma.apiKey.findMany({ where: { userId: user.id }, include: { usage: true } });
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Usage</h1>
      <div className="mt-6 space-y-4">
        {keys.map((k) => (
          <div key={k.id} className="rounded-2xl border bg-card p-4">
            <p className="font-medium">{k.name}</p>
            <ul className="text-sm text-muted-foreground mt-2">
              {k.usage.map((u: { id: string; day: string; requests: number; errors: number }) => (
                <li key={u.id}>
                  {u.day}: {u.requests} requests, {u.errors} errors
                </li>
              ))}
              {k.usage.length === 0 ? <li>No traffic yet.</li> : null}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
