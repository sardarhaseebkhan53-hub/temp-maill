import { buildMetadata } from "@/lib/seo";
import { FingerprintPanel } from "@/components/features/fingerprint-panel";
import { PageShell } from "@/components/layout/page-shell";
import { AdSlot } from "@/components/ads/ad-slot";
import { resolveAdSlots } from "@/server/services/ads";

export const metadata = buildMetadata({
  title: "Browser Fingerprint & Tracker Check — Haven",
  description: "See a few signals your browser exposes. Educational, not a deanonymization service.",
  path: "/tools/fingerprint",
});

export default async function Page() {
  const ads = await resolveAdSlots(["TOP_LEADERBOARD", "RECTANGLE", "TOOLS"]);

  return (
    <PageShell
      eyebrow="Privacy tool"
      title="What this browser reveals"
      description="A small educational panel. It does not claim to uniquely identify you and it does not store a fingerprint."
      aside={<AdSlot slot="RECTANGLE" resolved={ads.RECTANGLE} />}
    >
      <AdSlot slot="TOP_LEADERBOARD" resolved={ads.TOP_LEADERBOARD} />
      <div className="max-w-2xl min-w-0">
        <FingerprintPanel />
      </div>
      <AdSlot slot="TOOLS" resolved={ads.TOOLS} />
    </PageShell>
  );
}
