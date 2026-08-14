import { InboxGenerator } from "@/components/features/generator";
import { FeaturesSidebar } from "@/components/features/features-sidebar";
import { AdSlot } from "@/components/ads/ad-slot";
import { getOrCreateGuestMailbox, listDomainsForViewer } from "@/server/services/guest-mailbox";
import { resolveAdSlots } from "@/server/services/ads";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Inbox — Haven",
  description: "Your current temporary inbox.",
  path: "/inbox",
  noindex: true,
});

export default async function InboxPage() {
  const [mailbox, domains, ads] = await Promise.all([
    getOrCreateGuestMailbox(),
    listDomainsForViewer(),
    resolveAdSlots(["TOP_LEADERBOARD", "RECTANGLE"]),
  ]);

  return (
    <div className="relative min-h-screen min-w-0 overflow-x-clip bg-[#06080d] bg-ambient-radial pb-16 text-slate-200">
      <div className="mx-auto w-full max-w-[1480px] min-w-0 px-3 pt-6 sm:px-5">
        <AdSlot slot="TOP_LEADERBOARD" resolved={ads.TOP_LEADERBOARD} />

        <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-white">Your inbox</h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Messages sent to your temporary address appear here automatically.
        </p>

        <div className="mt-6 grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            <InboxGenerator
              initialMailbox={mailbox}
              domains={domains.map((d) => ({ id: d.id, domain: d.domain, eligibility: d.eligibility }))}
            />
          </div>
          <aside className="min-w-0 space-y-4 xl:sticky xl:top-24">
            <AdSlot slot="RECTANGLE" resolved={ads.RECTANGLE} />
            <FeaturesSidebar />
          </aside>
        </div>
      </div>
    </div>
  );
}
