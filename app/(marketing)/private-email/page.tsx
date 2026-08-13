import { SeoLanding } from "@/components/features/seo-landing";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Private Email — Minimize What You Leave Behind",
  description: "Private, short-lived email with honest limits. We minimize retention; we do not claim anonymity.",
  path: "/private-email",
});

export default function Page() {
  return (
    <SeoLanding
      path="/private-email"
      title="Private email, with accurate claims"
      lede="Privacy here means a short memory: no signup for the basics, sanitized rendering, and deletion on a schedule. It does not mean you are invisible."
      body={[
        {
          heading: "Minimum viable data",
          copy: "We keep what we need to deliver mail and stop abuse. Message bodies are purged after the retention window. Account deletion is available to registered users.",
        },
        {
          heading: "No theatrical anonymity",
          copy: "Your IP may be logged briefly for rate limits. We will not market Haven as untraceable.",
        },
        {
          heading: "Accounts are optional power",
          copy: "Sign in to save addresses, create aliases, hold API keys, and manage sessions. The core inbox never requires it.",
        },
        {
          heading: "Legal pages are product",
          copy: "Privacy, terms, cookies, acceptable use, and abuse policies are real pages — not footer decoration.",
        },
      ]}
      faqs={[
        { q: "Do you read my mail?", a: "Operators can inspect metadata for abuse. Content is not a marketing dataset." },
        { q: "Can I export my account?", a: "Yes, from settings once you are registered." },
      ]}
    />
  );
}
