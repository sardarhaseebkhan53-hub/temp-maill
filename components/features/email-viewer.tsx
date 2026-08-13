"use client";

import { useMemo, useState } from "react";
import { Ban, Copy, Flag, Printer, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";
import type { PublicMessageDetail } from "@/types";
import { toast } from "sonner";

export function EmailViewer({
  message,
  mailboxToken,
  onDelete,
  onUnread,
  onReport,
  onBlock,
}: {
  message: PublicMessageDetail;
  mailboxToken: string;
  onDelete: () => void;
  onUnread: () => void;
  onReport: () => void;
  onBlock: () => void;
}) {
  const [loadRemote, setLoadRemote] = useState(false);
  const srcDoc = useMemo(() => buildSrcDoc(message.htmlSafe || wrapText(message.textBody), loadRemote), [message, loadRemote]);

  return (
    <article className="rounded-2xl border bg-card overflow-hidden">
      <header className="p-4 sm:p-6 border-b space-y-2">
        <h2 className="font-display text-xl font-semibold break-words" title={message.subject}>
          {message.subject}
        </h2>
        <p className="text-sm text-muted-foreground break-all">
          From {message.fromName ? `${message.fromName} ` : ""}
          &lt;{message.fromAddress}&gt;
        </p>
        <p className="text-xs text-muted-foreground">{new Date(message.receivedAt).toLocaleString()}</p>
        <div className="flex flex-wrap gap-2 pt-2 no-print">
          <Button size="sm" variant="secondary" onClick={() => window.print()}>
            <Printer className="size-4" /> Print
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              await navigator.clipboard.writeText(message.textBody || message.subject);
              toast.success("Copied");
            }}
          >
            <Copy className="size-4" /> Copy text
          </Button>
          <Button size="sm" variant="secondary" onClick={onUnread}>
            <RotateCcw className="size-4" /> Unread
          </Button>
          <Button size="sm" variant="secondary" onClick={onReport}>
            <Flag className="size-4" /> Report
          </Button>
          <Button size="sm" variant="secondary" onClick={onBlock}>
            <Ban className="size-4" /> Block
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="size-4" /> Delete
          </Button>
        </div>
      </header>
      {!loadRemote ? (
        <div className="px-4 py-2 text-xs bg-muted/50 flex items-center justify-between no-print">
          <span>Remote images are blocked so trackers stay dark.</span>
          <button className="text-primary hover:underline" onClick={() => setLoadRemote(true)}>
            Load remote images
          </button>
        </div>
      ) : null}
      <iframe
        title="Message body"
        sandbox=""
        referrerPolicy="no-referrer"
        srcDoc={srcDoc}
        className="w-full min-h-[360px] bg-white dark:bg-zinc-950"
      />
      {message.attachments.length > 0 ? (
        <footer className="p-4 border-t space-y-2">
          <p className="text-sm font-medium">Attachments</p>
          <ul className="space-y-2">
            {message.attachments.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm rounded-lg bg-muted px-3 py-2">
                <span className="truncate">
                  {a.filename} · {formatBytes(a.sizeBytes)}
                </span>
                {a.blocked ? (
                  <span className="text-destructive text-xs">Blocked for safety</span>
                ) : (
                  <a
                    className="text-primary hover:underline"
                    href={`/api/v1/messages/${message.id}/attachments/${a.id}?token=${mailboxToken}`}
                  >
                    Download
                  </a>
                )}
              </li>
            ))}
          </ul>
        </footer>
      ) : null}
    </article>
  );
}

function wrapText(text: string) {
  const esc = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<pre style="white-space:pre-wrap;font:14px/1.5 ui-sans-serif,system-ui">${esc}</pre>`;
}

function buildSrcDoc(html: string, loadRemote: boolean) {
  const body = loadRemote
    ? html
    : html.replace(/<img\b[^>]*src=["']https?:\/\/[^"']+["'][^>]*>/gi, "<!-- remote image blocked -->");
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob: ${loadRemote ? "https: http:" : ""}; style-src 'unsafe-inline'; font-src 'none'; script-src 'none'; base-uri 'none'; form-action 'none';"/><style>body{margin:16px;font:15px/1.55 ui-sans-serif,system-ui;color:#14221f;word-wrap:break-word}img{max-width:100%;height:auto}a{color:#1b7869}</style></head><body>${body}</body></html>`;
}
