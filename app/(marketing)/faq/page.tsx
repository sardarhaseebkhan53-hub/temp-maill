import { prisma } from "@/lib/db";
import { buildMetadata, jsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "FAQ — Haven",
  description: "Answers about disposable email, retention, safety, and billing.",
  path: "/faq",
});

export default async function FaqPage() {
  const faqs = await prisma.faq.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" } });
  return (
    <div className="container py-12 max-w-3xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        })}
      />
      <h1 className="font-display text-4xl font-semibold">FAQ</h1>
      <div className="mt-8 space-y-4">
        {faqs.map((f) => (
          <details key={f.id} className="rounded-2xl border bg-card p-5">
            <summary className="font-medium cursor-pointer">{f.question}</summary>
            <p className="text-sm text-muted-foreground mt-2">{f.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
