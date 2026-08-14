import { SmsPanel } from "@/components/features/sms-panel";
import { buildMetadata } from "@/lib/seo";
import { PageShell } from "@/components/layout/page-shell";
import { AdSlot } from "@/components/ads/ad-slot";
import { resolveAdSlots } from "@/server/services/ads";

export const metadata = buildMetadata({
  title: "SMS Receiver — Capture Test Texts",
  description: "A temporary SMS inbox for verification-code testing on owned accounts and QA environments.",
  path: "/sms-receiver",
});

export default async function Page() {
  const ads = await resolveAdSlots(["TOP_LEADERBOARD", "RECTANGLE", "CONTENT"]);

  return (
    <PageShell
      eyebrow="Temporary SMS"
      title="SMS receiver for tests you own"
      description="Capture inbound SMS on a short-lived number and release it when the test is done. Numbers come from a provider adapter — Twilio, Vonage, or a development pool."
      aside={<AdSlot slot="RECTANGLE" resolved={ads.RECTANGLE} />}
    >
      <AdSlot slot="TOP_LEADERBOARD" resolved={ads.TOP_LEADERBOARD} />
      <SmsPanel />
      <AdSlot slot="CONTENT" resolved={ads.CONTENT} />
    </PageShell>
  );
}
