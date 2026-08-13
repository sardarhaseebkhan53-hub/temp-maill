import Link from "next/link";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Privacy Tools — Haven",
  description: "Temporary email, SMS, breach hints, and a browser fingerprint check.",
  path: "/tools",
});

export default async function ToolsPage() {
  const services = await prisma.service.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="container py-12">
      <h1 className="font-display text-4xl font-semibold">Privacy tools</h1>
      <p className="mt-3 text-muted-foreground max-w-2xl">
        Haven is a platform. Temporary email ships first; the rest register as services rather than one-off plumbing.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <Link
            key={s.id}
            href={s.href || "/"}
            className="rounded-2xl border bg-card p-5 hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{s.name}</h2>
              {!s.enabled ? <span className="text-xs text-muted-foreground">Soon</span> : null}
            </div>
            <p className="text-sm text-muted-foreground mt-2">{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
