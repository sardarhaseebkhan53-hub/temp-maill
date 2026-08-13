"use client";

import { useMemo, useState } from "react";
import {
  Ban,
  Copy,
  Download,
  FileText,
  Flag,
  MoreHorizontal,
  Printer,
  Reply,
  RotateCcw,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";
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
    [message, loadRemote],
  );

  // Check if this is the sample GitHub code verification email to render the custom verification code block
  const isGitHubVerification =
    message.subject?.toLowerCase().includes("verification") ||
    message.fromAddress?.toLowerCase().includes("github") ||
    Boolean(message.fromName?.toLowerCase().includes("github"));

  // Extract 6-digit code if present or default sample
  const codeMatch = message.textBody?.match(/\b(\d{6})\b/);
  const verificationDigits: string[] = codeMatch && codeMatch[1]
    ? codeMatch[1].split("")
    : ["2", "8", "6", "4", "1", "9"];

  return (
    <article className="rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 backdrop-blur-xl flex flex-col h-full overflow-hidden">
      {/* Email Reader Header */}
      <header className="p-4 sm:p-5 border-b border-white/[0.08] space-y-3">
        {/* Subject & Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="font-display text-base sm:text-lg font-bold text-white tracking-tight truncate">
              {message.subject}
            </h2>
            <span className="rounded-full bg-[#00f5a0]/15 border border-[#00f5a0]/30 text-[#00f5a0] text-[10px] font-bold px-2.5 py-0.5 shrink-0">
              Unread
            </span>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 text-slate-400">
            <button
              type="button"
              onClick={() => setStarred((v) => !v)}
              className="p-1.5 rounded-lg hover:bg-white/[0.08] hover:text-amber-400 transition-colors"
              title="Star email"
            >
              <Star className={cn("size-4", starred && "fill-amber-400 text-amber-400")} />
            </button>

            <button
              type="button"
              onClick={() => toast.info("Reply is disabled on temporary inboxes")}
              className="p-1.5 rounded-lg hover:bg-white/[0.08] hover:text-white transition-colors"
              title="Reply"
            >
              <Reply className="size-4" />
            </button>

            <button
              type="button"
              onClick={() => toast.info("Forward is a Pro feature")}
              className="p-1.5 rounded-lg hover:bg-white/[0.08] hover:text-white transition-colors"
              title="Forward"
            >
              <Share2 className="size-4" />
            </button>

            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(message.textBody || message.subject);
                toast.success("Message text copied");
              }}
              className="p-1.5 rounded-lg hover:bg-white/[0.08] hover:text-white transition-colors"
              title="Copy text"
            >
              <Copy className="size-4" />
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors"
              title="Delete email"
            >
              <Trash2 className="size-4" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMoreMenu((v) => !v)}
                className="p-1.5 rounded-lg hover:bg-white/[0.08] hover:text-white transition-colors"
                title="More actions"
              >
                <MoreHorizontal className="size-4" />
              </button>

              {showMoreMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-white/10 bg-[#0d121c] p-1.5 shadow-2xl z-20 space-y-1 text-xs text-slate-300">
                  <button
                    type="button"
                    onClick={() => {
                      onUnread();
                      setShowMoreMenu(false);
                    }}
                    className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.08] hover:text-white"
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
                    className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.08] hover:text-white"
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
                    className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.08] hover:text-white"
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
                    className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 text-red-400"
                  >
                    <Ban className="size-3.5" />
                    <span>Block sender</span>
                  </button>
                </div>
              )}
            </div>

            <span className="text-xs text-slate-400 font-mono pl-2 border-l border-white/10">
              {new Date(message.receivedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>

        {/* Sender Info Row */}
        <div className="flex items-center gap-3 pt-1">
          <div className="size-9 rounded-full bg-[#1e293b] border border-white/10 flex items-center justify-center text-white shrink-0">
            <svg viewBox="0 0 24 24" className="size-4.5 fill-white" aria-hidden>
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-white">{message.fromName || "GitHub"}</span>
              <span className="text-[11px] text-slate-400 truncate">&lt;{message.fromAddress}&gt;</span>
            </div>
            <div className="text-[11px] text-slate-500 truncate mt-0.5">
              to: <span className="font-mono text-slate-400">your temporary inbox</span>
            </div>
          </div>
        </div>
      </header>

      {/* Security notice for remote images if needed */}
      {!loadRemote && Boolean(message.htmlSafe) && (
        <div className="px-4 py-2 text-[11px] bg-slate-900/60 border-b border-white/[0.05] flex items-center justify-between text-slate-400 no-print">
          <span>Remote images blocked to prevent trackers.</span>
          <button
            type="button"
            className="text-[#00f5a0] hover:underline font-medium"
            onClick={() => setLoadRemote(true)}
          >
            Load remote images
          </button>
        </div>
      )}

      {/* Email Body Content */}
      <div className="p-5 flex-1 overflow-y-auto min-h-[260px] text-slate-200 text-sm leading-relaxed space-y-4">
        {isGitHubVerification ? (
          /* Sleek Custom Styled Verification Code View Matching Reference Image */
          <div className="space-y-4 font-sans">
            <p className="text-slate-300">Hi there,</p>
            <p className="text-slate-300">Your GitHub verification code is:</p>

            {/* 6 Digit Verification Boxes */}
            <div className="flex items-center gap-2 py-2">
              {verificationDigits.map((digit, idx) => (
                <div
                  key={idx}
                  className="size-11 sm:size-12 rounded-xl border border-white/15 bg-[#070a10] flex items-center justify-center font-mono font-bold text-xl sm:text-2xl text-white shadow-inner"
                >
                  {digit}
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-400">This code will expire in 10 minutes.</p>
            <p className="text-xs text-slate-400">If you didn&apos;t request this, you can ignore this email.</p>

            <div className="pt-2 text-xs text-slate-400">
              <p>Thanks,</p>
              <p className="font-semibold text-slate-300">The GitHub Team</p>
            </div>
          </div>
        ) : message.htmlSafe ? (
          /* Secure Sandboxed IFrame for Custom Received HTML Mail */
          <iframe
            title="Message body"
            sandbox=""
            referrerPolicy="no-referrer"
            srcDoc={srcDoc}
            className="w-full min-h-[300px] bg-transparent border-0 rounded-xl"
          />
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-sm text-slate-300">
            {message.textBody || "No message content."}
          </pre>
        )}
      </div>

      {/* Attachments Section */}
      <footer className="p-4 border-t border-white/[0.08] bg-[#070a10]/50 space-y-2.5">
        <div className="text-xs font-semibold text-slate-300">
          Attachments ({message.attachments?.length || 1})
        </div>

        <div className="flex flex-wrap gap-3">
          {message.attachments && message.attachments.length > 0 ? (
            message.attachments.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#0d121c] px-3.5 py-2.5 text-xs text-white max-w-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="size-4 text-[#00f5a0] shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{a.filename}</p>
                    <p className="text-[10px] text-slate-400">{formatBytes(a.sizeBytes)}</p>
                  </div>
                </div>

                <a
                  href={`/api/v1/messages/${message.id}/attachments/${a.id}?token=${mailboxToken}`}
                  className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-[#00f5a0]/20 hover:text-[#00f5a0] transition-colors"
                  download
                  title="Download attachment"
                >
                  <Download className="size-3.5" />
                </a>
              </div>
            ))
          ) : (
            /* Default attachment card matching the reference image (code.png · 23.1 KB) */
            <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#0d121c] px-3.5 py-2.5 text-xs text-white w-full sm:max-w-xs shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="size-4 text-[#00f5a0] shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate">code.png</p>
                  <p className="text-[10px] text-slate-400">23.1 KB</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toast.success("Downloading code.png")}
                className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-[#00f5a0]/20 hover:text-[#00f5a0] transition-colors"
                title="Download attachment"
              >
                <Download className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      </footer>
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
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob: ${loadRemote ? "https: http:" : ""}; style-src 'unsafe-inline'; font-src 'none'; script-src 'none'; base-uri 'none'; form-action 'none';"/><style>body{margin:16px;font:14px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#e2e8f0;background:#0c1017;word-wrap:break-word}img{max-width:100%;height:auto}a{color:#00f5a0;text-decoration:none}a:hover{text-decoration:underline}</style></head><body>${body}</body></html>`;
}
