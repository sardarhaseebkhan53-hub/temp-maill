import Link from "next/link";
import { InboxGenerator } from "@/components/features/generator";
import { FeaturesSidebar } from "@/components/features/features-sidebar";
import { AdSlot } from "@/components/ads/ad-slot";
import { Hero3DGraphic } from "@/components/brand/hero-3d-graphic";
import { Crystal3DIcon, Crown3DIcon, Vault3DIcon } from "@/components/brand/3d-icons";
import { getOrCreateGuestMailbox, listDomainsForViewer } from "@/server/services/guest-mailbox";
import { publicStats } from "@/server/services/stats";
import { listPublicPlans } from "@/server/services/plans";
import { prisma } from "@/lib/db";
import { buildMetadata, jsonLd, absoluteUrl } from "@/lib/seo";
import { formatMoney } from "@/lib/utils";
import {
  Check,
  ChevronRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

export const metadata = buildMetadata({
  title: "Haven — Your Private Inbox. Instantly.",
  description:
    "Create a temporary email address in seconds. No signup. No spam. HTML is sanitized before you see it, and inboxes auto-delete.",
  path: "/",
});

export default async function HomePage() {
  const [mailbox, domains, stats, plans, faqs] = await Promise.all([
    getOrCreateGuestMailbox(),
    listDomainsForViewer(),
    publicStats(),
    listPublicPlans(),
    prisma.faq.findMany({ where: { published: true, locale: "en" }, orderBy: { sortOrder: "asc" }, take: 4 }),
  ]);

  // Find pricing amounts
  const proPlan = plans.find((p) => p.key === "PRO");
  const proPrice = proPlan?.prices.find((x) => x.currency === "USD" && x.interval === "month");
  const businessPlan = plans.find((p) => p.key === "BUSINESS");
  const businessPrice = businessPlan?.prices.find((x) => x.currency === "USD" && x.interval === "month");

  return (
    <div className="bg-[#06080d] min-h-screen text-slate-200 pb-16 bg-ambient-radial">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "Haven",
              url: absoluteUrl("/"),
            },
            {
              "@type": "WebApplication",
              name: "Haven Temporary Email",
              applicationCategory: "UtilitiesApplication",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            },
            {
              "@type": "FAQPage",
              mainEntity: faqs.map((f) => ({
                "@type": "Question",
                name: f.question,
                acceptedAnswer: { "@type": "Answer", text: f.answer },
              })),
            },
          ],
        })}
      />

      {/* 1. TOP ADVERTISEMENT BANNER (728 × 90 Leaderboard) */}
      <section className="max-w-[1560px] mx-auto px-4 pt-4 pb-2" aria-label="Advertisement">
        <AdSlot placement="top-leaderboard" />
      </section>

      {/* 2. MAIN DASHBOARD GRID CONTAINER (Max width 1560px, dense layout) */}
      <main className="max-w-[1560px] mx-auto px-4 pt-3 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_310px] xl:grid-cols-[1fr_330px] gap-6 items-start">
          
          {/* LEFT / MAIN COLUMN */}
          <div className="space-y-6 min-w-0">
            
            {/* HERO SECTION */}
            <section className="relative rounded-2xl border border-white/[0.08] bg-[#0c1017]/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center">
                {/* Left Hero Text & CTA */}
                <div className="space-y-4 max-w-xl">
                  {/* Eyebrow badge */}
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-950/40 border border-[#00f5a0]/30 px-3.5 py-1 text-xs font-semibold text-[#00f5a0] shadow-[0_0_12px_rgba(0,245,160,0.15)]">
                    <ShieldCheck className="size-3.5 text-[#00f5a0]" />
                    <span>Temporary email, built for privacy</span>
                  </div>

                  {/* Headline */}
                  <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.12]">
                    Your private inbox.
                    <span className="block text-[#00f5a0] glow-text-teal">
                      Instantly.
                    </span>
                  </h1>

                  {/* Subtitle */}
                  <p className="text-sm sm:text-base text-slate-300 max-w-lg leading-relaxed">
                    Create a temporary email address in seconds.
                    <br className="hidden sm:inline" /> No signup. No spam. No tracking.
                  </p>

                  {/* Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <a
                      href="#inbox"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#00f5a0] hover:bg-[#00e092] text-[#06090e] font-bold text-xs sm:text-sm px-5 py-3 shadow-[0_0_25px_rgba(0,245,160,0.35)] transition-all active:scale-95"
                    >
                      <Zap className="size-4 fill-current" />
                      <span>Create Temporary Email</span>
                    </a>

                    <Link
                      href="/tools"
                      className="inline-flex items-center gap-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-semibold text-xs sm:text-sm px-5 py-3 transition-all active:scale-95"
                    >
                      <span>Explore Privacy Tools</span>
                      <ChevronRight className="size-4 text-slate-400" />
                    </Link>
                  </div>

                  {/* 4 Feature Badges */}
                  <div className="flex flex-wrap gap-x-4 gap-y-2 pt-3 text-xs text-slate-300 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-[#00f5a0]" />
                      <span>No signup required</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-[#00f5a0]" />
                      <span>Auto-deletes</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-[#00f5a0]" />
                      <span>HTML sanitized</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-[#00f5a0]" />
                      <span>Privacy focused</span>
                    </div>
                  </div>
                </div>

                {/* Right Hero 3D Futuristic Illustration */}
                <div className="hidden md:flex items-center justify-center">
                  <Hero3DGraphic />
                </div>
              </div>
            </section>

            {/* TEMPORARY EMAIL CARD & MAILBOX & READER COMPONENT */}
            <section id="inbox">
              <InboxGenerator
                initialMailbox={mailbox}
                domains={domains.map((d) => ({ id: d.id, domain: d.domain, eligibility: d.eligibility }))}
              />
            </section>

            {/* HOW IT WORKS & PRICING & BOTTOM ADS */}
            <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr_auto] gap-5 items-stretch">
              
              {/* Left 160 × 600 Wide Skyscraper Ad (Desktop) */}
              <div className="hidden xl:flex justify-start">
                <AdSlot placement="sidebar" />
              </div>

              {/* Center Column: How It Works & Pricing Cards */}
              <div className="space-y-6 min-w-0 flex-1">
                
                {/* HOW IT WORKS SECTION */}
                <section className="rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 backdrop-blur-xl p-5 sm:p-6 shadow-xl">
                  <div className="mb-4">
                    <h2 className="font-display text-lg font-bold text-white tracking-tight">
                      How it works
                    </h2>
                    <p className="text-xs text-slate-400">Private email in 3 simple steps</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center relative">
                    {/* Step 1 */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <div className="size-9 rounded-full bg-[#00f5a0]/15 border border-[#00f5a0]/30 text-[#00f5a0] font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,245,160,0.2)]">
                        01
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-white">Get an address</h3>
                        <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                          We generate a random email address for you.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <div className="size-9 rounded-full bg-[#00f5a0]/15 border border-[#00f5a0]/30 text-[#00f5a0] font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,245,160,0.2)]">
                        02
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-white">Receive emails</h3>
                        <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                          Emails sent to your address appear instantly.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <div className="size-9 rounded-full bg-[#00f5a0]/15 border border-[#00f5a0]/30 text-[#00f5a0] font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,245,160,0.2)]">
                        03
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-white">Read & it&apos;s gone</h3>
                        <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                          Read safely. Everything expires automatically.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* PRICING SECTION */}
                <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* FREE PLAN */}
                  <div className="relative rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 backdrop-blur-xl p-5 shadow-xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-display text-sm font-bold text-white">Free</h3>
                          <div className="font-display text-2xl font-extrabold text-white mt-1">
                            $0 <span className="text-xs font-normal text-slate-400">/forever</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">Basic features for everyone.</p>
                        </div>
                        <Crystal3DIcon className="shrink-0 scale-90" />
                      </div>

                      <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                        <li className="flex items-center gap-2">
                          <Check className="size-3.5 text-[#00f5a0]" />
                          <span>Temporary email</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="size-3.5 text-[#00f5a0]" />
                          <span>Auto expiry</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="size-3.5 text-[#00f5a0]" />
                          <span>Standard domains</span>
                        </li>
                      </ul>
                    </div>

                    <a
                      href="#inbox"
                      className="block w-full text-center rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white font-bold text-xs py-2 mt-4 transition-colors"
                    >
                      Use Free
                    </a>
                  </div>

                  {/* PRO PLAN (MOST POPULAR) */}
                  <div className="relative rounded-2xl border border-purple-500/40 bg-gradient-to-b from-[#130f24] to-[#0d0a1c] p-5 shadow-[0_0_30px_rgba(139,92,246,0.18)] flex flex-col justify-between overflow-hidden">
                    {/* Top Most Popular Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="rounded-full bg-purple-500/25 border border-purple-500/40 text-purple-300 text-[10px] font-bold px-2.5 py-0.5">
                        Most Popular
                      </span>
                    </div>

                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-display text-sm font-bold text-white">Pro</h3>
                          <div className="font-display text-2xl font-extrabold text-white mt-1">
                            {proPrice ? formatMoney(proPrice.amountCents, "USD") : "$3.99"}{" "}
                            <span className="text-xs font-normal text-slate-400">/month</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">More power. More privacy.</p>
                        </div>
                        <Crown3DIcon className="shrink-0 scale-90" />
                      </div>

                      <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                        <li className="flex items-center gap-2">
                          <Check className="size-3.5 text-purple-400" />
                          <span>Custom domains</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="size-3.5 text-purple-400" />
                          <span>Longer retention</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="size-3.5 text-purple-400" />
                          <span>No ads</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="size-3.5 text-purple-400" />
                          <span>Priority support</span>
                        </li>
                      </ul>
                    </div>

                    <Link
                      href="/pricing"
                      className="block w-full text-center rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs py-2 mt-4 transition-all shadow-md active:scale-95"
                    >
                      Upgrade to Pro
                    </Link>
                  </div>

                  {/* BUSINESS PLAN */}
                  <div className="relative rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 backdrop-blur-xl p-5 shadow-xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-display text-sm font-bold text-white">Business</h3>
                          <div className="font-display text-2xl font-extrabold text-white mt-1">
                            {businessPrice ? formatMoney(businessPrice.amountCents, "USD") : "$9.99"}{" "}
                            <span className="text-xs font-normal text-slate-400">/month</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">For teams and professionals.</p>
                        </div>
                        <Vault3DIcon className="shrink-0 scale-90" />
                      </div>

                      <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                        <li className="flex items-center gap-2">
                          <Check className="size-3.5 text-[#00f5a0]" />
                          <span>All Pro features</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="size-3.5 text-[#00f5a0]" />
                          <span>API access</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="size-3.5 text-[#00f5a0]" />
                          <span>Priority support</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="size-3.5 text-[#00f5a0]" />
                          <span>Team management</span>
                        </li>
                      </ul>
                    </div>

                    <Link
                      href="/pricing"
                      className="block w-full text-center rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white font-bold text-xs py-2 mt-4 transition-colors"
                    >
                      Choose Business
                    </Link>
                  </div>
                </section>

                {/* Activity Stats Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="font-mono text-lg font-bold text-white">
                      {Number(stats.mailboxesCreated).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-400">Inboxes created</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="font-mono text-lg font-bold text-white">
                      {Number(stats.messagesReceived).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-400">Messages received</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="font-mono text-lg font-bold text-[#00f5a0]">
                      {Number(stats.activeMailboxes).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-400">Active now</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="font-mono text-lg font-bold text-white">
                      {Number(stats.countriesServed).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-400">Countries served</div>
                  </div>
                </div>

              </div>

              {/* Right 320 × 50 Mobile Leaderboard Ad (Desktop/Tablet) */}
              <div className="hidden lg:flex justify-end">
                <AdSlot placement="mobile-banner" />
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: POWERFUL FEATURES SIDEBAR (Sticky / Full Height) */}
          <div className="hidden lg:block sticky top-20">
            <FeaturesSidebar />
          </div>

        </div>

        {/* Global FAQs */}
        <section className="rounded-2xl border border-white/[0.08] bg-[#0c1017]/80 backdrop-blur-xl p-6 sm:p-8 mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-white tracking-tight">
                Frequently asked questions
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Everything about Haven security & disposable mail</p>
            </div>
            <Link href="/faq" className="text-xs font-semibold text-[#00f5a0] hover:underline">
              View all FAQs →
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {faqs.map((f) => (
              <div key={f.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-1">
                <h3 className="text-sm font-semibold text-white">{f.question}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.answer}</p>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
