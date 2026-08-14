import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { MobileNav, MobileNavSpacer } from "@/components/layout/mobile-nav";
import { LOCALES, type Locale } from "@/types";

const links: [string, string][] = [
  ["/dashboard", "Overview"],
  ["/dashboard/mailboxes", "Inboxes"],
  ["/dashboard/aliases", "Aliases"],
  ["/dashboard/api-keys", "API keys"],
  ["/dashboard/usage", "Usage"],
  ["/dashboard/billing", "Billing"],
  ["/dashboard/settings", "Settings"],
  ["/dashboard/security", "Security"],
  ["/dashboard/activity", "Activity"],
  ["/dashboard/notifications", "Notifications"],
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let ctx;
  try {
    ctx = await requireUser();
  } catch {
    redirect("/login?next=/dashboard");
  }

  const jar = await cookies();
  const raw = (jar.get("haven_locale")?.value || "en") as Locale;
  const locale = LOCALES.includes(raw) ? raw : "en";

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-clip bg-[#06080d] text-slate-200">
      <Navbar user={ctx.user} locale={locale} />

      <div className="mx-auto grid w-full max-w-[1480px] min-w-0 flex-1 gap-6 px-3 py-8 sm:px-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="no-print min-w-0">
          <nav
            aria-label="Dashboard"
            className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
          >
            {links.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>

      <MobileNavSpacer />
      <MobileNav />
    </div>
  );
}
