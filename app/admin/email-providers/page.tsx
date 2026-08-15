import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getInboundProvider } from "@/server/providers/email";
import { inboundProviderReadiness } from "@/server/services/email-delivery";

export default async function Page() {
  await requirePermission("admin.providers.write");
  const rows = await prisma.emailProvider.findMany({ orderBy: { name: "asc" } });
  const selected = inboundProviderReadiness();
  const liveHealth = await getInboundProvider().health();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Email providers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Provider selection comes from <code>EMAIL_INBOUND_PROVIDER</code>; secrets remain in the deployment environment.
        </p>
      </div>

      <section
        className={`rounded-xl border p-4 ${
          selected.ready
            ? "border-success/30 bg-success/10"
            : selected.status === "DEVELOPMENT"
              ? "border-warning/30 bg-warning/10"
              : "border-destructive/30 bg-destructive/10"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold capitalize">Selected: {selected.provider}</h2>
          <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
            {selected.status.replaceAll("_", " ")}
          </span>
        </div>
        <p className="mt-2 text-sm">{selected.detail}</p>
        <p className="mt-1 text-xs opacity-75">
          Runtime adapter health: {liveHealth.ok ? "healthy" : "not ready"}
          {liveHealth.detail ? ` · ${liveHealth.detail}` : ""}
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((provider) => {
          const active = provider.key === selected.provider;
          return (
            <article key={provider.id} className="rounded-xl border bg-card p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{provider.name}</h2>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{provider.adapter}</p>
                </div>
                <span
                  className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${
                    active ? "border-success/30 bg-success/10 text-success" : "text-muted-foreground"
                  }`}
                >
                  {active ? "selected" : "inactive"}
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Seed health: {provider.healthStatus}
                {provider.lastError ? ` · ${provider.lastError}` : ""}
              </p>
            </article>
          );
        })}
      </div>

      <section className="rounded-xl border bg-card p-4 text-sm">
        <h2 className="font-semibold">Inbound webhook URLs</h2>
        <ul className="mt-2 space-y-1 font-mono text-xs text-muted-foreground">
          <li>/api/webhooks/mailgun/inbound</li>
          <li>/api/webhooks/postmark/inbound</li>
          <li>/api/v1/inbound/smtp</li>
        </ul>
      </section>
    </div>
  );
}
