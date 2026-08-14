import { SeoLanding } from "@/components/features/seo-landing";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Temporary Email for Testing — QA & Developers",
  description:
    "Use temporary email addresses for QA and automated testing. Create a fresh inbox per test run, assert on delivered mail, and drive it all from the Haven API.",
  path: "/temporary-email-for-testing",
});

export default function Page() {
  return (
    <SeoLanding
      path="/temporary-email-for-testing"
      crumbLabel="For testing"
      title="Temporary email for QA and automated testing"
      lede="Signup flows, password resets, and transactional mail all need a real address to test against. Reusing a personal inbox pollutes it and makes tests order-dependent. A fresh mailbox per run does not."
      steps={[
        { title: "Create an inbox per test", copy: "POST /api/v1/mailboxes returns an address and a token. Do this in setup so each run is isolated." },
        { title: "Drive your flow", copy: "Feed the address into the signup or reset form under test, exactly as a user would." },
        { title: "Poll for the message", copy: "GET /api/v1/messages with the mailbox id and token until the expected subject arrives, with a sensible timeout." },
        { title: "Assert and tear down", copy: "Read the body, extract the link or code, then DELETE the mailbox so nothing leaks between runs." },
      ]}
      body={[
        {
          heading: "Isolation between runs",
          copy: "A shared test inbox turns into a race: two pipelines run at once, both see the other's confirmation email, and both pass for the wrong reason. Creating a mailbox in setup and deleting it in teardown removes the shared state entirely.",
        },
        {
          heading: "Deterministic assertions",
          copy: "Messages are returned as structured JSON with sender, subject, snippet, sanitized HTML, plain text, and attachment metadata. Extract a verification code or reset link from the text body rather than scraping rendered markup.",
        },
        {
          heading: "Webhooks instead of polling",
          copy: "Registered users can subscribe a webhook to message.received and have deliveries pushed to a CI endpoint. Payloads are signed, so a runner can verify the call genuinely came from Haven.",
        },
        {
          heading: "Sandbox domains",
          copy: "Operators can mark a domain as sandbox so test traffic is separable from real usage. Test-mode API keys are prefixed tmp_test_ and are distinguishable from live keys in logs and audit records.",
        },
      ]}
      faqs={[
        {
          q: "Can I use this in CI?",
          a: "Yes. Create an API key, provision a mailbox in setup, poll or receive a webhook, then delete the mailbox in teardown. Keys are rate-limited per key, so keep the polling interval reasonable.",
        },
        {
          q: "How do I extract a verification code?",
          a: "Read the message's plain-text body from the API and apply your own pattern. Working from text rather than sanitized HTML keeps assertions stable when the sender changes their template.",
        },
        {
          q: "Are attachments available to tests?",
          a: "Attachment metadata is listed and allowed types can be downloaded through the API, which is enough to assert that an invoice or export was actually sent.",
        },
        {
          q: "Is there a rate limit?",
          a: "Yes, per API key and per plan. The limits are database-driven; check your plan on the pricing page and read the current values from the usage endpoint.",
        },
      ]}
      related={[
        { href: "/temporary-email-api", label: "Temporary email API", description: "Endpoints, authentication, and payloads." },
        { href: "/developer-api", label: "Developer documentation", description: "Examples in curl, JavaScript, Python, and PHP." },
        { href: "/temporary-email-for-verification", label: "For verification codes", description: "Receiving one-time codes reliably." },
      ]}
    />
  );
}
