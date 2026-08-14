import { SeoLanding } from "@/components/features/seo-landing";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Disposable Email Generator — One-Off Addresses",
  description:
    "Generate a disposable email address for a single signup, download, or trial. The inbox receives mail in real time and deletes itself when the clock runs out.",
  path: "/disposable-email-generator",
});

export default function Page() {
  return (
    <SeoLanding
      path="/disposable-email-generator"
      crumbLabel="Disposable email generator"
      title="Disposable email generator for one-off signups"
      lede="Some addresses are only ever needed once: a download gate, a trial, a receipt, a forum you will not return to. This generator issues an address built to be thrown away."
      steps={[
        { title: "Generate", copy: "An address exists as soon as the page loads. Copy it straight from the card." },
        { title: "Hand it over", copy: "Use it for the single signup or download that demanded an email address." },
        { title: "Collect the one message", copy: "The confirmation or link arrives in the inbox below within seconds." },
        { title: "Walk away", copy: "Do nothing. The address expires on schedule and the message is purged with it." },
      ]}
      body={[
        {
          heading: "One address, one purpose",
          copy: "Reusing a single disposable address across many services rebuilds the exact profile you were trying to avoid. Generating a fresh one per signup keeps those relationships unlinked, which is the whole point of a disposable address.",
        },
        {
          heading: "Designed to be forgotten",
          copy: "There is nothing to clean up afterwards. The mailbox carries an expiry from creation, inbound mail stops at that moment, and a retention job removes bodies and attachments without any action from you.",
        },
        {
          heading: "Safe to open",
          copy: "One-off signups attract low-quality mail, so every message is parsed and sanitized before rendering. Scripts, dangerous URIs, and executable attachments are stripped, and remote images are proxied rather than loaded straight from the sender.",
        },
        {
          heading: "When not to use one",
          copy: "Do not use a disposable address for anything you may need to recover: banking, government services, or an account holding your data. Once the mailbox expires you cannot receive a reset link, and the local part may eventually be reissued.",
        },
      ]}
      faqs={[
        {
          q: "What is the difference between disposable and temporary email?",
          a: "In practice they describe the same thing. 'Disposable' emphasises throwing the address away after one use; 'temporary' emphasises the expiry clock. Haven addresses are both.",
        },
        {
          q: "Can I use one disposable address for several sites?",
          a: "You can, but it undermines the benefit. A fresh address per service keeps those signups from being correlated through a shared address.",
        },
        {
          q: "Does the sender know it is a disposable address?",
          a: "Possibly. Some services maintain block lists of known disposable domains and may refuse the signup. That is their prerogative, and Haven does not attempt to evade such controls.",
        },
      ]}
      related={[
        { href: "/disposable-email", label: "Disposable email", description: "Background on how disposable inboxes work." },
        { href: "/burner-email", label: "Burner email", description: "The same idea under another common name." },
        { href: "/temporary-email-generator", label: "Temporary email generator", description: "Custom names and domain selection." },
      ]}
    />
  );
}
