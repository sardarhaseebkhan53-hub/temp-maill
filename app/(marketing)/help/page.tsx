import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { PageShell } from "@/components/layout/page-shell";

export const metadata = buildMetadata({
  title: "Help Center — Haven Temporary Email",
  description:
    "Guides for getting started with Haven: using a disposable inbox, managing an account, calling the developer API, and reporting abuse.",
  path: "/help",
});

const topics: [string, string, string][] = [
  ["/faq", "FAQ", "Answers about retention, safety, and billing."],
  ["/temporary-email", "Using a temporary inbox", "How addresses are created and when they expire."],
  ["/developer-api", "API quickstart", "Authenticate with hashed keys and read messages."],
  ["/contact", "Open a ticket", "Product questions and account help."],
  ["/abuse", "Report abuse", "Tell us about a message or address being misused."],
];

export default function HelpPage() {
  return (
    <PageShell
      path="/help"
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Help center", path: "/help" },
      ]}
      eyebrow="Help center"
      title="Get started with Haven"
      description="Short guides for the inbox, accounts, and the developer API."
    >
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {topics.map(([href, title, copy]) => (
          <Link
            key={href}
            href={href}
            className="group flex min-w-0 flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 p-5 transition-all hover:-translate-y-0.5 hover:border-[#00f5a0]/30 motion-reduce:transform-none motion-reduce:transition-none"
          >
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white transition-colors group-hover:text-[#00f5a0]">
                {title}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{copy}</p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#00f5a0]">
              Open
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
