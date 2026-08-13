import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FlagToggles } from "@/components/features/admin-flags";

export default async function Page() {
  await requirePermission("admin.settings.write");
  const rows = await prisma.featureFlag.findMany({ orderBy: { key: "asc" } });
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Feature flags</h1>
      <FlagToggles flags={rows.map((r) => ({ key: r.key, enabled: r.enabled, description: r.description }))} />
    </div>
  );
}
