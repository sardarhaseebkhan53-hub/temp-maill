import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminDomainForm } from "@/components/features/admin-domain-form";
import { AdminDomainVerifyButton } from "@/components/features/admin-domain-verify-button";
import { inboundProviderReadiness } from "@/server/services/email-delivery";

export default async function Page() {
  await requirePermission("admin.domains.write");
  const rows = await prisma.emailDomain.findMany({ orderBy: { domain: "asc" } });
  const provider = inboundProviderReadiness();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Email domains</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Only active domains with verified inbound MX routing can generate public inboxes.
        </p>
      </div>

      <div
        className={`rounded-xl border p-4 text-sm ${
          provider.ready
            ? "border-success/30 bg-success/10 text-success"
            : provider.status === "DEVELOPMENT"
              ? "border-warning/30 bg-warning/10 text-warning"
              : "border-destructive/30 bg-destructive/10 text-destructive"
        }`}
      >
        <strong className="capitalize">{provider.provider} inbound:</strong> {provider.detail}
      </div>

      <AdminDomainForm />

      <div className="grid gap-3">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No domains configured. Add a domain you own to enable public mail.
          </div>
        ) : null}
        {rows.map((domain) => (
          <article key={domain.id} className="rounded-xl border bg-card p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-mono font-semibold">{domain.domain}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {domain.eligibility.replaceAll("_", " ")} · weight {domain.weight}
                </p>
              </div>
              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                  domain.status === "ACTIVE" && domain.mxOk
                    ? "border-success/30 bg-success/10 text-success"
                    : domain.status === "DISABLED"
                      ? "border-border bg-muted text-muted-foreground"
                      : "border-warning/30 bg-warning/10 text-warning"
                }`}
              >
                {domain.status === "ACTIVE" && domain.mxOk
                  ? "MX verified"
                  : domain.mxRequired
                    ? `${domain.status} · MX not ready`
                    : "Development only"}
              </span>
            </div>
            <p className="mt-3 break-words text-xs text-muted-foreground">
              {domain.lastHealthNote || "Not checked yet."}
            </p>
            {domain.mxRequired && domain.status !== "DISABLED" ? (
              <div className="mt-3">
                <AdminDomainVerifyButton id={domain.id} />
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
