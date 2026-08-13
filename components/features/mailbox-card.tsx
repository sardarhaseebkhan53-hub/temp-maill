"use client";

import { useState } from "react";
import { Check, Copy, QrCode, RefreshCw, Share2, Sparkles, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExpiryTimer } from "@/components/features/expiry-timer";
import { useClipboard } from "@/hooks/use-clipboard";
import { Dialog } from "@/components/ui/dialog";
import type { PublicMailbox } from "@/types";
import { toast } from "sonner";

export function MailboxCard({
  mailbox,
  onRefresh,
  onDelete,
  onExtend,
  onChange,
}: {
  mailbox: PublicMailbox;
  onRefresh: () => Promise<void>;
  onDelete: () => Promise<void>;
  onExtend: () => Promise<void>;
  onChange?: () => void;
}) {
  const { copied, copy } = useClipboard();
  const [qr, setQr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function loadQr() {
    const res = await fetch(`/api/v1/mailboxes/${mailbox.id}/qr?token=${mailbox.publicToken}`);
    const json = await res.json();
    if (json.success) setQr(json.data.dataUrl);
  }

  async function share() {
    const data = { title: "Haven inbox", text: mailbox.address, url: typeof window !== "undefined" ? window.location.href : "" };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch {
        /* fall through */
      }
    }
    await copy(mailbox.address, "Address copied");
  }

  async function run(name: string, fn: () => Promise<void>) {
    setBusy(name);
    try {
      await fn();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not complete that action");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="@container p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <ExpiryTimer expiresAt={mailbox.expiresAt} state={mailbox.state} />
          <span className="text-xs text-muted-foreground">{mailbox.unreadCount} unread</span>
        </div>
        {onChange ? (
          <button onClick={onChange} className="text-xs text-primary hover:underline">
            Change address
          </button>
        ) : null}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          type="button"
          onClick={() => copy(mailbox.address)}
          className="flex-1 text-left rounded-xl bg-muted/70 px-4 py-3 font-mono text-sm sm:text-base break-all hover:bg-muted"
          title={mailbox.address}
        >
          {mailbox.address}
        </button>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => copy(mailbox.address)} aria-label="Copy address">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="outline" loading={busy === "refresh"} onClick={() => run("refresh", onRefresh)} aria-label="New address">
            <RefreshCw className="size-4" />
            New
          </Button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" loading={busy === "extend"} onClick={() => run("extend", onExtend)}>
          <Clock className="size-4" />
          Extend
        </Button>
        <Button variant="secondary" size="sm" onClick={loadQr}>
          <QrCode className="size-4" />
          QR
        </Button>
        <Button variant="secondary" size="sm" onClick={share}>
          <Share2 className="size-4" />
          Share
        </Button>
        <Button variant="ghost" size="sm" loading={busy === "delete"} onClick={() => run("delete", onDelete)}>
          <Trash2 className="size-4" />
          Delete
        </Button>
        <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/pricing")}>
          <Sparkles className="size-4" />
          Longer life
        </Button>
      </div>
      <Dialog open={Boolean(qr)} onClose={() => setQr(null)} title="Scan this address">
        {qr ? (
          <div className="flex flex-col items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt={`QR code for ${mailbox.address}`} className="w-56 h-56 p-3 bg-white rounded-xl" />
            <a href={qr} download={`haven-${mailbox.localPart}.png`} className="text-sm text-primary hover:underline">
              Download PNG
            </a>
          </div>
        ) : null}
      </Dialog>
    </Card>
  );
}
