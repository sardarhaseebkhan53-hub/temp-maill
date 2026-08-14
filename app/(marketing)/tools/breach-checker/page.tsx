import { buildMetadata } from "@/lib/seo";
import { BreachForm } from "@/components/features/breach-form";
import { PageShell } from "@/components/layout/page-shell";
import { AdSlot } from "@/components/ads/ad-slot";
import { resolveAdSlots } from "@/server/services/ads";

export const metadata = buildMetadata({
  title: "Password & Username Breach Hint Checker — Haven",
  description:
    "Check a username or password against a local sample of weak, common, and known-bad patterns. Nothing is sent to a third party, and this is not a full breach corpus.",
  path: "/tools/breach-checker",
});

export default async function Page() {
  const ads = await resolveAdSlots(["TOP_LEADERBOARD", "RECTANGLE", "TOOLS"]);

  return (
    <PageShell
      path="/tools/breach-checker"
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Privacy tools", path: "/tools" },
        { name: "Breach checker", path: "/tools/breach-checker" },
      ]}
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
