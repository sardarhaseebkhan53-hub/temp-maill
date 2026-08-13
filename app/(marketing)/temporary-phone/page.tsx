import { SmsPanel } from "@/components/features/sms-panel";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Temporary Phone Number — SMS Receiver",
  description:
    "Receive SMS for QA and personal privacy on accounts you own. Not for defeating third-party anti-fraud controls.",
  path: "/temporary-phone",
});

export default function Page() {
  return (
    <div className="container py-12">
      <h1 className="font-display text-4xl font-semibold max-w-3xl">Temporary phone numbers</h1>
      <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
        For QA, developer testing, and personal privacy on accounts you own — not for mass fake-account creation or
        defeating someone else’s anti-fraud controls.
      </p>
      <div className="mt-10">
        <SmsPanel />
      </div>
    </div>
  );
}
