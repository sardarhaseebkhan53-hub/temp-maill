import { SeoLanding } from "@/components/features/seo-landing";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Disposable Email Address Generator",
  description: "Disposable email for one-off signups. Sanitized HTML, attachment allowlists, and automatic deletion.",
  path: "/disposable-email",
});

export default function Page() {
  return (
    <SeoLanding
      path="/disposable-email"
      title="A disposable address you can actually read"
      lede="Disposable email only helps if the message is readable and the leftovers disappear. Haven sanitizes HTML, allowlists attachments, and enforces retention with a background job."
      body={[
        {
          heading: "One-off signups",
          copy: "Use a disposable address when a site demands email for a download, a trial, or a comment form you will not visit again.",
        },
        {
          heading: "Not for recovery",
          copy: "Do not use Haven as the recovery mailbox for banking, government, or anything you must prove later. Those need a durable identity.",
        },
        {
          heading: "Attachments, carefully",
          copy: "PDFs and images can be downloaded. Executables and odd MIME types are blocked. Downloads are forced as attachments with nosniff.",
        },
        {
          heading: "Domains from the database",
          copy: "Operators add or retire domains in admin. Eligibility can be free, premium, or business — no deploy required.",
        },
      ]}
      faqs={[
        { q: "Will the sender know it is disposable?", a: "They see a normal address on a Haven domain. We do not fingerprint you to the sender." },
        { q: "Can I forward mail?", a: "Forwarding to a verified personal inbox is a premium alias feature, not part of the anonymous generator." },
      ]}
    />
  );
}
