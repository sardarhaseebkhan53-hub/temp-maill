import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Page() {
  await requirePermission("admin.audit.read");
  const jobs = await prisma.jobRun.findMany({ orderBy: { startedAt: "desc" }, take: 40 });
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Job logs</h1>
      <ul className="space-y-2">
        {jobs.map((j) => (
          <li key={j.id} className="rounded-xl border bg-card p-3 text-xs font-mono">
            {j.startedAt.toISOString()} {j.job} {j.status} {j.error || ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
