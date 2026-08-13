import { SeoLanding } from "@/components/features/seo-landing";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Temporary Email API",
  description: "HTTP API to create disposable mailboxes, list messages, and receive webhooks. Keys are hashed at rest.",
  path: "/temporary-email-api",
});

export default function Page() {
  return (
    <SeoLanding
      path="/temporary-email-api"
      title="Temporary email as an API, not a screenshot"
      lede="QA suites and product teams can create an inbox, wait for a message, and tear it down — with hashed keys, per-key limits, and a sandbox namespace."
      body={[
        {
          heading: "The endpoints",
          copy: "POST and GET /api/v1/mailboxes, messages, attachments, webhooks, and usage. Errors use a stable envelope with a code you can switch on.",
        },
        {
          heading: "Keys you can rotate",
          copy: "Plaintext is shown once. Rotation keeps the old key in a grace window so deploys do not race.",
        },
        {
          heading: "Sandbox is isolated",
          copy: "Test keys never consume production quota or land on public domains.",
        },
        {
          heading: "Webhooks, carefully",
          copy: "Deliveries retry with backoff. Destination URLs are checked to reduce SSRF risk.",
        },
      ]}
      faqs={[
        { q: "Where are the docs?", a: "See /docs in this repository and the /developer-api page for copy-paste examples." },
        { q: "Is there a free API?", a: "API rate limits are plan rows. The free plan seeds with no API quota until you upgrade." },
      ]}
    />
  );
}
