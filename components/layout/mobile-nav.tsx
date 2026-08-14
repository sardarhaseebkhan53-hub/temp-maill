"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Inbox, LayoutGrid, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/tools", label: "Tools", icon: LayoutGrid },
  { href: "/pricing", label: "Premium", icon: Sparkles },
  { href: "/dashboard", label: "Account", icon: User },
];

export function MobileNav() {
  const path = usePathname();
  if (path.startsWith("/admin")) return null;
  return (
    <nav
      aria-label="Primary"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-[#06080d]/95 backdrop-blur-xl no-print pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const active = path === it.href || (it.href !== "/" && path.startsWith(it.href));
          const Icon = it.icon;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                  active ? "text-[#00f5a0] font-bold" : "text-slate-400 hover:text-slate-200",
                )}
              >
                <Icon className={cn("size-5", active && "drop-shadow-[0_0_8px_rgba(0,245,160,0.6)]")} />
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * In-flow reservation for the fixed bottom navigation: exactly its height
 * (3.5rem of items) plus the device's bottom safe-area inset, so the last
 * line of page content is never trapped underneath the bar on notched
 * phones or gesture-navigation devices.
 */
export function MobileNavSpacer() {
  return (
    <div
      aria-hidden="true"
      className="h-[calc(3.5rem+env(safe-area-inset-bottom))] lg:hidden"
    />
  );
}
