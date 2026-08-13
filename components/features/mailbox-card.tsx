"use client";

import { useEffect, useState } from "react";
import { Check, Clock, Copy, Plus, QrCode, RefreshCw, Share2, Trash2 } from "lucide-react";
import { useClipboard } from "@/hooks/use-clipboard";
import { Dialog } from "@/components/ui/dialog";
import type { PublicMailbox } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MailboxCardProps {
  mailbox: PublicMailbox;
  onRefresh: () => Promise<void>;
  onDelete: () => Promise<void>;
  onExtend: () => Promise<void>;
  onChange?: () => void;
  className?: string;
}

export function MailboxCard({
  mailbox,
  onRefresh,
  onDelete,
  onExtend,
  onChange: _onChange,
  className,
}: MailboxCardProps) {
  const { copied, copy } = useClipboard();
  const [qr, setQr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const totalDurationMs = 10 * 60 * 1000; // 10 minutes default scale
  const remaining = Math.max(0, new Date(mailbox.expiresAt).getTime() - now);
  const totalSec = Math.floor(remaining / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const timeFormatted = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  // 8 Segments for the progress bar
  const totalSegments = 8;
  const fraction = Math.min(1, Math.max(0, remaining / totalDurationMs));
  const activeSegments = remaining <= 0 ? 0 : Math.max(1, Math.ceil(fraction * totalSegments));

  async function loadQr() {
    try {
      const res = await fetch(`/api/v1/mailboxes/${mailbox.id}/qr?token=${mailbox.publicToken}`);
      const json = await res.json();
      if (json.success) setQr(json.data.dataUrl);
    } catch {
      toast.error("Could not generate QR code");
    }
  }

  async function share() {
    const data = {
      title: "Haven Temporary Inbox",
      text: mailbox.address,
      url: typeof window !== "undefined" ? window.location.href : "",
    };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch {
        /* fallback to clipboard */
      }
    }
    await copy(mailbox.address, "Address copied to clipboard");
  }

  async function run(name: string, fn: () => Promise<void>) {
    setBusy(name);
    try {
      await fn();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-[#00f5a0]/30 bg-[#0c1017]/95 backdrop-blur-2xl p-5 sm:p-6 shadow-[0_0_40px_rgba(0,245,160,0.09)] flex flex-col justify-between overflow-hidden",
        className,
      )}
    >
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 size-48 bg-[#00f5a0]/10 blur-3xl rounded-full pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#00f5a0] shadow-[0_0_8px_rgba(0,245,160,0.9)] animate-pulse" />
          <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-slate-300 uppercase">
            YOUR TEMPORARY EMAIL
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-[#00f5a0] bg-[#00f5a0]/10 px-2.5 py-1 rounded-full border border-[#00f5a0]/20">
          <Clock className="size-3.5" />
          <span>Expires in {timeFormatted}</span>
        </div>
      </div>

      {/* Address Input Display Box */}
      <div className="relative rounded-xl border border-slate-800/90 bg-[#070a10] px-4 py-3 sm:py-3.5 flex items-center justify-between gap-3 group transition-colors hover:border-slate-700">
        <span
          onClick={() => copy(mailbox.address)}
          className="font-mono text-base sm:text-lg font-medium text-white tracking-tight truncate select-all cursor-pointer"
          title="Click to copy address"
        >
          {mailbox.address}
        </span>

        <button
          type="button"
          onClick={() => copy(mailbox.address)}
          className="shrink-0 p-2 rounded-lg bg-white/[0.05] hover:bg-[#00f5a0]/20 text-slate-300 hover:text-[#00f5a0] transition-colors"
          aria-label="Copy email address"
        >
          {copied ? <Check className="size-4 text-[#00f5a0]" /> : <Copy className="size-4" />}
        </button>
      </div>

      {/* Primary Action Buttons: Copy, QR Code, Share, + New */}
      <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => copy(mailbox.address)}
          className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 px-3 py-2.5 text-xs font-semibold text-white transition-all active:scale-95"
        >
          {copied ? <Check className="size-3.5 text-[#00f5a0]" /> : <Copy className="size-3.5" />}
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>

        <button
          type="button"
          onClick={loadQr}
          className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 px-3 py-2.5 text-xs font-semibold text-white transition-all active:scale-95"
        >
          <QrCode className="size-3.5 text-slate-300" />
          <span>QR Code</span>
        </button>

        <button
          type="button"
          onClick={share}
          className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 px-3 py-2.5 text-xs font-semibold text-white transition-all active:scale-95"
        >
          <Share2 className="size-3.5 text-slate-300" />
          <span>Share</span>
        </button>

        <button
          type="button"
          disabled={busy === "refresh"}
          onClick={() => run("refresh", onRefresh)}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-[#00f5a0]/15 hover:bg-[#00f5a0]/25 border border-[#00f5a0]/30 px-3 py-2.5 text-xs font-bold text-[#00f5a0] transition-all active:scale-95 shadow-[0_0_15px_rgba(0,245,160,0.15)]"
        >
          {busy === "refresh" ? (
            <RefreshCw className="size-3.5 animate-spin" />
          ) : (
            <Plus className="size-3.5" />
          )}
          <span>New</span>
        </button>
      </div>

      {/* Progress & Expiration Status */}
      <div className="mt-4 pt-1">
        <p className="text-[11px] text-slate-400 font-medium mb-2">
          The address will expire automatically.
        </p>

        {/* 8 Segmented Progress Bar */}
        <div className="grid grid-cols-8 gap-1.5 h-1.5 sm:h-2">
          {Array.from({ length: totalSegments }).map((_, index) => {
            const isFilled = index < activeSegments;
            return (
              <div
                key={index}
                className={cn(
                  "rounded-full transition-all duration-500",
                  isFilled
                    ? "bg-[#00f5a0] shadow-[0_0_8px_rgba(0,245,160,0.7)]"
                    : "bg-slate-800/80",
                )}
              />
            );
          })}
        </div>
      </div>

      {/* Bottom Actions: Extend & Delete */}
      <div className="mt-4 pt-3 border-t border-white/[0.07] flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={busy === "extend"}
          onClick={() => run("extend", onExtend)}
          className="flex items-center gap-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 px-4 py-2 text-xs font-semibold text-slate-200 transition-all active:scale-95"
        >
          <Clock className="size-3.5 text-[#00f5a0]" />
          <span>{busy === "extend" ? "Extending…" : "Extend"}</span>
        </button>

        <button
          type="button"
          disabled={busy === "delete"}
          onClick={() => run("delete", onDelete)}
          className="flex items-center gap-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-4 py-2 text-xs font-semibold text-red-400 transition-all active:scale-95"
        >
          <Trash2 className="size-3.5 text-red-400" />
          <span>{busy === "delete" ? "Deleting…" : "Delete"}</span>
        </button>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={Boolean(qr)} onClose={() => setQr(null)} title="Scan Temporary Address">
        {qr ? (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qr}
              alt={`QR code for ${mailbox.address}`}
              className="w-56 h-56 p-3 bg-white rounded-2xl shadow-xl"
            />
            <p className="text-xs font-mono text-slate-300 break-all">{mailbox.address}</p>
            <a
              href={qr}
              download={`haven-${mailbox.localPart}.png`}
              className="inline-flex items-center justify-center rounded-xl bg-[#00f5a0] text-black font-bold text-xs px-5 py-2.5 shadow-lg hover:bg-[#00e092] transition-colors"
            >
              Download QR PNG
            </a>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
