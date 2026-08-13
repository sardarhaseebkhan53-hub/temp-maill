import { InboxGenerator } from "@/components/features/generator";
import { getOrCreateGuestMailbox, listDomainsForViewer } from "@/server/services/guest-mailbox";
import { jsonLd, absoluteUrl } from "@/lib/seo";

export async function SeoLanding({
  title,
  lede,
  path,
  body,
  faqs,
}: {
  title: string;
  lede: string;
  path: string;
  body: { heading: string; copy: string }[];
  faqs: { q: string; a: string }[];
}) {
  const [mailbox, domains] = await Promise.all([getOrCreateGuestMailbox(), listDomainsForViewer()]);
  return (
    <div className="container py-10 md:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: title, item: absoluteUrl(path) },
          ],
        })}
      />
      <h1 className="font-display text-[clamp(1.8rem,4vw,3rem)] font-semibold tracking-tight max-w-3xl">{title}</h1>
      <p className="mt-4 text-lg text-muted-foreground max-w-2xl">{lede}</p>
      <div className="mt-10">
        <InboxGenerator
          initialMailbox={mailbox}
          domains={domains.map((d) => ({ id: d.id, domain: d.domain, eligibility: d.eligibility }))}
        />
      </div>
      <div className="mt-16 grid gap-8 md:grid-cols-2">
        {body.map((b) => (
          <section key={b.heading}>
            <h2 className="font-display text-xl font-semibold">{b.heading}</h2>
            <p className="mt-2 text-muted-foreground">{b.copy}</p>
          </section>
        ))}
      </div>
      <div className="mt-16">
        <h2 className="font-display text-2xl font-semibold mb-4">FAQ</h2>
        <dl className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-xl border bg-card p-4">
              <dt className="font-medium">{f.q}</dt>
              <dd className="text-sm text-muted-foreground mt-1">{f.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
