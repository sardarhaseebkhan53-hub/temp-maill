import { buildMetadata } from "@/lib/seo";
import { ContactForm } from "@/components/features/contact-form";
import { PageShell } from "@/components/layout/page-shell";

export const metadata = buildMetadata({
  title: "Contact — Haven",
  description: "Contact Haven about product, abuse, or security.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <PageShell
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
