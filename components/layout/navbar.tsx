"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { HavenWordmark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LocaleSwitch } from "@/components/layout/locale-switch";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types";

const links = [
  { href: "/", label: "Home" },
  { href: "/temporary-email", label: "Temp Email" },
  { href: "/temporary-phone", label: "SMS" },
  { href: "/developer-api", label: "API" },
  { href: "/pricing", label: "Pricing" },
  { href: "/tools", label: "Tools" },
  { href: "/blog", label: "Blog" },
];

export function Navbar({ user }: { user: SessionUser | null }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md no-print">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="shrink-0" aria-label="Haven home">
          <HavenWordmark />
        </Link>
        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href as string}
              className={cn(
                "rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted",
                path === l.href && "text-foreground bg-muted",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <LocaleSwitch />
          <ThemeToggle />
          {user ? (
            <Button variant="secondary" className="hidden sm:inline-flex" onClick={() => (window.location.href = "/dashboard")}>
              Dashboard
            </Button>
          ) : (
            <>
              <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => (window.location.href = "/login")}>
                Log in
              </Button>
              <Button className="hidden sm:inline-flex" onClick={() => (window.location.href = "/register")}>
                Create account
              </Button>
            </>
          )}
          <button className="lg:hidden p-2 rounded-lg hover:bg-muted" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open ? (
        <div className="lg:hidden border-t bg-background px-4 py-3 space-y-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-3 text-sm hover:bg-muted" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link href={user ? "/dashboard" : "/login"} className="block rounded-lg px-3 py-3 text-sm hover:bg-muted">
            {user ? "Dashboard" : "Log in"}
          </Link>
        </div>
      ) : null}
    </header>
  );
}
