import Link from "next/link";
import { HavenWordmark } from "@/components/brand/logo";

const cols = [
  {
    title: "Product",
    links: [
      ["/temporary-email", "Temporary email"],
      ["/temporary-phone", "Temporary SMS"],
      ["/developer-api", "Developer API"],
      ["/pricing", "Pricing"],
      ["/tools", "Privacy Tools"],
      ["/blog", "Blog"],
      ["/faq", "FAQ"],
    ],
  },
  {
    title: "Privacy & Security",
    links: [
      ["/privacy", "Privacy Policy"],
      ["/terms", "Terms of Service"],
      ["/cookies", "Cookie Policy"],
      ["/acceptable-use", "Acceptable Use"],
      ["/abuse", "Abuse Policy"],
      ["/security", "Security"],
    ],
  },
  {
    title: "Company",
    links: [
      ["/contact", "Contact Us"],
      ["/help", "Help & Docs"],
      ["/status", "System Status"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#05070c] no-print mt-16 text-slate-400">
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <HavenWordmark />
          <p className="mt-3 text-xs text-slate-400 max-w-xs leading-relaxed">
            Privacy-first temporary email and ephemeral identity services. A shorter memory for the mail you do not need to keep.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="text-xs font-bold text-white tracking-wider uppercase mb-3">{c.title}</p>
            <ul className="space-y-2 text-xs">
              {c.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href ?? "/"} className="hover:text-[#00f5a0] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 pb-8 pt-4 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
        <div>© {new Date().getFullYear()} Haven. All rights reserved.</div>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-slate-400">Privacy</Link>
          <Link href="/terms" className="hover:text-slate-400">Terms</Link>
          <Link href="/status" className="hover:text-[#00f5a0] flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[#00f5a0]" /> All systems normal
          </Link>
        </div>
      </div>
    </footer>
  );
}
