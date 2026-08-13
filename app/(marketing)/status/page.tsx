import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Status — Haven",
  description: "Public service status for Haven.",
  path: "/status",
});

export default async function StatusPage() {
  const res = await fetch(`${process.env.APP_URL || "http://localhost:3000"}/api/health`, { cache: "no-store" }).catch(
    () => null,
  );
  const json = res ? await res.json() : null;
  return (
    <div className="container py-12 max-w-xl">
      <h1 className="font-display text-3xl font-semibold">Status</h1>
      <p className="mt-3 text-muted-foreground">Live checks from /api/health.</p>
      <pre className="mt-6 rounded-2xl border bg-card p-4 text-xs overflow-auto">
        {JSON.stringify(json ?? { status: "unknown" }, null, 2)}
      </pre>
    </div>
  );
}
