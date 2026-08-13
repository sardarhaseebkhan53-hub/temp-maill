"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type AdPlacement = "top-leaderboard" | "hero-rectangle" | "sidebar" | "mobile-banner";

interface AdSlotProps {
  placement: AdPlacement;
  className?: string;
  isPremium?: boolean;
  testMode?: boolean;
  slotId?: string;
}

export function GoogleAdSenseLogo({ className }: { className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" aria-hidden>
        {/* Google AdSense style colored pills */}
        <path
          d="M6 14.5C4.07 14.5 2.5 12.93 2.5 11C2.5 9.07 4.07 7.5 6 7.5H9.5C11.43 7.5 13 9.07 13 11C13 12.93 11.43 14.5 9.5 14.5H6Z"
          fill="#4285F4"
        />
        <path
          d="M17.5 6.5C19.43 6.5 21 8.07 21 10C21 11.93 19.43 13.5 17.5 13.5H14C12.07 13.5 10.5 11.93 10.5 10C10.5 8.07 12.07 6.5 14 6.5H17.5Z"
          fill="#FBBC05"
        />
        <circle cx="16" cy="16.5" r="4.5" fill="#34A853" />
      </svg>
      <span className="font-semibold text-xs tracking-tight text-white/90">Google AdSense</span>
    </div>
  );
}

export function AdSlot({
  placement,
  className,
  isPremium = false,
  testMode = true,
  slotId: _slotId,
}: AdSlotProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isPremium || !testMode) {
    return null;
  }

  if (!mounted) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-white/[0.06] bg-[#0c101a]/60 animate-pulse",
          placement === "top-leaderboard" && "h-[90px] w-full max-w-[728px] mx-auto",
          placement === "hero-rectangle" && "h-[250px] w-full max-w-[300px]",
          placement === "sidebar" && "h-[360px] w-full max-w-[180px]",
          placement === "mobile-banner" && "h-[140px] w-full max-w-[320px]",
          className,
        )}
      />
    );
  }

  // Top Leaderboard Ad: 728 × 90
  if (placement === "top-leaderboard") {
    return (
      <div
        className={cn(
          "relative w-full max-w-[728px] min-h-[82px] sm:h-[90px] mx-auto rounded-2xl border border-indigo-500/25 bg-[#0b0e18]/90 backdrop-blur-xl p-3 sm:px-6 sm:py-3 shadow-[0_0_30px_rgba(99,102,241,0.12)] flex items-center justify-between gap-3 overflow-hidden select-none",
          className,
        )}
      >
        <div className="flex items-center gap-3 shrink-0">
          <span className="rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[11px] font-semibold px-3 py-1 tracking-wide">
            Test Ad
          </span>
        </div>

        <div className="flex flex-col items-center justify-center text-center">
          <div className="font-display font-bold text-lg sm:text-2xl text-white tracking-tight">
            728 × 90
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Leaderboard Test Ad</div>
        </div>

        <div className="flex flex-col items-end justify-center shrink-0">
          <div className="text-[10px] text-slate-400 font-medium">This is a test ad</div>
          <GoogleAdSenseLogo className="mt-0.5" />
        </div>
      </div>
    );
  }

  // Hero Rectangle Ad: 300 × 250
  if (placement === "hero-rectangle") {
    return (
      <div
        className={cn(
          "relative w-full max-w-[300px] h-[250px] rounded-2xl border border-purple-500/35 bg-[#0b0e18]/95 backdrop-blur-xl p-5 shadow-[0_0_35px_rgba(139,92,246,0.18)] flex flex-col justify-between items-center text-center select-none overflow-hidden",
          className,
        )}
      >
        <div className="w-full flex justify-start">
          <span className="rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[11px] font-semibold px-3 py-0.5 tracking-wide">
            Test Ad
          </span>
        </div>

        <div className="py-2">
          <div className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
            300 × 250
          </div>
          <div className="text-xs text-slate-300 font-medium mt-1">Medium Rectangle</div>
        </div>

        <div className="w-full flex flex-col items-center justify-center">
          <span className="text-[10px] text-slate-400 font-medium">This is a test ad</span>
          <GoogleAdSenseLogo className="mt-1" />
        </div>
      </div>
    );
  }

  // Sidebar Ad: 160 × 600
  if (placement === "sidebar") {
    return (
      <div
        className={cn(
          "relative w-full max-w-[160px] min-h-[360px] rounded-2xl border border-purple-500/30 bg-[#0b0e18]/90 backdrop-blur-xl p-4 shadow-[0_0_25px_rgba(139,92,246,0.12)] flex flex-col justify-between items-center text-center select-none overflow-hidden",
          className,
        )}
      >
        <div className="w-full flex justify-center">
          <span className="rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-semibold px-2.5 py-0.5 tracking-wide">
            Test Ad
          </span>
        </div>

        <div className="py-6">
          <div className="font-display font-bold text-xl text-white tracking-tight">
            160 × 600
          </div>
          <div className="text-[11px] text-slate-300 font-medium mt-1">Wide Skyscraper</div>
        </div>

        <div className="w-full flex flex-col items-center justify-center">
          <span className="text-[9px] text-slate-400 font-medium">This is a test ad</span>
          <GoogleAdSenseLogo className="mt-1 scale-90" />
        </div>
      </div>
    );
  }

  // Mobile Leaderboard: 320 × 50 / Banner
  return (
    <div
      className={cn(
        "relative w-full max-w-[320px] min-h-[140px] rounded-2xl border border-purple-500/30 bg-[#0b0e18]/90 backdrop-blur-xl p-4 shadow-[0_0_25px_rgba(139,92,246,0.12)] flex flex-col justify-between items-center text-center select-none overflow-hidden",
        className,
      )}
    >
      <div className="w-full flex justify-center">
        <span className="rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-semibold px-2.5 py-0.5 tracking-wide">
          Test Ad
        </span>
      </div>

      <div className="py-1">
        <div className="font-display font-bold text-lg text-white tracking-tight">
          320 × 50
        </div>
        <div className="text-[11px] text-slate-300 font-medium">Mobile Leaderboard</div>
      </div>

      <div className="w-full flex flex-col items-center justify-center">
        <span className="text-[9px] text-slate-400 font-medium">This is a test ad</span>
        <GoogleAdSenseLogo className="mt-0.5 scale-90" />
      </div>
    </div>
  );
}
