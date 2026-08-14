import { buildMetadata } from "@/lib/seo";
import { BreachForm } from "@/components/features/breach-form";
import { PageShell } from "@/components/layout/page-shell";
import { AdSlot } from "@/components/ads/ad-slot";
import { resolveAdSlots } from "@/server/services/ads";

export const metadata = buildMetadata({
  title: "Username Breach Checker — Haven",
  description: "Educational check against a local sample of known-bad patterns. Not a full breach corpus.",
  path: "/tools/breach-checker",
});

export default async function Page() {
  const ads = await resolveAdSlots(["TOP_LEADERBOARD", "RECTANGLE", "TOOLS"]);

  return (
    <PageShell
      eyebrow="Privacy tool"
      title="Username / password breach hint"
      description="This tool never sends your password to a third party. It checks locally against a small educational wordlist and common patterns, and is not a substitute for a dedicated breach service."
      aside={<AdSlot slot="RECTANGLE" resolved={ads.RECTANGLE} />}
    >
      <AdSlot slot="TOP_LEADERBOARD" resolved={ads.TOP_LEADERBOARD} />
      <div className="max-w-xl min-w-0">
        <BreachForm />
      </div>
      <AdSlot slot="TOOLS" resolved={ads.TOOLS} />
    </PageShell>
  );
}
