"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button aria-label="Close" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-white/10 bg-[#0c1017] shadow-2xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] animate-slide-up max-h-[92dvh] overflow-y-auto text-slate-200",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 mb-4 pb-2 border-b border-white/[0.08]">
          <h2 className="font-display text-base font-bold text-white tracking-tight">{title}</h2>
          <button onClick={onClose} className="inline-flex size-10 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08]" aria-label="Close dialog">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
