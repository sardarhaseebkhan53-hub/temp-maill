import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Page() {
  await requirePermission("admin.cms.write");
  const count = await prisma.translation.count();
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-2">Translations</h1>
      <p className="text-sm text-muted-foreground">
        UI strings ship as dictionaries (EN/UR/HI/AR/ES/FR/DE). Optional database overrides: {count} rows.
      </p>
    </div>
  );
}
