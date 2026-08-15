"use client";

import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Displays a verification code that was detected in a genuine received
 * message. Rendered only when a code actually exists — Haven never invents
 * or fabricates OTPs.
 */
export function OtpCodeCard({ code, compact = false, className }: { code: string; compact?: boolean; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Verification code copied");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Could not copy the code");
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={copy}
        className={cn(
          "inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#00f5a0]/30 bg-[#00f5a0]/10 px-3 py-1.5 font-mono text-sm font-bold tracking-[0.2em] text-[#00f5a0] shadow-[0_0_14px_rgba(0,245,160,0.12)] transition-colors hover:bg-[#00f5a0]/20",
          className,
        )}
        aria-label={`Copy verification code ${code}`}
      >
        {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
        {code}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-[#00f5a0]/25 bg-[#00f5a0]/[0.07] px-4 py-3",
        className,
      )}
      role="group"
      aria-label={`Verification code ${code}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#00f5a0]/30 bg-[#00f5a0]/15 text-[#00f5a0]">
          <KeyRound className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#00f5a0]/90">
            Verification code
          </p>
          <p className="select-all font-mono text-lg font-extrabold tracking-[0.22em] text-white">{code}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={copy}
        className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-[#00f5a0]/35 bg-[#00f5a0]/15 px-4 py-2 text-xs font-bold text-[#00f5a0] transition-colors hover:bg-[#00f5a0]/25"
      >
        {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
        {copied ? "Copied" : "Copy code"}
      </button>
    </div>
  );
}
