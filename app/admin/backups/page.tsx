import { requirePermission } from "@/lib/auth";

export default async function Page() {
  await requirePermission("admin.settings.write");
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-2">Backups</h1>
      <p className="text-sm text-muted-foreground max-w-xl">
        Haven expects managed Postgres backups from your host (Railway, Render, or your VPS snapshot). This console does
        not copy the database to the app server. Export user data from the user settings export endpoint.
      </p>
    </div>
  );
}
