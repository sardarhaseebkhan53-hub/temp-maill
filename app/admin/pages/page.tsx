import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Page() {
  await requirePermission("admin.cms.write");
  const rows = await prisma.page.findMany();
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">CMS pages</h1>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border bg-card p-3 text-sm">
            /{r.slug} · {r.title} · {r.published ? "published" : "draft"}
          </li>
        ))}
      </ul>
    </div>
  );
}
