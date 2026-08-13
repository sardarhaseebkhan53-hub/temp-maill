import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DomainForm } from "@/components/features/admin-domain-form";

export default async function Page() {
  await requirePermission("admin.domains.write");
  const rows = await prisma.emailDomain.findMany({ orderBy: { weight: "desc" } });
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Domains</h1>
      <DomainForm />
      <ul className="mt-6 space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border bg-card p-3 text-sm flex justify-between">
            <span className="font-mono">{r.domain}</span>
            <span>
              {r.status} · {r.eligibility} · w{r.weight}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
