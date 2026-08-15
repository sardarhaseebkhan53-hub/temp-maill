"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { EmailViewer } from "@/components/features/email-viewer";
import type { PublicMessageDetail } from "@/types";

interface MobileMessageReaderProps {
  message: PublicMessageDetail;
  mailboxToken: string;
  onBack: () => void;
  onDelete: () => void;
  onUnread: () => void;
  onReport: () => void;
  onBlock: () => void;
}

/**
 * Mobile message reader.
 *
 * On small screens the inbox follows the native mail-app pattern:
 * message list → tap → dedicated full-screen reader → back to the list.
 * The three-column desktop layout is intentionally not squeezed onto a
 * phone; at `xl` and up this overlay is never rendered and the regular
 * side-by-side reader is used instead.
 *
 * The overlay:
 *  - sits above the header (z-50) and bottom tab bar (z-40), so an
 *    advertisement can never cover message content or actions;
 *  - locks body scroll and restores focus to the invoking list on close;
 *  - honours the top and bottom device safe areas;
 *  - closes on Escape for hardware-keyboard users.
 */
export function MobileMessageReader({
  message,
  mailboxToken,
  onBack,
  onDelete,
  onUnread,
  onReport,
  onBlock,
}: MobileMessageReaderProps) {
  const backRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    backRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onBack();
      }
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [onBack]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={message.subject || "Message"}
      className="fixed inset-0 z-[60] flex min-w-0 flex-col bg-[#06080d] animate-reader-in motion-reduce:animate-none xl:hidden"
    >
      <div
        className="shrink-0 border-b border-white/[0.08] bg-[#070a10]/95 backdrop-blur-xl"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex min-w-0 items-center gap-1 px-1.5 py-2 sm:px-3">
          <button
            ref={backRef}
            type="button"
            onClick={onBack}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl px-2.5 text-sm font-semibold text-[#00f5a0] transition-colors hover:bg-white/[0.06] active:bg-white/[0.1]"
            aria-label="Back to inbox"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
            <span className="pr-1">Inbox</span>
          </button>
          <p className="min-w-0 flex-1 truncate text-center text-xs font-medium text-slate-400">
            {message.subject || "(no subject)"}
          </p>
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#00f5a0]/20 bg-[#00f5a0]/[0.08] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#00f5a0]"
            title="Message content is sanitized before display"
          >
            <ShieldCheck className="size-3" aria-hidden="true" />
            Safe
          </span>
        </div>
      </div>

      <div
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <EmailViewer
          message={message}
          mailboxToken={mailboxToken}
          onDelete={onDelete}
          onUnread={onUnread}
          onReport={onReport}
          onBlock={onBlock}
        />
      </div>
    </div>
  );
}
