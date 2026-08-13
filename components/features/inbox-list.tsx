"use client";

import { Copy, Inbox, MailOpen, Paperclip } from "lucide-react";
import { cn, relativeTime, truncate } from "@/lib/utils";
import type { PublicMessage } from "@/types";

interface InboxListProps {
  messages: PublicMessage[];
  messageCount: number;
  unreadCount: number;
  mailboxAddress?: string;
  loading?: boolean;
  selectedId?: string;
  onSelect: (id: string) => void;
  onCopyAddress?: () => void;
  activeFilter?: "all" | "unread" | "read";
  onFilterChange?: (filter: "all" | "unread" | "read") => void;
}

function SenderAvatar({ name }: { name: string }) {
  const initial = name.trim().slice(0, 1).toUpperCase() || "?";
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#00f5a0]/25 bg-[#00f5a0]/10 text-xs font-bold text-[#00f5a0]">
      {initial}
    </div>
  );
}

export function InboxList({
  messages,
  messageCount,
  unreadCount,
  mailboxAddress,
  loading = false,
  selectedId,
  onSelect,
  onCopyAddress,
  activeFilter = "all",
  onFilterChange,
}: InboxListProps) {
  const filtered = messages.filter((message) => {
    if (activeFilter === "unread") return !message.read;
    if (activeFilter === "read") return message.read;
    return true;
  });

  const isEmptyInbox = messageCount === 0 && messages.length === 0;
  const emptyFilterLabel =
    activeFilter === "unread"
      ? "No unread messages"
      : activeFilter === "read"
        ? "No read messages"
        : "No messages available";

  return (
    <div className="flex min-h-72 min-w-0 flex-col">
      <div className="flex flex-col gap-3 border-b border-white/[0.08] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <h2 className="text-sm font-semibold text-white">Inbox</h2>
          <span className="whitespace-nowrap text-[11px] font-medium text-slate-400">
            {messageCount} {messageCount === 1 ? "message" : "messages"}
          </span>
          {unreadCount > 0 ? (
            <span className="whitespace-nowrap rounded-full border border-[#00f5a0]/20 bg-[#00f5a0]/10 px-2 py-0.5 text-[10px] font-bold text-[#00f5a0]">
              {unreadCount} unread
            </span>
          ) : null}
        </div>

        {!isEmptyInbox ? (
          <div className="grid w-full grid-cols-3 gap-1 rounded-xl border border-white/[0.06] bg-white/[0.04] p-1 text-xs sm:w-auto">
            {(["all", "unread", "read"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => onFilterChange?.(filter)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 font-medium capitalize transition-colors",
                  activeFilter === filter
                    ? "bg-white/[0.12] font-semibold text-white shadow-sm"
                    : "text-slate-400 hover:text-white",
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {loading && messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-5 py-12 text-center" role="status">
          <div className="mb-4 size-10 animate-pulse rounded-2xl border border-[#00f5a0]/20 bg-[#00f5a0]/10" />
          <p className="text-sm font-semibold text-white">Checking your inbox…</p>
          <p className="mt-1 text-xs text-slate-400">Only received messages will appear here.</p>
        </div>
      ) : filtered.length === 0 ? (
        isEmptyInbox ? (
          <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center sm:py-14">
            <div className="relative mb-4 flex size-14 items-center justify-center rounded-2xl border border-[#00f5a0]/25 bg-[#00f5a0]/10 text-[#00f5a0] shadow-[0_0_24px_rgba(0,245,160,0.1)]">
              <Inbox className="size-6" aria-hidden="true" />
              <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-[#0c1017] bg-[#00f5a0]" />
            </div>
            <h3 className="font-display text-base font-bold text-white">No messages yet</h3>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-slate-400 sm:text-sm">
              Your temporary inbox is ready. Emails sent to this address will appear here automatically.
            </p>
            {mailboxAddress && onCopyAddress ? (
              <button
                type="button"
                onClick={onCopyAddress}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:border-[#00f5a0]/30 hover:bg-[#00f5a0]/10 hover:text-[#00f5a0]"
              >
                <Copy className="size-3.5" />
                Copy email address
              </button>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center">
            <div className="mb-3 flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400">
              <MailOpen className="size-5" />
            </div>
            <p className="text-sm font-semibold text-white">{emptyFilterLabel}</p>
            <button
              type="button"
              onClick={() => onFilterChange?.("all")}
              className="mt-2 text-xs font-semibold text-[#00f5a0] hover:underline"
            >
              Show all messages
            </button>
          </div>
        )
      ) : (
        <ul className="max-h-[540px] divide-y divide-white/[0.05] overflow-y-auto">
          {filtered.map((message) => {
            const isSelected = selectedId === message.id;
            const sender = message.fromName || message.fromAddress;

            return (
              <li key={message.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => onSelect(message.id)}
                  className={cn(
                    "group relative flex w-full min-w-0 items-start gap-3 p-3 text-left transition-colors sm:px-4 sm:py-3.5",
                    isSelected
                      ? "bg-white/[0.08] before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-[#00f5a0] before:shadow-[0_0_8px_rgba(0,245,160,0.8)]"
                      : "hover:bg-white/[0.04]",
                  )}
                >
                  <SenderAvatar name={sender} />

                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex min-w-0 items-center justify-between gap-2">
                      <h3
                        className={cn(
                          "min-w-0 truncate text-xs font-semibold",
                          !message.read ? "text-white" : "text-slate-300",
                        )}
                      >
                        {sender}
                      </h3>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {!message.read ? (
                          <span className="size-2 rounded-full bg-[#00f5a0] shadow-[0_0_6px_rgba(0,245,160,0.8)]" />
                        ) : null}
                        <time className="text-[10px] font-medium text-slate-500" dateTime={message.receivedAt}>
                          {relativeTime(message.receivedAt)}
                        </time>
                      </div>
                    </div>

                    <p
                      className={cn(
                        "truncate text-xs font-medium",
                        !message.read ? "text-slate-200" : "text-slate-400",
                      )}
                    >
                      {message.subject || "(no subject)"}
                    </p>
                    {message.snippet ? (
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">
                        {truncate(message.snippet, 80)}
                      </p>
                    ) : null}
                  </div>

                  {message.hasAttachments ? (
                    <Paperclip className="size-3.5 shrink-0 self-center text-slate-500" aria-label="Has attachments" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
