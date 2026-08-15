import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { HavenWordmark } from "@/components/brand/logo";
import { AdminNav } from "@/components/layout/admin-nav";

const nav: { group: string; items: [string, string][] }[] = [
  {
    group: "Overview",
    items: [
      ["/admin", "Dashboard"],
      ["/admin/system-health", "System health"],
      ["/admin/launch-checklist", "Launch checklist"],
      ["/admin/users", "Users"],
      ["/admin/mailboxes", "Mailboxes"],
      ["/admin/inbox-monitor", "Inbox monitor"],
    ],
  },
  {
    group: "Revenue",
    items: [
      ["/admin/payments", "Payments"],
      ["/admin/plans", "Plans"],
      ["/admin/subscriptions", "Subscriptions"],
      ["/admin/coupons", "Coupons"],
    ],
  },
  {
    group: "Monetization",
    items: [
      ["/admin/ads", "Ads"],
      ["/admin/ad-analytics", "Ad analytics"],
      ["/admin/analytics", "Analytics"],
    ],
  },
  {
    group: "Delivery",
    items: [
      ["/admin/domains", "Domains"],
      ["/admin/email-providers", "Email providers"],
      ["/admin/sms-providers", "SMS providers"],
      ["/admin/webhooks", "Webhooks"],
      ["/admin/api", "API"],
    ],
  },
  {
    group: "Content",
    items: [
      ["/admin/blog", "Blog"],
      ["/admin/pages", "Pages"],
      ["/admin/faq", "FAQ"],
      ["/admin/seo", "SEO"],
      ["/admin/translations", "Translations"],
      ["/admin/notifications", "Notifications"],
    ],
  },
  {
    group: "Safety",
    items: [
      ["/admin/reports", "Reports"],
      ["/admin/security", "Security"],
      ["/admin/rate-limits", "Rate limits"],
      ["/admin/audit", "Audit"],
      ["/admin/logs", "Logs"],
      ["/admin/tickets", "Tickets"],
    ],
  },
  {
    group: "System",
    items: [
      ["/admin/settings", "Settings"],
      ["/admin/limits", "Limits & retention"],
      ["/admin/flags", "Flags"],
      ["/admin/maintenance", "Maintenance"],
      ["/admin/backups", "Backups"],
      ["/admin/storage", "Storage"],
      ["/admin/captcha", "CAPTCHA"],
    ],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side gate: admin pages are never merely hidden in the client.
  try {
    await requirePermission("admin.access");
  } catch {
    redirect("/login?next=/admin");
  }

  return (
    <div className="min-h-screen min-w-0 bg-[#06080d] text-slate-200">
      <div className="grid min-w-0 lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="hidden min-w-0 border-r border-white/[0.07] bg-[#080b12] p-4 lg:block">
          <Link href="/" className="mb-6 block">
            <HavenWordmark />
          </Link>
          <nav className="max-h-[calc(100vh-7rem)] space-y-4 overflow-y-auto pr-1">
            {nav.map((section) => (
              <div key={section.group} className="min-w-0">
                <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                  {section.group}
                </p>
                <div className="space-y-0.5">
                  {section.items.map(([href, label]) => (
                    <Link
                      key={href}
                      href={href}
                      className="block truncate rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          <AdminNav sections={nav} />
          <div className="min-w-0 p-4 sm:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
