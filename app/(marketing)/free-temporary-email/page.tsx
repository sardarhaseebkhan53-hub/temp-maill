import { SeoLanding } from "@/components/features/seo-landing";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Free Temporary Email — No Cost, No Signup",
  description:
    "A genuinely free temporary email address with no account, no trial, and no card. Receive mail in a disposable inbox and see exactly what the free tier includes.",
  path: "/free-temporary-email",
});

export default function Page() {
  return (
    <SeoLanding
      path="/free-temporary-email"
      crumbLabel="Free temporary email"
      title="Free temporary email, and what free actually means"
      lede="The free tier is not a trial. It issues a working disposable address with real-time delivery and no card. This page sets out exactly where the free tier ends, so nothing is a surprise."
      body={[
        {
          heading: "What the free tier includes",
          copy: "A temporary address on a standard domain, live delivery over a streamed connection, sanitized message rendering, attachment listing, copy and QR sharing, and the ability to extend or delete the inbox. No account is required for any of it.",
        },
        {
          heading: "Where the free tier ends",
          copy: "Free inboxes use the default lifetime and shorter retention, draw from standard rather than premium domains, and display advertising. Aliases, custom domains, and API keys belong to paid plans.",
        },
        {
          heading: "Advertising pays for it",
          copy: "Free access is funded by clearly labelled advertising. Ads never sit over controls and never masquerade as messages. Every paid plan removes them entirely — that is the honest trade.",
        },
        {
          heading: "No dark patterns",
          copy: "There is no countdown pressuring you to upgrade, no artificial delay before the address appears, and no captcha gate on the free path. If a limit applies, the interface says so rather than silently failing.",
        },
      ]}
      faqs={[
        {
          q: "Is a free temporary email really free?",
          a: "Yes. No card, no trial period, and no account. The free tier is funded by advertising rather than by converting you.",
        },
        {
          q: "Will you ask for payment later?",
          a: "Not for the free tier. Paid plans exist for longer retention, custom domains, aliases, API access, and an ad-free experience, but the free inbox keeps working regardless.",
        },
        {
          q: "How long does a free address last?",
          a: "It uses the operator's default lifetime, seeded at ten minutes, and can be extended up to a configured maximum. The countdown on the card is the server's value, not a guess.",
        },
        {
          q: "Can I remove the ads?",
          a: "Yes, on any paid plan. Ad-free is a plan feature, resolved on the server from your subscription.",
        },
      ]}
      related={[
        {
          href: "/pricing",
          label: "Compare plans",
          description: "See exactly what each paid tier adds.",
        },
        {
          href: "/temporary-email-without-signup",
          label: "No signup required",
          description: "Why the inbox works before you have an account.",
        },
        {
          href: "/10-minute-mail",
          label: "10 minute mail",
          description: "The short-lifetime default explained.",
        },
      ]}
    />
  );
}
