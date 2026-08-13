"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Globe, Menu, Moon, X } from "lucide-react";
import { useState } from "react";
import { HavenWordmark } from "@/components/brand/logo";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types";

interface NavLinkItem {
  href: string;
  label: string;
  hasDropdown?: boolean;
}

const links: NavLinkItem[] = [
  { href: "/", label: "Home" },
  { href: "/temporary-email", label: "Temp Email" },
  { href: "/temporary-phone", label: "SMS" },
  { href: "/developer-api", label: "API" },
  { href: "/pricing", label: "Pricing" },
  { href: "/tools", label: "Tools", hasDropdown: true },
  { href: "/blog", label: "Blog" },
];

export function Navbar({ user }: { user: SessionUser | null }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const dark = (theme === "system" ? resolvedTheme : theme) === "dark";

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#06080d]/85 backdrop-blur-xl no-print">
      <div className="mx-auto flex h-16 w-full max-w-[1560px] min-w-0 items-center justify-between gap-2 px-3 sm:h-[68px] sm:gap-4 sm:px-6">
        {/* Left: Brand Logo */}
        <Link href="/" className="shrink-0 group" aria-label="Haven home">
          <HavenWordmark />
        </Link>

        {/* Center: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1.5 text-sm font-medium">
          {links.map((l) => {
            const isActive = path === l.href;
            if (l.hasDropdown) {
              return (
                <div key={l.href} className="relative" onMouseLeave={() => setToolsOpen(false)}>
                  <button
                    type="button"
                    onClick={() => setToolsOpen((v) => !v)}
                    onMouseEnter={() => setToolsOpen(true)}
                    className={cn(
                      "flex items-center gap-1 rounded-xl px-3.5 py-2 text-slate-300 transition-all duration-150 hover:text-white hover:bg-white/[0.06]",
                      (isActive || path.startsWith("/tools")) && "text-white bg-white/[0.06]",
                    )}
                  >
                    <span>{l.label}</span>
                    <ChevronDown className="size-3.5 opacity-60" />
                  </button>
                  {toolsOpen && (
                    <div
                      className="absolute top-full left-0 mt-1.5 w-56 rounded-2xl border border-white/10 bg-[#0d121c]/95 backdrop-blur-xl p-2 shadow-2xl space-y-1 z-50 animate-fade-in"
                      onMouseEnter={() => setToolsOpen(true)}
                    >
                      <Link
                        href="/tools/breach-checker"
                        className="block rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06]"
                        onClick={() => setToolsOpen(false)}
                      >
                        Breach Checker
                      </Link>
                      <Link
                        href="/tools/fingerprint"
                        className="block rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06]"
                        onClick={() => setToolsOpen(false)}
                      >
                        Browser Fingerprint Check
                      </Link>
                      <Link
                        href="/temporary-phone"
                        className="block rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06]"
                        onClick={() => setToolsOpen(false)}
                      >
                        Temporary SMS
                      </Link>
                      <Link
                        href="/developer-api"
                        className="block rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06]"
                        onClick={() => setToolsOpen(false)}
                      >
                        Developer API
                      </Link>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative rounded-xl px-3.5 py-2 text-slate-300 transition-all duration-150 hover:text-white hover:bg-white/[0.06]",
                  isActive &&
                    "text-white bg-white/[0.07] font-semibold after:absolute after:bottom-0 after:left-3.5 after:right-3.5 after:h-[2px] after:bg-[#00f5a0] after:rounded-full after:shadow-[0_0_8px_rgba(0,245,160,0.8)]",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Controls & CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle */}
          <button
            type="button"
            aria-label="Toggle theme"
            className="hidden rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white sm:inline-flex"
            onClick={() => setTheme(dark ? "light" : "dark")}
          >
            <Moon className="size-4.5" />
          </button>

          {/* Language Selector */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-300 text-xs font-medium hover:bg-white/[0.06] cursor-pointer transition-colors">
            <Globe className="size-3.5 text-slate-400" />
            <span>EN</span>
            <ChevronDown className="size-3 text-slate-500" />
          </div>

          {/* Auth Controls */}
          {user ? (
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center justify-center rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 px-4 py-2 text-xs font-semibold text-white transition-all shadow-sm"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center justify-center rounded-xl px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="hidden items-center justify-center rounded-xl bg-[#00f5a0] px-4 py-2 text-xs font-bold text-[#06090e] shadow-[0_0_20px_rgba(0,245,160,0.3)] transition-all hover:bg-[#00e092] hover:shadow-[0_0_25px_rgba(0,245,160,0.5)] active:scale-95 sm:inline-flex sm:px-5 sm:py-2.5 sm:text-sm"
              >
                Create account
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06]"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="lg:hidden border-t border-white/10 bg-[#070a10]/98 backdrop-blur-2xl px-4 py-4 space-y-1 animate-fade-in">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "block rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                path === l.href
                  ? "bg-[#00f5a0]/15 text-[#00f5a0] font-semibold"
                  : "text-slate-300 hover:bg-white/[0.06] hover:text-white",
              )}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            <Link
              href={user ? "/dashboard" : "/login"}
              className="block rounded-xl px-4 py-3 text-sm text-center font-medium text-slate-200 bg-white/[0.06]"
              onClick={() => setOpen(false)}
            >
              {user ? "Go to Dashboard" : "Log in"}
            </Link>
            {!user ? (
              <Link
                href="/register"
                className="block rounded-xl bg-[#00f5a0] px-4 py-3 text-center text-sm font-bold text-[#06090e]"
                onClick={() => setOpen(false)}
              >
                Create account
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}
