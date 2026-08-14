import { SeoLanding } from "@/components/features/seo-landing";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Temporary Inbox Online — Read Mail Safely",
  description:
    "A temporary inbox you can read safely online. Filters, sandboxed message rendering, attachment checks, and a clear path to report abusive mail.",
  path: "/temporary-inbox",
});

export default function Page() {
  return (
    <SeoLanding
      path="/temporary-inbox"
      title="A temporary inbox that behaves like mail, not a toy"
      lede="Search, sort, attachments, print, and report are first-class. The difference is that the whole inbox is scheduled to vanish."
      body={[
        {
          heading: "Read without executing",
          copy: "The viewer is an iframe with a strict CSP and an empty sandbox. There are no scripts and no same-origin access to your Haven session.",
        },
        {
          heading: "Remote images stay off",
          copy: "Tracking pixels do not fire until you choose to load remote images, which then pass through a same-origin proxy.",
        },
        {
          heading: "Triage tools",
          copy: "Filter unread or attachments, search sender and subject, mark unread, delete, or block a sender for this box.",
        },
        {
          heading: "Print the thing you needed",
          copy: "The print stylesheet drops chrome so a receipt or code is all that hits the page.",
        },
      ]}
      faqs={[
        { q: "Can I keep an inbox?", a: "Registered paid plans can use longer TTLs and aliases. Free boxes are meant to expire." },
        { q: "How do I report phishing?", a: "Open the message and choose Report. It lands in the admin abuse queue." },
      ]}
    />
  );
}
