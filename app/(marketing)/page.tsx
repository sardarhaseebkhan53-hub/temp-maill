import Link from "next/link";
import { InboxGenerator } from "@/components/features/generator";
import { getOrCreateGuestMailbox, listDomainsForViewer } from "@/server/services/guest-mailbox";
import { publicStats } from "@/server/services/stats";
import { listPublicPlans } from "@/server/services/plans";
import { prisma } from "@/lib/db";
import { buildMetadata, jsonLd, absoluteUrl } from "@/lib/seo";
import { formatMoney } from "@/lib/utils";
import { ShieldCheck, Timer, Sparkles } from "lucide-react";

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

  return (
    <>
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
      <section className="container pt-10 pb-8 md:pt-16">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-primary mb-3">Temporary email, built like a product</p>
          <h1 className="font-display text-[clamp(2rem,5vw,3.75rem)] leading-[1.08] font-semibold tracking-tight">
            Your Private Inbox. Instantly.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            Create a temporary email address in seconds. No signup. No spam. No unnecessary tracking.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#inbox" className="inline-flex h-12 items-center rounded-lg bg-primary px-5 text-primary-foreground font-medium">
              Create Temporary Email
            </a>
            <Link href="/tools" className="inline-flex h-12 items-center rounded-lg border px-5 font-medium hover:bg-muted">
              Explore Privacy Tools
            </Link>
          </div>
        </div>
        <ul className="mt-8 flex flex-wrap gap-4 text-sm">
          <li className="inline-flex items-center gap-2 rounded-full bg-card border px-3 py-1.5">
            <Sparkles className="size-4 text-primary" /> No signup required
          </li>
          <li className="inline-flex items-center gap-2 rounded-full bg-card border px-3 py-1.5">
            <Timer className="size-4 text-primary" /> Auto-deletes
          </li>
          <li className="inline-flex items-center gap-2 rounded-full bg-card border px-3 py-1.5">
            <ShieldCheck className="size-4 text-primary" /> HTML sanitized before you see it
          </li>
        </ul>
      </section>

      <section id="inbox" className="container pb-16">
        <InboxGenerator
          initialMailbox={mailbox}
          domains={domains.map((d) => ({ id: d.id, domain: d.domain, eligibility: d.eligibility }))}
        />
      </section>

      <section className="container py-12 grid gap-6 md:grid-cols-3">
        {[
          ["Land on the page", "An address is created for you automatically. Copy it."],
          ["Receive mail", "Messages stream in as they are accepted and sanitized."],
          ["Read and go", "Open what you need. Everything expires on a published schedule."],
        ].map(([t, b], i) => (
          <div key={t} className="rounded-2xl border bg-card p-6">
            <div className="text-xs font-medium text-primary mb-2">Step {i + 1}</div>
            <h2 className="font-display text-xl font-semibold">{t}</h2>
            <p className="text-sm text-muted-foreground mt-2">{b}</p>
          </div>
        ))}
      </section>

      <section className="container py-12">
        <h2 className="font-display text-2xl font-semibold mb-6">Privacy services on one platform</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["/temporary-email", "Temporary email", "Disposable addresses with a real-time inbox."],
            ["/temporary-phone", "Temporary phone", "Receive SMS for testing and personal privacy."],
            ["/developer-api", "Developer API", "Provision inboxes from CI, QA, and your own apps."],
            ["/tools", "Privacy tools", "Breach hints and a browser fingerprint check."],
          ].map(([href, t, b]) => (
            <Link key={href} href={href ?? "/"} className="rounded-2xl border bg-card p-5 hover:border-primary/40 transition-colors">
              <h3 className="font-semibold">{t}</h3>
              <p className="text-sm text-muted-foreground mt-1">{b}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="container py-12">
        <h2 className="font-display text-2xl font-semibold mb-6">In use</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            [stats.mailboxesCreated, "Inboxes created"],
            [stats.messagesReceived, "Messages received"],
            [stats.activeMailboxes, "Active now"],
            [stats.countriesServed, "Countries represented"],
          ].map(([n, l]) => (
            <div key={String(l)} className="rounded-2xl border bg-card p-5">
              <div className="font-display text-3xl tabular">{Number(n).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-12">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-display text-2xl font-semibold">Plans</h2>
          <Link href="/pricing" className="text-sm text-primary hover:underline">
            Full pricing
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {plans.map((p) => {
            const price = p.prices.find((x) => x.currency === "USD" && x.interval === "month");
            return (
              <div key={p.key} className="rounded-2xl border bg-card p-5">
                <p className="text-sm text-muted-foreground">{p.name}</p>
                <p className="font-display text-2xl mt-1">
                  {p.key === "FREE" ? "Free" : price ? formatMoney(price.amountCents, "USD") : "—"}
                </p>
                <p className="text-sm text-muted-foreground mt-2">{p.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container py-12">
        <h2 className="font-display text-2xl font-semibold mb-6">Questions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((f) => (
            <div key={f.id} className="rounded-2xl border bg-card p-5">
              <h3 className="font-medium">{f.question}</h3>
              <p className="text-sm text-muted-foreground mt-2">{f.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
