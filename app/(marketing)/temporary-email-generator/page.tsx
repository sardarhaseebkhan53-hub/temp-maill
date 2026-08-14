import { SeoLanding } from "@/components/features/seo-landing";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Temporary Email Generator — Random or Custom",
  description:
    "Generate a temporary email address instantly. Pick a random name or choose your own local part and domain, then receive mail in a disposable inbox that expires.",
  path: "/temporary-email-generator",
});

export default function Page() {
  return (
    <SeoLanding
      path="/temporary-email-generator"
      crumbLabel="Temporary email generator"
      title="Temporary email generator"
      lede="Haven generates a working address the moment this page loads. Keep the random name, or set your own local part and pick from the domains your operator runs."
      steps={[
        {
          title: "Take the generated address",
          copy: "An address is created on page load. Copy it with one click — no button to press first, no captcha wall.",
        },
        {
          title: "Or choose your own name",
          copy: "Type a local part and select a domain, then apply. Reserved, offensive, and already-taken names are rejected.",
        },
        {
          title: "Use it wherever mail is required",
          copy: "Paste it into the signup or form. Delivery is streamed to the inbox on this page in real time.",
        },
        {
          title: "Let it expire, or extend it",
          copy: "The countdown reflects server state. Extend up to the configured maximum if a sender is slow.",
        },
      ]}
      body={[
        {
          heading: "Random names are generated server-side",
          copy: "Local parts are assembled from a word list with a numeric suffix, checked for collisions against live mailboxes, and filtered against a reserved list. The browser never picks the name, so two visitors cannot be handed the same address.",
        },
        {
          heading: "Custom names, within limits",
          copy: "Minimum and maximum length are system settings rather than hardcoded values. Names that impersonate system roles — postmaster, admin, abuse, and similar — are refused so a generated address cannot be mistaken for an operator.",
        },
        {
          heading: "Multiple domains",
          copy: "The domain dropdown lists what your operator has actually configured and verified. Domains marked for paid plans appear but are only assignable on those plans, so the list never advertises something you cannot use.",
        },
        {
          heading: "Every address is disposable",
          copy: "A generated inbox carries an expiry timestamp from the moment it exists. When the clock runs out the server stops accepting mail for it, and a later retention job removes the stored bodies and attachments.",
        },
      ]}
      faqs={[
        {
          q: "Can I generate more than one address at a time?",
          a: "Yes, up to the active-mailbox limit for your plan. Generating a new address from the card replaces the one on screen; registered users can keep several inboxes side by side from the dashboard.",
        },
        {
          q: "Are generated addresses reused?",
          a: "A local part can be issued again after the original mailbox has expired and been purged, which is why you should never rely on a temporary address for account recovery.",
        },
        {
          q: "Can I choose the domain?",
          a: "Yes. The selector lists the domains your operator has verified. Some domains may be reserved for paid plans.",
        },
      ]}
      related={[
        {
          href: "/disposable-email-generator",
          label: "Disposable email generator",
          description: "The same generator framed for one-off signups.",
        },
        {
          href: "/temporary-email-without-signup",
          label: "Temporary email without signup",
          description: "Why no account is required to get an address.",
        },
        {
          href: "/temporary-email-api",
          label: "Temporary email API",
          description: "Generate addresses programmatically instead.",
        },
      ]}
    />
  );
}
