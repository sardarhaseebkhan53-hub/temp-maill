import { SmsPanel } from "@/components/features/sms-panel";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "SMS Receiver — Capture Test Texts",
  description: "A temporary SMS inbox for verification-code testing on owned accounts and QA environments.",
  path: "/sms-receiver",
});

export default function Page() {
  return (
    <div className="container py-12">
      <h1 className="font-display text-4xl font-semibold">SMS receiver for tests you own</h1>
      <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
        Capture inbound SMS on a short-lived number. Release it when the test is done. Numbers come from a provider
        adapter — Twilio, Vonage, or a development pool.
      </p>
      <div className="mt-10">
        <SmsPanel />
      </div>
    </div>
  );
}
