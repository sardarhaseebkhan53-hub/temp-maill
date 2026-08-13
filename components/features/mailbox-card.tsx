"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
  className?: string;
}

export function MailboxCard({
  mailbox,
  onRefresh,
  onDelete,
  onExtend,
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

  const defaultDurationMs = 10 * 60 * 1000;
  const remaining = Math.max(0, new Date(mailbox.expiresAt).getTime() - now);
  const totalSeconds = Math.floor(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const totalSegments = 8;
  const fraction = Math.min(1, Math.max(0, remaining / defaultDurationMs));
  const activeSegments = remaining <= 0 ? 0 : Math.max(1, Math.ceil(fraction * totalSegments));

  async function loadQr() {
    try {
      const res = await fetch(`/api/v1/mailboxes/${mailbox.id}/qr?token=${mailbox.publicToken}`);
      const json = (await res.json()) as {
        success: boolean;
        data?: { dataUrl?: string };
        error?: { message?: string };
      };
      if (res.ok && json.success && json.data?.dataUrl) {
        setQr(json.data.dataUrl);
      } else {
        toast.error(json.error?.message || "Could not generate QR code");
      }
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
        // The user may cancel the native share sheet; copying remains available.
      }
    }
    await copy(mailbox.address, "Address copied to clipboard");
  }

  async function run(name: string, action: () => Promise<void>) {
    setBusy(name);
    try {
      await action();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-[#00f5a0]/35 bg-[#0c1017]/95 p-4 shadow-[0_0_40px_rgba(0,245,160,0.12)] backdrop-blur-2xl sm:p-5",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-24 -top-24 size-48 rounded-full bg-[#00f5a0]/10 blur-3xl" />

      <div className="relative mb-3.5 flex flex-col items-start gap-2 xs:flex-row xs:items-center xs:justify-between">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#00f5a0] shadow-[0_0_8px_rgba(0,245,160,0.9)]" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 sm:text-xs">
            Your temporary email
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#00f5a0]/20 bg-[#00f5a0]/10 px-2.5 py-1 font-mono text-xs font-medium text-[#00f5a0]">
          <Clock className="size-3.5" />
          <span>{remaining > 0 ? `Expires in ${timeFormatted}` : "Expired"}</span>
        </div>
      </div>

      <div className="group relative flex min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-800/90 bg-[#070a10] px-3 py-3 transition-colors hover:border-slate-700 sm:gap-3 sm:px-4 sm:py-4">
        <button
          type="button"
          onClick={() => copy(mailbox.address)}
          className="min-w-0 flex-1 truncate text-left font-mono text-sm font-semibold tracking-tight text-white xs:text-base sm:text-xl"
          title="Copy email address"
        >
          {mailbox.address}
        </button>

        <button
          type="button"
          onClick={() => copy(mailbox.address)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white/[0.06] px-2.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-[#00f5a0]/20 hover:text-[#00f5a0] sm:px-3"
          aria-label="Copy email address"
        >
          {copied ? <Check className="size-4 text-[#00f5a0]" /> : <Copy className="size-4" />}
          <span className="hidden xs:inline">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      <p className="mt-2 text-[11px] font-medium text-slate-400">
        Your address is ready to receive email.
      </p>

      <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => copy(mailbox.address)}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-xs font-semibold text-white transition-all hover:bg-white/[0.12] active:scale-95"
        >
          {copied ? <Check className="size-3.5 text-[#00f5a0]" /> : <Copy className="size-3.5" />}
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
        <button
          type="button"
          onClick={loadQr}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-xs font-semibold text-white transition-all hover:bg-white/[0.12] active:scale-95"
        >
          <QrCode className="size-3.5 text-slate-300" />
          <span>QR code</span>
        </button>
        <button
          type="button"
          onClick={share}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-xs font-semibold text-white transition-all hover:bg-white/[0.12] active:scale-95"
        >
          <Share2 className="size-3.5 text-slate-300" />
          <span>Share</span>
        </button>
        <button
          type="button"
          disabled={busy === "refresh"}
          onClick={() => run("refresh", onRefresh)}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-[#00f5a0]/30 bg-[#00f5a0]/15 px-3 py-2.5 text-xs font-bold text-[#00f5a0] shadow-[0_0_15px_rgba(0,245,160,0.15)] transition-all hover:bg-[#00f5a0]/25 active:scale-95 disabled:cursor-wait disabled:opacity-60"
        >
          {busy === "refresh" ? <RefreshCw className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
          <span>New address</span>
        </button>
      </div>

      <div className="mt-4 pt-1">
        <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-medium text-slate-400">
          <span>The address expires automatically.</span>
          <span className="shrink-0 font-mono text-slate-500">{timeFormatted}</span>
        </div>
        <div className="grid h-1.5 grid-cols-8 gap-1.5 sm:h-2">
          {Array.from({ length: totalSegments }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "rounded-full transition-all duration-500",
                index < activeSegments
                  ? "bg-[#00f5a0] shadow-[0_0_8px_rgba(0,245,160,0.7)]"
                  : "bg-slate-800/80",
              )}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-3">
        <button
          type="button"
          disabled={busy === "extend"}
          onClick={() => run("extend", onExtend)}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-200 transition-all hover:bg-white/[0.08] active:scale-95 disabled:cursor-wait disabled:opacity-60"
        >
          <Clock className="size-3.5 text-[#00f5a0]" />
          <span>{busy === "extend" ? "Extending…" : "Extend"}</span>
        </button>
        <button
          type="button"
          disabled={busy === "delete"}
          onClick={() => run("delete", onDelete)}
          className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/20 active:scale-95 disabled:cursor-wait disabled:opacity-60"
        >
          <Trash2 className="size-3.5" />
          <span>{busy === "delete" ? "Deleting…" : "Delete"}</span>
        </button>
      </div>

      <Dialog open={Boolean(qr)} onClose={() => setQr(null)} title="Scan temporary address">
        {qr ? (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <Image
              src={qr}
              alt={`QR code for ${mailbox.address}`}
              width={224}
              height={224}
              unoptimized
              className="size-48 rounded-2xl bg-white p-3 shadow-xl xs:size-56"
            />
            <p className="max-w-full break-all font-mono text-xs text-slate-300">{mailbox.address}</p>
            <a
              href={qr}
              download={`haven-${mailbox.localPart}.png`}
              className="inline-flex items-center justify-center rounded-xl bg-[#00f5a0] px-5 py-2.5 text-xs font-bold text-black shadow-lg transition-colors hover:bg-[#00e092]"
            >
              Download QR PNG
            </a>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
