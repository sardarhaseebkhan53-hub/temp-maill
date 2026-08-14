import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { PageShell } from "@/components/layout/page-shell";
import { AdSlot } from "@/components/ads/ad-slot";
import { RailAds } from "@/components/ads/rail-ads";
import { resolveAdSlots } from "@/server/services/ads";

export const metadata = buildMetadata({
  title: "Online Privacy Tools — Temporary Email, SMS & More",
  description:
    "Free online privacy tools from Haven: temporary email, disposable inboxes, temporary SMS, a breach hint checker, and a browser fingerprint report.",
  path: "/tools",
});

export default async function ToolsPage() {
  const [services, ads] = await Promise.all([
    prisma.service.findMany({ orderBy: { sortOrder: "asc" } }),
    resolveAdSlots(["TOP_LEADERBOARD", "TOOLS", "RECTANGLE"]),
  ]);

  const available = services.filter((service) => service.enabled);
  const planned = services.filter((service) => !service.enabled);

  return (
    <>
      <RailAds />
      <PageShell
      path="/tools"
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Privacy tools", path: "/tools" },
      ]}
        eyebrow="Privacy tools"
        title="Tools that respect your inbox"
        description="Haven is a platform. Temporary email ships first; every other tool registers as a service rather than one-off plumbing."
        aside={
          <>
            <AdSlot slot="RECTANGLE" resolved={ads.RECTANGLE} />
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 p-4">
              <h2 className="text-sm font-bold text-white">Start with email</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                The temporary inbox needs no account and is ready the moment the homepage loads.
              </p>
              <Link
                href="/#inbox"
                className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[#00f5a0] px-4 py-2.5 text-xs font-bold text-[#06090e] transition-colors hover:bg-[#00e092]"
              >
                Open a temporary inbox
              </Link>
            </div>
          </>
        }
      >
        <AdSlot slot="TOP_LEADERBOARD" resolved={ads.TOP_LEADERBOARD} />

        <section aria-labelledby="available-tools" className="min-w-0">
          <h2 id="available-tools" className="mb-3 font-display text-lg font-bold text-white">
            Available now
          </h2>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {available.map((service) => (
              <ToolCard
                key={service.id}
                href={service.href || "/"}
                name={service.name}
                description={service.description ?? ""}
              />
            ))}
          </div>
        </section>

        {/* The tools stay the focus; the ad sits between sections, never inside one. */}
        <AdSlot slot="TOOLS" resolved={ads.TOOLS} />

        {planned.length ? (
          <section aria-labelledby="planned-tools" className="min-w-0">
            <h2 id="planned-tools" className="mb-3 font-display text-lg font-bold text-white">
              On the roadmap
            </h2>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {planned.map((service) => (
                <div
                  key={service.id}
                  className="min-w-0 rounded-2xl border border-white/[0.06] bg-[#0c1017]/60 p-5 opacity-70"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-white">{service.name}</h3>
                    <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                      Soon
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">{service.description}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </PageShell>
    </>
  );
}

function ToolCard({
  href,
  name,
  description,
}: {
  href: string;
  name: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-w-0 flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 p-5 shadow-lg transition-all hover:-translate-y-0.5 hover:border-[#00f5a0]/30 hover:shadow-[0_0_28px_rgba(0,245,160,0.1)] motion-reduce:transform-none motion-reduce:transition-none"
    >
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-white transition-colors group-hover:text-[#00f5a0]">
          {name}
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">{description}</p>
      </div>
      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#00f5a0]">
        Open tool
        <ArrowRight
          className="size-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}
