import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { HavenWordmark } from "@/components/brand/logo";

const nav = [
  ["/admin", "Dashboard"],
  ["/admin/users", "Users"],
  ["/admin/mailboxes", "Mailboxes"],
  ["/admin/inbox-monitor", "Inbox monitor"],
  ["/admin/domains", "Domains"],
  ["/admin/email-providers", "Email providers"],
  ["/admin/sms-providers", "SMS providers"],
  ["/admin/plans", "Plans"],
  ["/admin/subscriptions", "Subscriptions"],
  ["/admin/payments", "Payments"],
  ["/admin/coupons", "Coupons"],
  ["/admin/ads", "Ads"],
  ["/admin/ad-analytics", "Ad analytics"],
  ["/admin/api", "API"],
  ["/admin/reports", "Reports"],
  ["/admin/security", "Security"],
  ["/admin/rate-limits", "Rate limits"],
  ["/admin/settings", "Settings"],
  ["/admin/seo", "SEO"],
  ["/admin/pages", "Pages"],
  ["/admin/blog", "Blog"],
  ["/admin/faq", "FAQ"],
  ["/admin/translations", "Translations"],
  ["/admin/notifications", "Notifications"],
  ["/admin/logs", "Logs"],
  ["/admin/audit", "Audit"],
  ["/admin/backups", "Backups"],
  ["/admin/maintenance", "Maintenance"],
  ["/admin/flags", "Flags"],
  ["/admin/tickets", "Tickets"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requirePermission("admin.access");
  } catch {
    redirect("/login?next=/admin");
  }
  return (
    <div className="min-h-screen grid lg:grid-cols-[240px_1fr]">
      <aside className="border-r bg-card/40 p-4 hidden lg:block">
        <Link href="/" className="block mb-6">
          <HavenWordmark />
        </Link>
        <nav className="space-y-0.5 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
          {nav.map(([href, label]) => (
            <Link key={href} href={href ?? "/admin"} className="block rounded-lg px-3 py-2 text-sm hover:bg-muted">
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div>
        <div className="lg:hidden border-b p-3 overflow-x-auto flex gap-2">
          {nav.map(([href, label]) => (
            <Link key={href} href={href ?? "/admin"} className="text-xs whitespace-nowrap rounded-full border px-2 py-1">
              {label}
            </Link>
          ))}
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
