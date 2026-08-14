import { buildMetadata } from "@/lib/seo";
import { ContactForm } from "@/components/features/contact-form";
import { PageShell } from "@/components/layout/page-shell";

export const metadata = buildMetadata({
  title: "Contact Haven — Support, Abuse & Security",
  description:
    "Get in touch with the Haven team about product questions, billing, abuse reports, or responsible security disclosure. We reply from a monitored queue.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <PageShell
      path="/contact"
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Contact", path: "/contact" },
      ]}
      eyebrow="Contact"
      title="Talk to us"
      description="Product questions, abuse reports, and security notes. We do not need a life story."
    >
      <div className="max-w-xl min-w-0 rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 p-5 sm:p-6">
        <ContactForm />
      </div>
    </PageShell>
  );
}
