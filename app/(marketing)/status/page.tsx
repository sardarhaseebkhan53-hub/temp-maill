import { buildMetadata } from "@/lib/seo";
import { PageShell } from "@/components/layout/page-shell";
import { pingDb } from "@/lib/db";

export const metadata = buildMetadata({
  title: "Service Status — Haven Temporary Email",
  description:
    "Live operational status for the Haven temporary email service, including the web application and database, checked on every request.",
  path: "/status",
});

export const dynamic = "force-dynamic";

export default async function StatusPage() {
  // Checked in-process rather than via an HTTP round trip to our own origin,
  // which fails behind proxies and during builds.
  const db = await pingDb();

  const checks = [
    { name: "Web application", ok: true, detail: "Serving requests" },
    { name: "Database", ok: db.ok, detail: db.ok ? `${db.latencyMs} ms` : (db.detail ?? "Unavailable") },
  ];
  const allOk = checks.every((check) => check.ok);

  return (
    <PageShell
      path="/status"
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Status", path: "/status" },
      ]}
      eyebrow="Status"
      title={allOk ? "All systems normal" : "Degraded service"}
      description="Live checks, refreshed on every request."
    >
      <div className="max-w-2xl space-y-3">
        {checks.map((check) => (
          <div
            key={check.name}
            className="flex min-w-0 items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 p-4"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{check.name}</p>
              <p className="truncate text-xs text-slate-400">{check.detail}</p>
            </div>
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                check.ok
                  ? "border-[#00f5a0]/30 bg-[#00f5a0]/10 text-[#00f5a0]"
                  : "border-red-500/30 bg-red-500/10 text-red-300"
              }`}
            >
              <span className={`size-1.5 rounded-full ${check.ok ? "bg-[#00f5a0]" : "bg-red-400"}`} />
              {check.ok ? "Operational" : "Down"}
            </span>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
