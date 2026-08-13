import { SeoLanding } from "@/components/features/seo-landing";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Temporary Email — Instant Disposable Address",
  description:
    "Generate a temporary email address on page load. Receive mail in real time, read it in a sandboxed viewer, and let it expire.",
  path: "/temporary-email",
});

export default function Page() {
  return (
    <SeoLanding
      path="/temporary-email"
      title="Temporary email that exists only as long as you need it"
      lede="Haven creates a working address the moment this page opens. Use it for a confirmation, a receipt, or a signup you do not want attached to your long-term identity."
      body={[
        {
          heading: "Built for a single job",
          copy: "Temporary email is not a secret identity. It is a short-lived mailbox with a published expiry, so merchants and newsletters do not keep a permanent handle on you.",
        },
        {
          heading: "Hostile mail is assumed",
          copy: "Every inbound message is parsed, sanitized, and rendered in a sandboxed frame. Scripts, dangerous URIs, and executable attachments never reach your browser session.",
        },
        {
          heading: "No account gate",
          copy: "The first address is free and immediate. Create an account only if you want saved addresses, aliases, or API keys.",
        },
        {
          heading: "Operator-controlled lifetimes",
          copy: "Default TTL, extensions, and retention are system settings — not hardcoded marketing numbers — so the clock you see matches the server.",
        },
      ]}
      faqs={[
        {
          q: "Is this the same as a permanent alias?",
          a: "No. Aliases are for registered users who want a stable routing address. Temporary email is meant to disappear.",
        },
        {
          q: "Can I pick the name?",
          a: "Yes, within the filter. Reserved and abusive names are rejected.",
        },
      ]}
    />
  );
}
