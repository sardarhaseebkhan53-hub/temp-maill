import Link from "next/link";
import { Check, ShieldCheck, Sparkles } from "lucide-react";
import { InboxGenerator } from "@/components/features/generator";
import { FeaturesSidebar } from "@/components/features/features-sidebar";
import { AdSlot } from "@/components/ads/ad-slot";
import { Crystal3DIcon, Crown3DIcon, Vault3DIcon } from "@/components/brand/3d-icons";
import { getOrCreateGuestMailbox, listDomainsForViewer } from "@/server/services/guest-mailbox";
import { publicStats } from "@/server/services/stats";
import { listPublicPlans } from "@/server/services/plans";
import { prisma } from "@/lib/db";
import { buildMetadata, jsonLd, absoluteUrl } from "@/lib/seo";
import { formatMoney } from "@/lib/utils";

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
    prisma.faq.findMany({
      where: { published: true, locale: "en" },
      orderBy: { sortOrder: "asc" },
      take: 4,
    }),
  ]);

  const proPlan = plans.find((plan) => plan.key === "PRO");
  const proPrice = proPlan?.prices.find((price) => price.currency === "USD" && price.interval === "month");
  const businessPlan = plans.find((plan) => plan.key === "BUSINESS");
  const businessPrice = businessPlan?.prices.find(
    (price) => price.currency === "USD" && price.interval === "month",
  );

  return (
    <div className="min-h-screen min-w-0 bg-[#06080d] bg-ambient-radial pb-16 text-slate-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd({
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "Organization", name: "Haven", url: absoluteUrl("/") },
            {
              "@type": "WebApplication",
              name: "Haven Temporary Email",
              applicationCategory: "UtilitiesApplication",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            },
            {
              "@type": "FAQPage",
              mainEntity: faqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: { "@type": "Answer", text: faq.answer },
              })),
            },
          ],
        })}
      />

      <section className="mx-auto w-full max-w-[1480px] px-3 pb-1 pt-2 sm:px-5 sm:pt-3" aria-label="Advertisement">
        <AdSlot placement="top-leaderboard" />
      </section>

      <main className="mx-auto w-full max-w-[1480px] min-w-0 space-y-6 px-3 pt-3 sm:px-5">
        <div className="grid min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_290px] xl:grid-cols-[minmax(0,1fr)_310px]">
          <div className="min-w-0 space-y-5">
            <section className="flex min-w-0 flex-col gap-3 rounded-2xl border border-white/[0.08] bg-[#0c1017]/85 p-3 shadow-xl backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <div className="min-w-0">
                <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#00f5a0]">
                  <ShieldCheck className="size-3.5 shrink-0" />
                  Temporary email, ready now
                </div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-white">
                  Your private inbox. <span className="text-[#00f5a0] glow-text-teal">Instantly.</span>
                </h1>
                <p className="mt-1 text-xs leading-relaxed text-slate-400 sm:text-sm">
                  Copy the address below and use it anywhere you need a short-lived inbox.
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2 text-[11px] font-medium text-slate-300 sm:max-w-[245px] sm:justify-end">
                {[
                  "No signup",
                  "Live delivery",
                  "Sanitized mail",
                ].map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5"
                  >
                    <Check className="size-3 text-[#00f5a0]" />
                    {label}
                  </span>
                ))}
              </div>
            </section>

            <section id="inbox" className="min-w-0 scroll-mt-24">
              <InboxGenerator
                initialMailbox={mailbox}
                domains={domains.map((domain) => ({
                  id: domain.id,
                  domain: domain.domain,
                  eligibility: domain.eligibility,
                }))}
              />
            </section>

            <div className="lg:hidden">
              <FeaturesSidebar />
            </div>

            <section className="rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 p-5 shadow-xl backdrop-blur-xl sm:p-6">
              <div className="mb-4">
                <h2 className="font-display text-lg font-bold tracking-tight text-white">How it works</h2>
                <p className="text-xs text-slate-400">Private email in three simple steps</p>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {[
                  ["01", "Copy your address", "Your temporary inbox is created automatically."],
                  ["02", "Use it", "Give the address to the service sending your email."],
                  ["03", "Receive safely", "Real messages appear after they are processed and sanitized."],
                ].map(([step, title, description]) => (
                  <div
                    key={step}
                    className="flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.03] p-3"
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

            <section aria-labelledby="pricing-heading">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
                    <Sparkles className="size-3.5" /> Plans
                  </div>
                  <h2 id="pricing-heading" className="mt-1 font-display text-lg font-bold text-white">
                    Keep only what you need
                  </h2>
                </div>
                <Link href="/pricing" className="text-xs font-semibold text-[#00f5a0] hover:underline">
                  Compare plans →
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <PlanCard
                  name="Free"
                  price="$0"
                  suffix="forever"
                  description="A working temporary inbox for quick tasks."
                  features={["Temporary email", "Automatic expiry", "Standard domains"]}
                  icon={<Crystal3DIcon className="shrink-0 scale-90" />}
                  action={<a href="#inbox">Use free</a>}
                />
                <PlanCard
                  name="Pro"
                  price={proPrice ? formatMoney(proPrice.amountCents, "USD") : "See pricing"}
                  suffix={proPrice ? "month" : undefined}
                  description="More time, domains, and privacy controls."
                  features={["Custom domains", "Longer retention", "No ads", "Priority support"]}
                  icon={<Crown3DIcon className="shrink-0 scale-90" />}
                  featured
                  action={<Link href="/pricing">Upgrade to Pro</Link>}
                />
                <PlanCard
                  name="Business"
                  price={businessPrice ? formatMoney(businessPrice.amountCents, "USD") : "See pricing"}
                  suffix={businessPrice ? "month" : undefined}
                  description="API access and controls for teams."
                  features={["All Pro features", "API access", "Priority support", "Team management"]}
                  icon={<Vault3DIcon className="shrink-0 scale-90" />}
                  action={<Link href="/pricing">Choose Business</Link>}
                />
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Live Haven statistics">
              {[
                [stats.mailboxesCreated, "Inboxes created"],
                [stats.messagesReceived, "Messages received"],
                [stats.activeMailboxes, "Active inboxes"],
                [stats.activeDomains, "Active domains"],
              ].map(([value, label]) => (
                <div key={label} className="min-w-0 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                  <div className="truncate font-mono text-lg font-bold text-white">
                    {Number(value).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400">{label}</div>
                </div>
              ))}
            </section>

            <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[160px_minmax(0,1fr)]" aria-label="Advertisement">
              <div className="hidden xl:block">
                <AdSlot placement="sidebar" />
              </div>
              <div className="flex min-w-0 items-start justify-center xl:justify-end">
                <AdSlot placement="mobile-banner" />
              </div>
            </section>
          </div>

          <aside className="sticky top-20 hidden min-w-0 space-y-4 lg:block">
            <FeaturesSidebar />
            <div className="flex justify-center">
              <AdSlot placement="hero-rectangle" />
            </div>
          </aside>
        </div>

        <section className="space-y-6 rounded-2xl border border-white/[0.08] bg-[#0c1017]/80 p-5 backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight text-white">Frequently asked questions</h2>
              <p className="mt-0.5 text-xs text-slate-400">Answers about disposable mail and Haven security</p>
            </div>
            <Link href="/faq" className="text-xs font-semibold text-[#00f5a0] hover:underline">
              View all FAQs →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <article key={faq.id} className="min-w-0 space-y-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <h3 className="text-sm font-semibold text-white">{faq.question}</h3>
                <p className="text-xs leading-relaxed text-slate-400">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function PlanCard({
  name,
  price,
  suffix,
  description,
  features,
  icon,
  featured = false,
  action,
}: {
  name: string;
  price: string;
  suffix?: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  featured?: boolean;
  action: React.ReactNode;
}) {
  return (
    <article
      className={`relative flex min-w-0 flex-col justify-between rounded-2xl border p-5 shadow-xl ${
        featured
          ? "border-purple-500/40 bg-gradient-to-b from-[#130f24] to-[#0d0a1c] shadow-[0_0_30px_rgba(139,92,246,0.18)]"
          : "border-white/[0.08] bg-[#0c1017]/95"
      }`}
    >
      <div>
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display text-sm font-bold text-white">{name}</h3>
            <div className="mt-1 break-words font-display text-2xl font-extrabold text-white">
              {price}{" "}
              {suffix ? <span className="text-xs font-normal text-slate-400">/ {suffix}</span> : null}
            </div>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{description}</p>
          </div>
          {icon}
        </div>
        <ul className="mt-4 space-y-1.5 text-xs text-slate-300">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <Check className={`size-3.5 shrink-0 ${featured ? "text-purple-400" : "text-[#00f5a0]"}`} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      <div
        className={`mt-5 [&>a]:block [&>a]:w-full [&>a]:rounded-xl [&>a]:py-2.5 [&>a]:text-center [&>a]:text-xs [&>a]:font-bold [&>a]:transition-colors ${
          featured
            ? "[&>a]:bg-gradient-to-r [&>a]:from-purple-600 [&>a]:to-indigo-600 [&>a]:text-white"
            : "[&>a]:bg-white/[0.08] [&>a]:text-white hover:[&>a]:bg-white/[0.14]"
        }`}
      >
        {action}
      </div>
    </article>
  );
}
