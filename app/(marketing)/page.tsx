import Link from "next/link";
import { ArrowRight, Check, Clock, Globe, ShieldCheck, Sparkles, Users, Zap } from "lucide-react";
import { InboxGenerator } from "@/components/features/generator";
import { FeaturesSidebar } from "@/components/features/features-sidebar";
import { AdSlot } from "@/components/ads/ad-slot";
import { RailAds } from "@/components/ads/rail-ads";
import { Hero3DGraphic } from "@/components/brand/hero-3d-graphic";
import { Reveal } from "@/components/ui/reveal";
import { getOrCreateGuestMailbox, listDomainsForViewer } from "@/server/services/guest-mailbox";
import { publicStats } from "@/server/services/stats";
import { prisma } from "@/lib/db";
import { resolveAdSlots } from "@/server/services/ads";
import {
  buildMetadata,
  faqSchema,
  graph,
  organizationSchema,
  softwareApplicationSchema,
  websiteSchema,
} from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Temporary Email — Free Disposable Inbox | Haven",
  description:
    "Create a free temporary email address instantly. Receive email in a private disposable inbox with automatic expiry, real-time delivery and no signup required.",
  path: "/",
  imageAlt: "Haven temporary email — a free disposable inbox",
});

const trustBadges = [
  "No signup",
  "Auto expiry",
  "HTML sanitized",
  "Privacy focused",
  "Live delivery",
];

const howItWorks = [
  ["01", "Get an address", "A random temporary address is generated for you on arrival."],
  ["02", "Receive email", "Messages sent to the address appear in the inbox instantly."],
  ["03", "Read & it's gone", "Read safely. Everything expires on its own schedule."],
] as const;

const assurances = [
  { icon: ShieldCheck, title: "Sanitized mail", copy: "Dangerous HTML and trackers are stripped." },
  { icon: Globe, title: "Multiple domains", copy: "Pick from the domains Haven operates." },
  { icon: Clock, title: "Server-side expiry", copy: "Expiry is enforced by the server, not the page." },
  { icon: Users, title: "Built for everyone", copy: "From one-off signups to business teams." },
] as const;

export default async function HomePage() {
  const [mailbox, domains, stats, faqs, ads] = await Promise.all([
    getOrCreateGuestMailbox(),
    listDomainsForViewer(),
    publicStats(),
    prisma.faq.findMany({
      where: { published: true, locale: "en" },
      orderBy: { sortOrder: "asc" },
      take: 4,
    }),
    resolveAdSlots(["TOP_LEADERBOARD", "HERO", "RECTANGLE", "CONTENT", "MOBILE"]),
  ]);

  return (
    <div className="relative min-h-screen min-w-0 overflow-x-clip bg-[#06080d] bg-ambient-radial pb-16 text-slate-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={graph(
          organizationSchema(),
          websiteSchema(),
          softwareApplicationSchema(),
          // Only emitted when the questions are actually rendered below.
          faqs.length
            ? faqSchema(faqs.map((faq) => ({ question: faq.question, answer: faq.answer })))
            : null,
        )}
      />

      <RailAds />

      <div className="mx-auto w-full max-w-[1480px] min-w-0 px-3 pt-3 sm:px-5">
        <AdSlot slot="TOP_LEADERBOARD" resolved={ads.TOP_LEADERBOARD} />
      </div>

      <main className="mx-auto w-full max-w-[1480px] min-w-0 space-y-6 px-3 pt-5 sm:px-5">
        {/* ── Hero + the temporary address, above the fold ─────────────── */}
        <section className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)_300px]">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00f5a0]/25 bg-[#00f5a0]/[0.08] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#00f5a0]">
              <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
              Private temporary email
            </div>

            <h1 className="mt-4 font-display text-[2rem] font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl">
              Your private temporary email inbox,
              <span className="block text-[#00f5a0] glow-text-teal">instantly.</span>
            </h1>

            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
              Create a free disposable email address in seconds. Receive mail in real time, read it
              safely, and let it expire. No signup, no spam, no unnecessary tracking.
            </p>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <a
                href="#inbox"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00f5a0] px-5 py-3 text-sm font-bold text-[#06090e] shadow-[0_0_26px_rgba(0,245,160,0.32)] transition-all hover:bg-[#00e092] active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
              >
                <Zap className="size-4" aria-hidden="true" />
                Generate temporary email
              </a>
              <Link
                href="/tools"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/[0.1] active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
              >
                Explore privacy tools
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <ul className="mt-6 flex flex-wrap gap-2">
              {trustBadges.map((badge) => (
                <li
                  key={badge}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-medium text-slate-300"
                >
                  <Check className="size-3 shrink-0 text-[#00f5a0]" aria-hidden="true" />
                  {badge}
                </li>
              ))}
            </ul>

            <Hero3DGraphic className="mt-8 hidden xl:block" />
          </div>

          {/* The address + inbox: the primary product, never buried. */}
          <div id="inbox" className="min-w-0 scroll-mt-24">
            <InboxGenerator
              initialMailbox={mailbox}
              domains={domains.map((domain) => ({
                id: domain.id,
                domain: domain.domain,
                eligibility: domain.eligibility,
              }))}
            />
          </div>

          <aside className="min-w-0 space-y-4 xl:sticky xl:top-24">
            <AdSlot slot="HERO" resolved={ads.HERO} />
            <FeaturesSidebar />
            <AdSlot slot="RECTANGLE" resolved={ads.RECTANGLE} className="hidden xl:flex" />
          </aside>
        </section>

        <div className="xl:hidden">
          <AdSlot slot="MOBILE" resolved={ads.MOBILE} />
        </div>

        {/* ── How it works ─────────────────────────────────────────────── */}
        <Reveal asChild>
          <section
            id="how-it-works"
            className="scroll-mt-24 rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 p-5 shadow-xl backdrop-blur-xl sm:p-6"
          >
            <div className="mb-4">
              <h2 className="font-display text-lg font-bold tracking-tight text-white">
                How temporary email works
              </h2>
              <p className="text-xs text-slate-400">A private disposable inbox in three steps</p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {howItWorks.map(([step, title, description]) => (
                <div
                  key={step}
                  className="flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.03] p-3 transition-transform hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#00f5a0]/30 bg-[#00f5a0]/15 font-mono text-xs font-bold text-[#00f5a0] shadow-[0_0_10px_rgba(0,245,160,0.2)]">
                    {step}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-white">{title}</h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* ── Assurances + live counters ───────────────────────────────── */}
        <Reveal asChild>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {assurances.map(({ icon: Icon, title, copy }) => (
              <div
                key={title}
                className="flex min-w-0 items-start gap-3 rounded-2xl border border-white/[0.07] bg-[#0c1017]/85 p-4 transition-colors hover:border-[#00f5a0]/25"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#00f5a0]/25 bg-[#00f5a0]/10 text-[#00f5a0]">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-white">{title}</h3>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{copy}</p>
                </div>
              </div>
            ))}
          </section>
        </Reveal>

        <Reveal asChild>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Live Haven statistics">
            {[
              [stats.mailboxesCreated, "Inboxes created"],
              [stats.messagesReceived, "Messages received"],
              [stats.activeMailboxes, "Active inboxes"],
              [stats.activeDomains, "Active domains"],
            ].map(([value, label]) => (
              <div key={String(label)} className="min-w-0 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                <div className="truncate font-mono text-lg font-bold text-white">
                  {Number(value).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400">{String(label)}</div>
              </div>
            ))}
          </section>
        </Reveal>

        <AdSlot slot="CONTENT" resolved={ads.CONTENT} />

        {/* ── Explanatory content for search intent ────────────────────── */}
        <Reveal asChild>
          <section
            id="why-temporary-email"
            className="grid min-w-0 scroll-mt-24 gap-5 rounded-2xl border border-white/[0.08] bg-[#0c1017]/85 p-5 sm:p-7 lg:grid-cols-2"
          >
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold tracking-tight text-white">
                Why use a temporary email?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                A disposable email address absorbs the mail you do not want tied to your real
                identity. It is useful whenever an address is demanded but a relationship is not.
              </p>
              <ul className="mt-4 space-y-2.5">
                {[
                  ["Protect your primary inbox", "Keep signups, receipts, and one-off downloads out of the mailbox you actually read."],
                  ["Avoid unwanted marketing", "When the address expires, the newsletter has nowhere left to arrive."],
                  ["Test software safely", "QA and developers can create a fresh inbox per test run instead of reusing a personal address."],
                  ["Receive verification codes", "Confirm an account you own without handing over a permanent address."],
                ].map(([title, copy]) => (
                  <li key={title} className="flex min-w-0 items-start gap-2.5">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-[#00f5a0]" aria-hidden="true" />
                    <span className="min-w-0 text-xs leading-relaxed text-slate-300">
                      <strong className="font-semibold text-white">{title}.</strong> {copy}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold tracking-tight text-white">
                What a disposable inbox is not
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                We would rather be useful than oversell. A temporary email address reduces the data
                you leave behind — it does not make you anonymous.
              </p>
              <ul className="mt-4 space-y-2.5 text-xs leading-relaxed text-slate-300">
                <li className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  Mail sent to a Haven address passes through Haven&apos;s servers, so it is not
                  end-to-end encrypted and is not suitable for confidential material.
                </li>
                <li className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  Addresses are short-lived by design. Never use one to register something you
                  intend to keep, or to recover an account later.
                </li>
                <li className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  Haven is not for defeating another service&apos;s anti-fraud controls or creating
                  accounts at scale. See our{" "}
                  <Link href="/acceptable-use" className="font-medium text-[#00f5a0] hover:underline">
                    acceptable use policy
                  </Link>
                  .
                </li>
              </ul>
              <p className="mt-4 text-xs text-slate-400">
                Read more in{" "}
                <Link href="/blog" className="font-medium text-[#00f5a0] hover:underline">
                  the Haven blog
                </Link>{" "}
                or compare{" "}
                <Link href="/disposable-email" className="font-medium text-[#00f5a0] hover:underline">
                  disposable email
                </Link>{" "}
                and{" "}
                <Link href="/temporary-inbox" className="font-medium text-[#00f5a0] hover:underline">
                  temporary inbox
                </Link>{" "}
                usage.
              </p>
            </div>
          </section>
        </Reveal>

        {/* ── Feature overview with internal links ─────────────────────── */}
        <Reveal asChild>
          <section id="features" className="min-w-0 scroll-mt-24">
            <h2 className="mb-3 font-display text-lg font-bold tracking-tight text-white">
              Temporary email features
            </h2>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {([
                ["/temporary-email-generator", "Temporary email generator", "Generate a random or custom address on any available Haven domain."],
                ["/temporary-inbox", "Real-time inbox", "Messages stream in over SSE, with a polling fallback if the stream drops."],
                ["/temporary-email-api", "Developer API", "Create inboxes and read mail programmatically with hashed API keys."],
                ["/temporary-phone", "Temporary SMS", "Short-lived phone numbers for verification testing on accounts you own."],
              ] as const).map(([href, title, copy]) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex min-w-0 flex-col rounded-2xl border border-white/[0.07] bg-[#0c1017]/85 p-4 transition-colors hover:border-[#00f5a0]/25"
                >
                  <h3 className="text-xs font-bold text-white transition-colors group-hover:text-[#00f5a0]">
                    {title}
                  </h3>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{copy}</p>
                </Link>
              ))}
            </div>
          </section>
        </Reveal>

        {/* ── Premium ──────────────────────────────────────────────────── */}
        <Reveal asChild>
          <section className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-[#150f2b] via-[#0f0b21] to-[#0b0a18] p-6 shadow-[0_0_40px_rgba(139,92,246,0.16)] sm:p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-purple-600/20 blur-3xl"
            />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 max-w-xl">
                <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-purple-300">
                  <Sparkles className="size-3.5" aria-hidden="true" /> Haven Premium
                </div>
                <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-white">
                  An ad-free Haven, with room to breathe
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Pro and Business remove every advertisement and add custom domains, longer
                  retention, and priority support. The free tier keeps working exactly as it does
                  today.
                </p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {[
                    "Ad-free experience",
                    "Custom domains",
                    "Longer retention",
                    "Priority support",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-slate-200">
                      <Check className="size-3.5 shrink-0 text-purple-300" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row lg:flex-col">
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.99] motion-reduce:transform-none"
                >
                  Compare plans
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/dashboard/billing"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.12]"
                >
                  Manage billing
                </Link>
              </div>
            </div>
          </section>
        </Reveal>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        {faqs.length ? (
          <Reveal asChild>
            <section className="space-y-5 rounded-2xl border border-white/[0.08] bg-[#0c1017]/80 p-5 backdrop-blur-xl sm:p-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold tracking-tight text-white">
                    Frequently asked questions
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Answers about disposable mail and Haven security
                  </p>
                </div>
                <Link href="/faq" className="text-xs font-semibold text-[#00f5a0] hover:underline">
                  View all FAQs →
                </Link>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {faqs.map((faq) => (
                  <details
                    key={faq.id}
                    className="group min-w-0 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors open:border-[#00f5a0]/20"
                  >
                    <summary className="cursor-pointer list-none text-sm font-semibold text-white marker:hidden">
                      {faq.question}
                    </summary>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          </Reveal>
        ) : null}
      </main>
    </div>
  );
}
