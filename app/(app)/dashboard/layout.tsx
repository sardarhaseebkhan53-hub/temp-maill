import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/mobile-nav";

const links = [
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
  return (
    <div className="min-h-screen">
      <Navbar user={ctx.user} />
      <div className="container py-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="no-print">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto">
            {links.map(([href, label]) => (
              <Link key={href} href={href ?? "/dashboard"} className="rounded-lg px-3 py-2 text-sm hover:bg-muted whitespace-nowrap">
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <div>{children}</div>
      </div>
      <MobileNav />
    </div>
  );
}
