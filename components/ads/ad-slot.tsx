"use client";

import { cn } from "@/lib/utils";

export type AdPlacement = "top-leaderboard" | "hero-rectangle" | "sidebar" | "mobile-banner";

interface AdSlotProps {
  placement: AdPlacement;
  className?: string;
  isPremium?: boolean;
  testMode?: boolean;
  slotId?: string;
}

function TestLabel() {
  return (
    <span className="whitespace-nowrap rounded-full border border-purple-500/40 bg-purple-500/20 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-purple-300">
      Test Ad
    </span>
  );
}

function ProviderLabel() {
  return <span className="text-[9px] font-medium text-slate-500">Ad placement preview</span>;
}

export function AdSlot({
  placement,
  className,
  isPremium = false,
  testMode = true,
  slotId: _slotId,
}: AdSlotProps) {
  if (isPremium || !testMode) return null;

  if (placement === "top-leaderboard") {
    return (
      <div
        className={cn(
          "mx-auto grid min-h-16 w-full max-w-[728px] min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl border border-indigo-500/25 bg-[#0b0e18]/90 px-3 py-2 shadow-[0_0_24px_rgba(99,102,241,0.1)] sm:h-[72px] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:rounded-2xl sm:px-5",
          className,
        )}
      >
        <TestLabel />
        <div className="min-w-0 text-center">
          <div className="font-display text-base font-bold tracking-tight text-white sm:text-xl">
            <span className="sm:hidden">320 × 50</span>
            <span className="hidden sm:inline">728 × 90</span>
          </div>
          <div className="truncate text-[10px] font-medium text-slate-400 sm:text-[11px]">Responsive leaderboard</div>
        </div>
        <div className="hidden text-right sm:block">
          <ProviderLabel />
        </div>
      </div>
    );
  }

  if (placement === "hero-rectangle") {
    return (
      <div
        className={cn(
          "flex aspect-[6/5] min-h-56 w-full max-w-[300px] min-w-0 flex-col items-center justify-between rounded-2xl border border-purple-500/30 bg-[#0b0e18]/95 p-4 text-center shadow-[0_0_28px_rgba(139,92,246,0.14)]",
          className,
        )}
      >
        <div className="flex w-full justify-start">
          <TestLabel />
        </div>
        <div>
          <div className="font-display text-2xl font-bold tracking-tight text-white">300 × 250</div>
          <div className="mt-1 text-xs font-medium text-slate-300">Medium rectangle</div>
        </div>
        <ProviderLabel />
      </div>
    );
  }

  if (placement === "sidebar") {
    return (
      <div
        className={cn(
          "flex min-h-[360px] w-full max-w-[160px] min-w-0 flex-col items-center justify-between rounded-2xl border border-purple-500/30 bg-[#0b0e18]/90 p-4 text-center shadow-[0_0_24px_rgba(139,92,246,0.1)]",
          className,
        )}
      >
        <TestLabel />
        <div>
          <div className="font-display text-xl font-bold tracking-tight text-white">160 × 600</div>
          <div className="mt-1 text-[11px] font-medium text-slate-300">Responsive skyscraper</div>
        </div>
        <ProviderLabel />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid min-h-[72px] w-full max-w-[320px] min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl border border-purple-500/30 bg-[#0b0e18]/90 px-3 py-2 text-center shadow-[0_0_20px_rgba(139,92,246,0.1)]",
        className,
      )}
    >
      <TestLabel />
      <div className="min-w-0">
        <div className="font-display text-base font-bold tracking-tight text-white">320 × 50</div>
        <div className="truncate text-[10px] font-medium text-slate-400">Mobile banner</div>
      </div>
    </div>
  );
}
