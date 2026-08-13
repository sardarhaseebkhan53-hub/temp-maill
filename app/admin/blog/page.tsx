import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Page() {
  await requirePermission("admin.cms.write");
  const rows = await prisma.blogPost.findMany({ orderBy: { updatedAt: "desc" } });
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Blog</h1>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border bg-card p-3 text-sm">
            {r.title} · {r.status} · /blog/{r.slug}
          </li>
        ))}
      </ul>
    </div>
  );
}
