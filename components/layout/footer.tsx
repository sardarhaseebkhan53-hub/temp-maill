import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { HavenWordmark } from "@/components/brand/logo";

const columns: { title: string; links: [string, string][] }[] = [
  {
    title: "Product",
    links: [
      ["/temporary-email", "Temporary email"],
      ["/temporary-email-generator", "Email generator"],
      ["/temporary-inbox", "Temporary inbox"],
      ["/10-minute-mail", "10 minute mail"],
      ["/temporary-phone", "Temporary SMS"],
      ["/pricing", "Pricing"],
    ],
  },
  {
    title: "Privacy",
    links: [
      ["/private-email", "Private email"],
      ["/disposable-email", "Disposable email"],
      ["/burner-email", "Burner email"],
      ["/free-temporary-email", "Free temporary email"],
      ["/temporary-email-without-signup", "No signup required"],
      ["/privacy", "Privacy policy"],
    ],
  },
  {
    title: "Tools",
    links: [
      ["/tools", "All privacy tools"],
      ["/tools/breach-checker", "Breach checker"],
      ["/tools/fingerprint", "Browser fingerprint"],
      ["/temp-mail", "Temp mail"],
      ["/sms-receiver", "Receive SMS online"],
    ],
  },
  {
    title: "Resources",
    links: [
      ["/blog", "Blog"],
      ["/faq", "FAQ"],
      ["/help", "Help & docs"],
      ["/developer-api", "Developer API"],
      ["/temporary-email-api", "Email API"],
      ["/temporary-email-for-testing", "Email for testing"],
      ["/temporary-email-for-verification", "Verification codes"],
    ],
  },
  {
    title: "Company",
    links: [
      ["/contact", "Contact"],
      ["/status", "System status"],
      ["/abuse", "Report abuse"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["/terms", "Terms of service"],
      ["/privacy", "Privacy policy"],
      ["/cookies", "Cookie policy"],
      ["/acceptable-use", "Acceptable use"],
      ["/abuse", "Abuse policy"],
      ["/security", "Security"],
    ],
  },
];

function BrandBlock() {
  return (
    <div className="min-w-0">
      <HavenWordmark />
      <p className="mt-3 max-w-xs text-xs leading-relaxed text-slate-400">
        Privacy-first temporary email and ephemeral identity services. A shorter memory for the
        mail you do not need to keep.
      </p>
      <p className="mt-3 max-w-xs text-[11px] leading-relaxed text-slate-600">
        Haven reduces the data you leave behind. We do not claim it makes you anonymous or
        untraceable.
      </p>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="no-print mt-16 border-t border-white/[0.08] bg-[#05070c] text-slate-400">
      <div className="mx-auto w-full max-w-[1560px] min-w-0 px-4 py-10 sm:px-6 sm:py-12">
        {/* Mobile: collapsible accordion sections keep the footer compact
            instead of an endless two-column wall of links. */}
        <div className="min-w-0 sm:hidden">
          <BrandBlock />
          <div className="mt-6 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] bg-white/[0.02]">
            {columns.map((column) => (
              <details key={column.title} className="group min-w-0">
                <summary
                  className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white marker:hidden [&::-webkit-details-marker]:hidden"
                  aria-label={`${column.title} links`}
                >
                  {column.title}
                  <ChevronDown
                    className="size-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </summary>
                <ul className="space-y-1 px-4 pb-3">
                  {column.links.map(([href, label]) => (
                    <li key={`${column.title}-${href}`} className="min-w-0">
                      <Link
                        href={href}
                        className="flex min-h-10 items-center truncate rounded-lg px-2 text-xs transition-colors hover:bg-white/[0.04] hover:text-[#00f5a0]"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </div>

        {/* Tablet and desktop: the full multi-column sitemap footer. */}
        <div className="hidden min-w-0 gap-8 sm:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,3fr)]">
          <BrandBlock />

          <div className="grid min-w-0 grid-cols-2 gap-6 sm:grid-cols-3 xl:grid-cols-6">
            {columns.map((column) => (
              <nav key={column.title} aria-label={column.title} className="min-w-0">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-white">
                  {column.title}
                </p>
                <ul className="space-y-2 text-xs">
                  {column.links.map(([href, label]) => (
                    <li key={`${column.title}-${href}`} className="min-w-0">
                      <Link
                        href={href}
                        className="block truncate transition-colors hover:text-[#00f5a0]"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1560px] min-w-0 flex-col items-center justify-between gap-2 border-t border-white/[0.05] px-4 pb-8 pt-4 text-[11px] text-slate-500 sm:flex-row sm:px-6">
        <div>© {new Date().getFullYear()} Haven. Privacy for a better internet.</div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/terms" className="py-1 transition-colors hover:text-slate-300">
            Terms
          </Link>
          <Link href="/privacy" className="py-1 transition-colors hover:text-slate-300">
            Privacy
          </Link>
          <Link href="/contact" className="py-1 transition-colors hover:text-slate-300">
            Contact
          </Link>
          <Link
            href="/status"
            className="flex items-center gap-1.5 py-1 transition-colors hover:text-[#00f5a0]"
          >
            <span className="size-1.5 rounded-full bg-[#00f5a0] shadow-[0_0_6px_rgba(0,245,160,0.8)]" />
            All systems normal
          </Link>
        </div>
      </div>
    </footer>
  );
}
