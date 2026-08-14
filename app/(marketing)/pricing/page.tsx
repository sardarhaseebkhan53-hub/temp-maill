import Link from "next/link";
import { Check, ShieldOff } from "lucide-react";
import { listPublicPlans } from "@/server/services/plans";
import { buildMetadata } from "@/lib/seo";
import { PricingGrid } from "@/components/features/pricing-grid";
import { PageShell } from "@/components/layout/page-shell";
import { AdSlot } from "@/components/ads/ad-slot";
import { resolveAdSlots } from "@/server/services/ads";

export const metadata = buildMetadata({
  title: "Pricing — Haven",
  description:
    "Free disposable inboxes, plus Pro, Developer, and Business plans. Prices live in the database.",
  path: "/pricing",
});

export default async function PricingPage() {
  const [plans, ads] = await Promise.all([
    listPublicPlans(),
    resolveAdSlots(["TOP_LEADERBOARD", "CONTENT"]),
  ]);

  return (
    <PageShell
      eyebrow="Pricing"
      title="Stay only as long as you need"
      description="The free inbox is genuinely useful. Paid plans add time, domains, aliases, and API room — and remove every advertisement."
    >
      <AdSlot slot="TOP_LEADERBOARD" resolved={ads.TOP_LEADERBOARD} />

      <PricingGrid plans={plans} />

      <section className="min-w-0 rounded-2xl border border-purple-500/25 bg-gradient-to-br from-[#150f2b] to-[#0b0a18] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300">
            <ShieldOff className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white">Ad-free on every paid plan</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              Pro and Business remove all advertising across the site, including the homepage,
              blog, and tools. The free tier keeps working exactly as it does today.
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-3">
              {["No ads anywhere", "Longer retention", "Custom domains"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs text-slate-200">
                  <Check className="size-3.5 shrink-0 text-purple-300" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <AdSlot slot="CONTENT" resolved={ads.CONTENT} />

      <section className="min-w-0 rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold text-white">Paying without a card?</h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-400">
          Haven supports operator-configured manual methods such as JazzCash, Easypaisa, and bank
          transfer. Submit your transaction reference and your plan activates once it is verified.
        </p>
        <Link
          href="/dashboard/billing/manual"
          className="mt-3 inline-flex items-center rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/[0.12]"
        >
          See manual payment options
        </Link>
      </section>
    </PageShell>
  );
}
