"use client";

import { cn } from "@/lib/utils";

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="tablist" className="inline-flex flex-wrap gap-1 rounded-xl bg-white/[0.05] border border-white/10 p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          className={cn(
            "min-h-9 rounded-lg px-3.5 text-xs font-semibold transition-all",
            value === t.id
              ? "bg-[#00f5a0] text-[#06090e] shadow-[0_0_12px_rgba(0,245,160,0.3)]"
              : "text-slate-300 hover:text-white hover:bg-white/[0.06]",
          )}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
