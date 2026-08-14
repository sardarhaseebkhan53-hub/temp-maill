"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { HavenWordmark } from "@/components/brand/logo";

/** Mobile header + drawer for the admin console. */
export function AdminNav({
  sections,
}: {
  sections: { group: string; items: [string, string][] }[];
}) {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  const current =
    sections
      .flatMap((section) => section.items)
      .find(([href]) => href === path)?.[1] ?? "Admin";

  return (
    <div className="lg:hidden">
      <div className="flex min-w-0 items-center justify-between gap-3 border-b border-white/[0.07] bg-[#080b12] px-4 py-3">
        <Link href="/admin" className="min-w-0 truncate">
          <HavenWordmark className="text-base" />
        </Link>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? "Close admin menu" : "Open admin menu"}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
          <span className="max-w-[9rem] truncate">{current}</span>
        </button>
      </div>

      {open ? (
        <nav className="max-h-[70vh] space-y-4 overflow-y-auto border-b border-white/[0.07] bg-[#070a10] p-4">
          {sections.map((section) => (
            <div key={section.group} className="min-w-0">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                {section.group}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {section.items.map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`truncate rounded-lg px-3 py-2 text-xs transition-colors ${
                      path === href
                        ? "bg-[#00f5a0]/15 font-semibold text-[#00f5a0]"
                        : "bg-white/[0.04] text-slate-300 hover:text-white"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
