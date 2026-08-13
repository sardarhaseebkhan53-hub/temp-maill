import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserActions } from "@/components/features/admin-user-actions";

export default async function AdminUserDetail({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("admin.users.read");
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      roles: { include: { role: true } },
      subscriptions: { include: { plan: true } },
      mailboxes: { take: 10, orderBy: { createdAt: "desc" } },
    },
  });
  if (!user) notFound();
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">{user.email}</h1>
      <p className="text-sm text-muted-foreground mt-1">
        {user.status} · {user.roles.map((r: { role: { key: string } }) => r.role.key).join(", ")}
      </p>
      <div className="mt-6">
        <UserActions id={user.id} status={user.status} notes={user.notesInternal || ""} />
      </div>
      <h2 className="font-semibold mt-8 mb-2">Recent mailboxes</h2>
      <ul className="text-sm space-y-1">
        {user.mailboxes.map((m: { id: string; address: string; state: string }) => (
          <li key={m.id} className="font-mono">
            {m.address} · {m.state}
          </li>
        ))}
      </ul>
    </div>
  );
}
