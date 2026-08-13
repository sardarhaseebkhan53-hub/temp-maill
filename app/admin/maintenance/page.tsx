import { requirePermission } from "@/lib/auth";
import { getSetting } from "@/lib/settings";

export default async function Page() {
  await requirePermission("admin.settings.write");
  const on = await getSetting("maintenance.enabled", "false");
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-2">Maintenance</h1>
      <p className="text-sm">Flag <code>maintenance.enabled</code> is currently {on}.</p>
      <p className="text-sm text-muted-foreground mt-2">Toggle it from System settings. The API returns 503 when it is true.</p>
    </div>
  );
}
