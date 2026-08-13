import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SettingsEditor } from "@/components/features/admin-settings-editor";

export default async function Page() {
  await requirePermission("admin.settings.write");
  const rows = await prisma.systemSetting.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] });
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">System settings</h1>
      <SettingsEditor rows={rows.map((r) => ({ key: r.key, value: r.value, group: r.group }))} />
    </div>
  );
}
