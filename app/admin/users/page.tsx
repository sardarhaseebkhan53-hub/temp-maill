import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePermission("admin.users.read");
  const { q } = await searchParams;
  const users = await prisma.user.findMany({
    where: q
      ? { OR: [{ email: { contains: q } }, { name: { contains: q } }] }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { roles: { include: { role: true } } },
  });
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Users</h1>
      <form className="mb-4">
        <input name="q" defaultValue={q} placeholder="Search email" className="h-10 min-w-0 rounded-lg border px-3 text-base sm:text-sm bg-card" />
      </form>
      <div className="md:hidden space-y-3">
        {users.map((u) => (
          <Link key={u.id} href={`/admin/users/${u.id}`} className="block rounded-xl border bg-card p-4">
            <p className="font-medium">{u.email}</p>
            <p className="text-xs text-muted-foreground">
              {u.status} · {u.roles.map((r: { role: { key: string } }) => r.role.key).join(", ")}
            </p>
          </Link>
        ))}
      </div>
      <div className="hidden md:block rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-3">Email</th>
              <th className="p-3">Status</th>
              <th className="p-3">Roles</th>
              <th className="p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="p-3">
                  <Link href={`/admin/users/${u.id}`} className="text-primary">
                    {u.email}
                  </Link>
                </td>
                <td className="p-3">{u.status}</td>
                <td className="p-3">{u.roles.map((r: { role: { key: string } }) => r.role.key).join(", ")}</td>
                <td className="p-3">{u.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
