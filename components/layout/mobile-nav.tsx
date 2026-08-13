"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Inbox, LayoutGrid, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/tools", label: "Services", icon: LayoutGrid },
  { href: "/pricing", label: "Premium", icon: Sparkles },
  { href: "/dashboard", label: "Account", icon: User },
];

export function MobileNav() {
  const path = usePathname();
  if (path.startsWith("/admin")) return null;
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur safe-bottom no-print">
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const active = path === it.href || (it.href !== "/" && path.startsWith(it.href));
          const Icon = it.icon;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] min-h-12",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
