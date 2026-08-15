"use client";

import { useMemo, useState } from "react";
import {
  Ban,
  Copy,
  Download,
  FileText,
  Flag,
  Mail,
  MoreHorizontal,
  Printer,
  Reply,
  RotateCcw,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { OtpCodeCard } from "@/components/features/otp-code-card";
import type { PublicMessageDetail } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EmailViewerProps {
  message: PublicMessageDetail;
  mailboxToken: string;
  onDelete: () => void;
  onUnread: () => void;
  onReport: () => void;
  onBlock: () => void;
}

export function EmailViewer({
  message,
  mailboxToken,
  onDelete,
  onUnread,
  onReport,
  onBlock,
}: EmailViewerProps) {
  const [loadRemote, setLoadRemote] = useState(false);
  const [starred, setStarred] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const srcDoc = useMemo(
    () => buildSrcDoc(message.htmlSafe || wrapText(message.textBody || ""), loadRemote),
    [message.htmlSafe, message.textBody, loadRemote],
  );
  const sender = message.fromName || message.fromAddress;
  const senderInitial = sender.trim().slice(0, 1).toUpperCase() || "?";
  const attachments = message.attachments || [];

  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 backdrop-blur-xl">
      <header className="min-w-0 space-y-3 border-b border-white/[0.08] p-4 sm:p-5">
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <h2 className="min-w-0 break-words font-display text-base font-bold tracking-tight text-white sm:text-lg">
              {message.subject || "(no subject)"}
            </h2>
            {!message.read ? (
              <span className="shrink-0 rounded-full border border-[#00f5a0]/30 bg-[#00f5a0]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#00f5a0]">
                Unread
              </span>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-1 text-slate-400 sm:gap-1.5">
            <button
              type="button"
              onClick={() => setStarred((value) => !value)}
              className="rounded-lg p-2.5 transition-colors hover:bg-white/[0.08] lg:p-1.5 hover:text-amber-400"
              title="Star email"
              aria-pressed={starred}
            >
              <Star className={cn("size-4", starred && "fill-amber-400 text-amber-400")} />
            </button>
            <button
              type="button"
              onClick={() => toast.info("Reply is disabled on temporary inboxes")}
              className="rounded-lg p-2.5 transition-colors hover:bg-white/[0.08] lg:p-1.5 hover:text-white"
              title="Reply"
            >
              <Reply className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => toast.info("Forward is a Pro feature")}
              className="rounded-lg p-2.5 transition-colors hover:bg-white/[0.08] lg:p-1.5 hover:text-white"
              title="Forward"
            >
              <Share2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(message.textBody || message.subject || "");
                  toast.success("Message text copied");
                } catch {
                  toast.error("Could not copy message text");
                }
              }}
              className="rounded-lg p-2.5 transition-colors hover:bg-white/[0.08] lg:p-1.5 hover:text-white"
              title="Copy text"
            >
              <Copy className="size-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg p-2.5 transition-colors hover:bg-red-500/20 hover:text-red-400 lg:p-1.5"
              title="Delete email"
            >
              <Trash2 className="size-4" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMoreMenu((value) => !value)}
                className="rounded-lg p-2.5 transition-colors hover:bg-white/[0.08] lg:p-1.5 hover:text-white"
                title="More actions"
                aria-expanded={showMoreMenu}
              >
                <MoreHorizontal className="size-4" />
              </button>

              {showMoreMenu ? (
                <div className="absolute right-0 top-full z-20 mt-1 w-44 space-y-1 rounded-xl border border-white/10 bg-[#0d121c] p-1.5 text-xs text-slate-300 shadow-2xl">
                  <button
                    type="button"
                    disabled={!message.read}
                    onClick={() => {
                      onUnread();
                      setShowMoreMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Mark as unread</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.print();
                      setShowMoreMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/[0.08] hover:text-white"
                  >
                    <Printer className="size-3.5" />
                    <span>Print email</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onReport();
                      setShowMoreMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/[0.08] hover:text-white"
                  >
                    <Flag className="size-3.5" />
                    <span>Report spam</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onBlock();
                      setShowMoreMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-red-400 hover:bg-red-500/20"
                  >
                    <Ban className="size-3.5" />
                    <span>Block sender</span>
                  </button>
                </div>
              ) : null}
            </div>

            <time
              className="ml-1 border-l border-white/10 pl-2 font-mono text-xs text-slate-400"
              dateTime={message.receivedAt}
            >
              {new Date(message.receivedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </time>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-3 pt-1">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#00f5a0]/25 bg-[#00f5a0]/10 text-xs font-bold text-[#00f5a0]">
            {senderInitial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-col text-xs sm:flex-row sm:items-baseline sm:gap-2">
              <span className="truncate font-bold text-white">{sender}</span>
              {message.fromName ? (
                <span className="truncate text-[11px] text-slate-400">&lt;{message.fromAddress}&gt;</span>
              ) : null}
            </div>
            <div className="mt-0.5 truncate text-[11px] text-slate-500">
              to: <span className="font-mono text-slate-400">{message.toAddress}</span>
            </div>
          </div>
        </div>
      </header>

      {message.detectedCode ? (
        <div className="border-b border-white/[0.05] p-3 sm:px-5">
          <OtpCodeCard code={message.detectedCode} />
        </div>
      ) : null}

      {!loadRemote && Boolean(message.htmlSafe) ? (
        <div className="flex flex-col gap-2 border-b border-white/[0.05] bg-slate-900/60 px-4 py-2 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>Remote images are blocked to prevent tracking.</span>
          <button
            type="button"
            className="self-start font-medium text-[#00f5a0] hover:underline sm:self-auto"
            onClick={() => setLoadRemote(true)}
          >
            Load remote images
          </button>
        </div>
      ) : null}

      <div className="min-h-[260px] min-w-0 flex-1 p-4 text-sm leading-relaxed text-slate-200 sm:p-5">
        {message.htmlSafe ? (
          <iframe
            title="Message body"
            sandbox=""
            referrerPolicy="no-referrer"
            srcDoc={srcDoc}
            className="min-h-[320px] w-full rounded-xl border-0 bg-transparent"
          />
        ) : message.textBody ? (
          <pre className="max-w-full whitespace-pre-wrap break-words font-sans text-sm text-slate-300">
            {message.textBody}
          </pre>
        ) : (
          <div className="flex min-h-52 flex-col items-center justify-center text-center text-slate-500">
            <Mail className="mb-2 size-5" />
            <p className="text-xs">This email has no text content.</p>
          </div>
        )}
      </div>

      {attachments.length > 0 ? (
        <footer className="space-y-2.5 border-t border-white/[0.08] bg-[#070a10]/50 p-4">
          <div className="text-xs font-semibold text-slate-300">
            Attachments ({attachments.length})
          </div>
          <div className="grid min-w-0 gap-2 sm:grid-cols-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0d121c] px-3.5 py-2.5 text-xs text-white"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <FileText className="size-4 shrink-0 text-[#00f5a0]" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{attachment.filename}</p>
                    <p className="text-[10px] text-slate-400">
                      {formatBytes(attachment.sizeBytes)}
                      {attachment.blocked ? " · Blocked for safety" : ""}
                    </p>
                  </div>
                </div>

                {!attachment.blocked ? (
                  <a
                    href={`/api/v1/messages/${message.id}/attachments/${attachment.id}?token=${mailboxToken}`}
                    className="shrink-0 rounded-lg bg-white/[0.06] p-2.5 transition-colors lg:p-1.5 hover:bg-[#00f5a0]/20 hover:text-[#00f5a0]"
                    download
                    title={`Download ${attachment.filename}`}
                  >
                    <Download className="size-3.5" />
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </footer>
      ) : null}
    </article>
  );
}

function wrapText(text: string) {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<pre style="white-space:pre-wrap;font:14px/1.5 ui-sans-serif,system-ui">${escaped}</pre>`;
}

function buildSrcDoc(html: string, loadRemote: boolean) {
  const body = loadRemote
    ? html
    : html.replace(/<img\b[^>]*src=["']https?:\/\/[^"']+["'][^>]*>/gi, "<!-- remote image blocked -->");
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob: ${loadRemote ? "https: http:" : ""}; style-src 'unsafe-inline'; font-src 'none'; script-src 'none'; base-uri 'none'; form-action 'none';"/><style>html,body{max-width:100%}body{margin:16px;font:14px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#e2e8f0;background:#0c1017;overflow-wrap:anywhere}img{max-width:100%;height:auto}table{max-width:100%}a{color:#00f5a0;text-decoration:none}a:hover{text-decoration:underline}</style></head><body>${body}</body></html>`;
}
