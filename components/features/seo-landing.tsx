import { InboxGenerator } from "@/components/features/generator";
import { FeaturesSidebar } from "@/components/features/features-sidebar";
import { AdSlot } from "@/components/ads/ad-slot";
import { RailAds } from "@/components/ads/rail-ads";
import { getOrCreateGuestMailbox, listDomainsForViewer } from "@/server/services/guest-mailbox";
import { resolveAdSlots } from "@/server/services/ads";
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
  const [mailbox, domains, ads] = await Promise.all([
    getOrCreateGuestMailbox(),
    listDomainsForViewer(),
    resolveAdSlots(["TOP_LEADERBOARD", "RECTANGLE", "CONTENT"]),
  ]);

  return (
    <>
      <RailAds />
      <div className="relative min-h-screen min-w-0 overflow-x-clip bg-[#06080d] bg-ambient-radial pb-16 text-slate-200">
        <div className="mx-auto w-full max-w-[1480px] min-w-0 px-3 pt-6 sm:px-5">
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

          <AdSlot slot="TOP_LEADERBOARD" resolved={ads.TOP_LEADERBOARD} />

          <header className="mt-6 min-w-0">
            <h1 className="max-w-3xl font-display text-[clamp(1.8rem,4vw,3rem)] font-extrabold leading-tight tracking-tight text-white">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
              {lede}
            </p>
          </header>

          <div className="mt-8 grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0 space-y-8">
              <InboxGenerator
                initialMailbox={mailbox}
                domains={domains.map((d) => ({
                  id: d.id,
                  domain: d.domain,
                  eligibility: d.eligibility,
                }))}
              />

              <div className="grid min-w-0 gap-4 md:grid-cols-2">
                {body.map((section) => (
                  <section
                    key={section.heading}
                    className="min-w-0 rounded-2xl border border-white/[0.07] bg-[#0c1017]/90 p-5"
                  >
                    <h2 className="font-display text-base font-bold text-white">{section.heading}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{section.copy}</p>
                  </section>
                ))}
              </div>

              <AdSlot slot="CONTENT" resolved={ads.CONTENT} />

              {faqs.length ? (
                <section className="min-w-0">
                  <h2 className="mb-3 font-display text-xl font-bold tracking-tight text-white">
                    Frequently asked questions
                  </h2>
                  <dl className="space-y-3">
                    {faqs.map((faq) => (
                      <div
                        key={faq.q}
                        className="min-w-0 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                      >
                        <dt className="text-sm font-semibold text-white">{faq.q}</dt>
                        <dd className="mt-1.5 text-xs leading-relaxed text-slate-400">{faq.a}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ) : null}
            </div>

            <aside className="min-w-0 space-y-4 xl:sticky xl:top-24">
              <AdSlot slot="RECTANGLE" resolved={ads.RECTANGLE} />
              <FeaturesSidebar />
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
