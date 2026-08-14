import { SeoLanding } from "@/components/features/seo-landing";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Burner Email Address — Free Throwaway Inbox",
  description:
    "Create a burner email address in seconds. A throwaway inbox that receives mail in real time and disappears on schedule, with no account and no card.",
  path: "/burner-email",
});

export default function Page() {
  return (
    <SeoLanding
      path="/burner-email"
      crumbLabel="Burner email"
      title="Burner email addresses, explained honestly"
      lede="'Burner' borrows from prepaid phones: something cheap you use briefly and discard. The metaphor is useful for the lifecycle, and misleading if you read it as anonymity."
      body={[
        {
          heading: "What burner accurately describes",
          copy: "The lifecycle. A burner address is created for a narrow purpose, used for a short window, and then abandoned. Haven implements exactly that: creation on demand, an expiry timestamp from the start, and automatic purging afterwards.",
        },
        {
          heading: "What burner does not mean",
          copy: "It does not mean untraceable. Mail passes through Haven's servers and through the sender's, both of which keep operational records. A burner address separates a signup from your primary identity — it does not hide you from anyone determined to look.",
        },
        {
          heading: "Burner, throwaway, disposable, temporary",
          copy: "These are four names for the same mechanism, and Haven treats them identically. The differences are in emphasis: burner and throwaway stress discarding it, disposable stresses single use, temporary stresses the clock.",
        },
        {
          heading: "Reasonable uses",
          copy: "Marketplace listings, conference wifi, one-off downloads, trials you do not intend to keep, and testing your own software. Not for evading a ban, harassing someone, or creating accounts at scale.",
        },
      ]}
      faqs={[
        {
          q: "Is a burner email anonymous?",
          a: "No. It separates a signup from your main address, which is worthwhile, but it is not anonymity. Mail transits Haven's infrastructure and the sender's, and both keep records.",
        },
        {
          q: "Is burner email the same as throwaway email?",
          a: "Yes. The terms are interchangeable, and Haven provides the same short-lived, self-deleting inbox for both.",
        },
        {
          q: "Can someone trace a burner address back to me?",
          a: "Haven does not publish who created a mailbox, but it is not a shield against a lawful request. Do not treat a burner address as protection for anything that matters legally.",
        },
        {
          q: "Can I send mail from a burner address?",
          a: "No. Haven is receive-only. That is deliberate: an outbound service would be immediately abused for spam and would put the domains at risk.",
        },
      ]}
      related={[
        { href: "/disposable-email", label: "Disposable email", description: "The same mechanism, different emphasis." },
        { href: "/private-email", label: "Private email", description: "What privacy honestly means here." },
        { href: "/temp-mail", label: "Temp mail", description: "The fast path to an address." },
      ]}
    />
  );
}
