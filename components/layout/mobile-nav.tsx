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
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-[#06080d]/95 backdrop-blur-xl safe-bottom no-print">
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const active = path === it.href || (it.href !== "/" && path.startsWith(it.href));
          const Icon = it.icon;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium min-h-12 transition-colors",
                  active ? "text-[#00f5a0] font-bold" : "text-slate-400 hover:text-slate-200",
                )}
              >
                <Icon className={cn("size-4.5", active && "drop-shadow-[0_0_8px_rgba(0,245,160,0.6)]")} />
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
