import { buildMetadata } from "@/lib/seo";
import { ContactForm } from "@/components/features/contact-form";

export const metadata = buildMetadata({
  title: "Contact — Haven",
  description: "Contact Haven about product, abuse, or security.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="container py-12 max-w-xl">
      <h1 className="font-display text-3xl font-semibold">Contact</h1>
      <p className="mt-3 text-muted-foreground">
        Product questions, abuse reports, and security notes. We do not need a life story.
      </p>
      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
