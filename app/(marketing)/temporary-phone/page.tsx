import { SmsPanel } from "@/components/features/sms-panel";
import { buildMetadata } from "@/lib/seo";
import { PageShell } from "@/components/layout/page-shell";
import { AdSlot } from "@/components/ads/ad-slot";
import { resolveAdSlots } from "@/server/services/ads";

export const metadata = buildMetadata({
  title: "Temporary Phone Number — SMS Receiver",
  description:
    "Receive SMS for QA and personal privacy on accounts you own. Not for defeating third-party anti-fraud controls.",
  path: "/temporary-phone",
});

export default async function Page() {
  const ads = await resolveAdSlots(["TOP_LEADERBOARD", "RECTANGLE", "CONTENT"]);

  return (
    <PageShell
      eyebrow="Temporary SMS"
      title="Temporary phone numbers"
      description="For QA, developer testing, and personal privacy on accounts you own — not for mass fake-account creation or defeating someone else's anti-fraud controls."
      aside={<AdSlot slot="RECTANGLE" resolved={ads.RECTANGLE} />}
    >
      <AdSlot slot="TOP_LEADERBOARD" resolved={ads.TOP_LEADERBOARD} />
      <SmsPanel />
      <AdSlot slot="CONTENT" resolved={ads.CONTENT} />
    </PageShell>
  );
}
