import { prisma } from "@/lib/db";
import { buildMetadata, jsonLd } from "@/lib/seo";
import { PageShell } from "@/components/layout/page-shell";
import { AdSlot } from "@/components/ads/ad-slot";
import { resolveAdSlots } from "@/server/services/ads";

export const metadata = buildMetadata({
  title: "Temporary Email FAQ — Common Questions Answered",
  description:
    "How temporary email works, how long a disposable address lasts, whether you can receive verification codes, what happens at expiry, and how Haven handles privacy.",
  path: "/faq",
});

export default async function FaqPage() {
  const [faqs, ads] = await Promise.all([
    prisma.faq.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" } }),
    resolveAdSlots(["TOP_LEADERBOARD", "CONTENT"]),
  ]);

  return (
    <PageShell
      path="/faq"
      crumbs={[
        { name: "Home", path: "/" },
        { name: "FAQ", path: "/faq" },
      ]}
      eyebrow="Support"
      title="Frequently asked questions"
      description="Answers about disposable email, retention, safety, and billing."
    >
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

      <AdSlot slot="TOP_LEADERBOARD" resolved={ads.TOP_LEADERBOARD} />

      <div className="max-w-3xl space-y-3">
        {faqs.map((f) => (
          <details
            key={f.id}
            className="group min-w-0 rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 p-5 transition-colors open:border-[#00f5a0]/25"
          >
            <summary className="cursor-pointer list-none text-sm font-semibold text-white marker:hidden">
              {f.question}
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.answer}</p>
          </details>
        ))}
        {faqs.length === 0 ? (
          <p className="rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 p-5 text-sm text-slate-400">
            No questions have been published yet.
          </p>
        ) : null}
      </div>

      <div className="max-w-3xl">
        <AdSlot slot="CONTENT" resolved={ads.CONTENT} />
      </div>
    </PageShell>
  );
}
