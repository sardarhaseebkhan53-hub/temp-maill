import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { InboxGenerator } from "@/components/features/generator";
import { FeaturesSidebar } from "@/components/features/features-sidebar";
import { AdSlot } from "@/components/ads/ad-slot";
import { RailAds } from "@/components/ads/rail-ads";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { getOrCreateGuestMailbox, listDomainsForViewer } from "@/server/services/guest-mailbox";
import { resolveAdSlots } from "@/server/services/ads";
import {
  breadcrumbSchema,
  faqSchema,
  graph,
  softwareApplicationSchema,
  webPageSchema,
} from "@/lib/seo";

export interface SeoLandingLink {
  href: string;
  label: string;
  description?: string;
}

export async function SeoLanding({
  title,
  lede,
  path,
  crumbLabel,
  body,
  faqs,
  steps,
  related,
}: {
  title: string;
  lede: string;
  path: string;
  /** Short breadcrumb label; falls back to the H1. */
  crumbLabel?: string;
  body: { heading: string; copy: string }[];
  faqs: { q: string; a: string }[];
  /** Optional how-to steps rendered as an ordered list. */
  steps?: { title: string; copy: string }[];
  /** Contextual internal links; every lander should point somewhere useful. */
  related?: SeoLandingLink[];
}) {
  const [mailbox, domains, ads] = await Promise.all([
    getOrCreateGuestMailbox(),
    listDomainsForViewer(),
    resolveAdSlots(["TOP_LEADERBOARD", "RECTANGLE", "CONTENT"]),
  ]);

  const crumbs = [
    { name: "Home", path: "/" },
    { name: crumbLabel ?? title, path },
  ];

  return (
    <>
      <RailAds />
      <div className="relative min-h-screen min-w-0 overflow-x-clip bg-[#06080d] bg-ambient-radial pb-16 text-slate-200">
        <div className="mx-auto w-full max-w-[1480px] min-w-0 px-3 pt-6 sm:px-5">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={graph(
              webPageSchema({ path, name: title, description: lede, breadcrumb: true }),
              breadcrumbSchema(crumbs, path),
              softwareApplicationSchema(),
              faqs.length ? faqSchema(faqs.map((f) => ({ question: f.q, answer: f.a }))) : null,
            )}
          />

          <AdSlot slot="TOP_LEADERBOARD" resolved={ads.TOP_LEADERBOARD} />

          <header className="mt-6 min-w-0">
            <Breadcrumbs crumbs={crumbs} />
            <h1 className="mt-3 max-w-3xl font-display text-[clamp(1.8rem,4vw,3rem)] font-extrabold leading-tight tracking-tight text-white">
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

              {steps?.length ? (
                <section className="min-w-0">
                  <h2 className="mb-3 font-display text-xl font-bold tracking-tight text-white">
                    How to use it
                  </h2>
                  <ol className="grid min-w-0 gap-3 sm:grid-cols-2">
                    {steps.map((step, index) => (
                      <li
                        key={step.title}
                        className="flex min-w-0 items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[#00f5a0]/30 bg-[#00f5a0]/10 font-mono text-[11px] font-bold text-[#00f5a0]">
                          {index + 1}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-bold text-white">{step.title}</span>
                          <span className="mt-1 block text-[11px] leading-relaxed text-slate-400">
                            {step.copy}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>
              ) : null}

              <div className="grid min-w-0 gap-4 md:grid-cols-2">
                {body.map((section) => (
                  <section
                    key={section.heading}
                    className="min-w-0 rounded-2xl border border-white/[0.07] bg-[#0c1017]/90 p-5"
                  >
                    <h2 className="font-display text-base font-bold text-white">
                      {section.heading}
                    </h2>
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

              {related?.length ? (
                <section className="min-w-0">
                  <h2 className="mb-3 font-display text-xl font-bold tracking-tight text-white">
                    Related pages
                  </h2>
                  <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {related.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="group flex min-w-0 flex-col rounded-xl border border-white/[0.07] bg-[#0c1017]/90 p-4 transition-colors hover:border-[#00f5a0]/25"
                      >
                        <span className="flex min-w-0 items-center gap-1.5 text-xs font-bold text-white transition-colors group-hover:text-[#00f5a0]">
                          <span className="truncate">{link.label}</span>
                          <ArrowRight
                            className="size-3 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
                            aria-hidden="true"
                          />
                        </span>
                        {link.description ? (
                          <span className="mt-1 text-[11px] leading-relaxed text-slate-400">
                            {link.description}
                          </span>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="min-w-0 rounded-2xl border border-white/[0.07] bg-[#0c1017]/70 p-5">
                <h2 className="font-display text-base font-bold text-white">What Haven promises</h2>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[
                    "Free to use with no account required",
                    "Mail sanitized before it reaches your browser",
                    "Expiry enforced by the server, not the page",
                    "Delete your inbox at any time",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-slate-300">
                      <Check className="size-3.5 shrink-0 text-[#00f5a0]" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                  Haven reduces the data you leave behind. It does not make you anonymous or
                  untraceable, and mail is not end-to-end encrypted.
                </p>
              </section>
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
