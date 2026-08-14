"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, Moon, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";
import { HavenWordmark } from "@/components/brand/logo";
import { NavLocaleSwitch } from "@/components/layout/locale-switch";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types";

interface NavLinkItem {
  href: string;
  label: string;
  children?: { href: string; label: string }[];
}

const links: NavLinkItem[] = [
  { href: "/", label: "Home" },
  { href: "/temporary-email", label: "Temp Email" },
  { href: "/temporary-phone", label: "SMS" },
  { href: "/developer-api", label: "API" },
  { href: "/pricing", label: "Pricing" },
  {
    href: "/tools",
    label: "Tools",
    children: [
      { href: "/tools", label: "All privacy tools" },
      { href: "/tools/breach-checker", label: "Breach checker" },
      { href: "/tools/fingerprint", label: "Browser fingerprint" },
      { href: "/temporary-phone", label: "Temporary SMS" },
    ],
  },
  { href: "/blog", label: "Blog" },
];

function isActive(path: string, href: string): boolean {
  if (href === "/") return path === "/";
  return path === href || path.startsWith(`${href}/`);
}

export function Navbar({ user, locale = "en" }: { user: SessionUser | null; locale?: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement | null>(null);

  // Close the mobile drawer on navigation so it never covers the new page.
  useEffect(() => {
    setOpen(false);
    setToolsOpen(false);
  }, [path]);

  // Dismiss the dropdown on outside click and Escape, not only on mouse-out,
  // so keyboard and touch users can close it too.
  useEffect(() => {
    if (!toolsOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!toolsRef.current?.contains(event.target as Node)) setToolsOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setToolsOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [toolsOpen]);

  return (
    <header className="no-print sticky top-0 z-50 border-b border-white/[0.08] bg-[#06080d]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1560px] min-w-0 items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
        <Link href="/" className="shrink-0" aria-label="Haven home">
          <HavenWordmark />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 text-sm font-medium lg:flex">
          {links.map((link) => {
            const active = isActive(path, link.href);

            if (link.children) {
              return (
                <div key={link.href} ref={toolsRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setToolsOpen((value) => !value)}
                    aria-expanded={toolsOpen}
                    aria-haspopup="menu"
                    className={cn(
                      "flex items-center gap-1 rounded-xl px-3.5 py-2 text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white",
                      active && "bg-white/[0.06] text-white",
                    )}
                  >
                    {link.label}
                    <ChevronDown
                      className={cn(
                        "size-3.5 opacity-60 transition-transform",
                        toolsOpen && "rotate-180",
                      )}
                      aria-hidden="true"
                    />
                  </button>

                  {toolsOpen ? (
                    <div
                      role="menu"
                      className="absolute left-0 top-full z-50 mt-1.5 w-60 space-y-1 rounded-2xl border border-white/10 bg-[#0d121c]/98 p-2 shadow-2xl backdrop-blur-xl"
                    >
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          role="menuitem"
                          className="block rounded-xl px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-xl px-3.5 py-2 text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white",
                  active &&
                    "bg-white/[0.07] font-semibold text-white after:absolute after:inset-x-3.5 after:bottom-0 after:h-[2px] after:rounded-full after:bg-[#00f5a0] after:shadow-[0_0_8px_rgba(0,245,160,0.8)]",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeButton />
          <div className="hidden sm:block">
            <NavLocaleSwitch value={locale} />
          </div>

          {user ? (
            <Link
              href="/dashboard"
              className="hidden items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/[0.14] sm:inline-flex"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden items-center justify-center rounded-xl px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white sm:inline-flex"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="hidden items-center justify-center rounded-xl bg-[#00f5a0] px-4 py-2 text-xs font-bold text-[#06090e] shadow-[0_0_20px_rgba(0,245,160,0.3)] transition-all hover:bg-[#00e092] active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 sm:inline-flex"
              >
                Create account
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-menu"
          className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-white/10 bg-[#070a10]/98 px-4 py-4 backdrop-blur-2xl lg:hidden"
        >
          <nav aria-label="Mobile" className="space-y-1">
            {links.map((link) => (
              <div key={link.href} className="min-w-0">
                <Link
                  href={link.href}
                  className={cn(
                    "block rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    isActive(path, link.href)
                      ? "bg-[#00f5a0]/15 font-semibold text-[#00f5a0]"
                      : "text-slate-300 hover:bg-white/[0.06] hover:text-white",
                  )}
                >
                  {link.label}
                </Link>
                {link.children ? (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-white/[0.07] pl-3">
                    {link.children.slice(1).map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block rounded-lg px-3 py-2 text-xs text-slate-400 transition-colors hover:text-white"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </nav>

          <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
            <div className="sm:hidden">
              <NavLocaleSwitch value={locale} />
            </div>
            <Link
              href={user ? "/dashboard" : "/login"}
              className="block rounded-xl bg-white/[0.06] px-4 py-3 text-center text-sm font-medium text-slate-200"
            >
              {user ? "Go to dashboard" : "Log in"}
            </Link>
            {!user ? (
              <Link
                href="/register"
                className="block rounded-xl bg-[#00f5a0] px-4 py-3 text-center text-sm font-bold text-[#06090e]"
              >
                Create account
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function ThemeButton() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // The resolved theme is unknown during SSR, so render a stable placeholder
  // until mount to avoid a hydration mismatch.
  useEffect(() => setMounted(true), []);

  const dark = resolvedTheme !== "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className="inline-flex size-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
    >
      {mounted && !dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
