"use client";

import { Paperclip } from "lucide-react";
import { cn, relativeTime, truncate } from "@/lib/utils";
import type { PublicMessage } from "@/types";

interface InboxListProps {
  messages: PublicMessage[];
  selectedId?: string;
  onSelect: (id: string) => void;
  activeFilter?: "all" | "unread" | "read";
  onFilterChange?: (filter: "all" | "unread" | "read") => void;
}

// Brand Avatar Icons matching reference image
function SenderAvatar({ name }: { name: string }) {
  const n = (name || "").toLowerCase();
  if (n.includes("github")) {
    return (
      <div className="size-8 rounded-full bg-[#1e293b] border border-white/10 flex items-center justify-center text-white shrink-0 shadow-sm">
        <svg viewBox="0 0 24 24" className="size-4 fill-white" aria-hidden>
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
      </div>
    );
  }
  if (n.includes("netflix")) {
    return (
      <div className="size-8 rounded-full bg-black border border-red-500/30 flex items-center justify-center text-[#e50914] font-black text-sm shrink-0">
        N
      </div>
    );
  }
  if (n.includes("discord")) {
    return (
      <div className="size-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white shrink-0">
        <svg viewBox="0 0 24 24" className="size-4 fill-white" aria-hidden>
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      </div>
    );
  }
  if (n.includes("amazon")) {
    return (
      <div className="size-8 rounded-full bg-[#ff9900]/20 border border-[#ff9900]/40 flex items-center justify-center text-[#ff9900] font-bold text-xs shrink-0">
        a
      </div>
    );
  }
  if (n.includes("microsoft")) {
    return (
      <div className="size-8 rounded-full bg-[#00a4ef]/20 border border-[#00a4ef]/40 flex items-center justify-center shrink-0">
        <div className="grid grid-cols-2 gap-0.5 size-3.5">
          <div className="bg-[#f25022]" />
          <div className="bg-[#7fba00]" />
          <div className="bg-[#00a4ef]" />
          <div className="bg-[#ffb900]" />
        </div>
      </div>
    );
  }
  return (
    <div className="size-8 rounded-full bg-[#00f5a0]/15 border border-[#00f5a0]/30 text-[#00f5a0] flex items-center justify-center font-bold text-xs shrink-0">
      {(name || "?").slice(0, 1).toUpperCase()}
    </div>
  );
}

export function InboxList({
  messages,
  selectedId,
  onSelect,
  activeFilter = "all",
  onFilterChange,
}: InboxListProps) {
  const filtered = messages.filter((m) => {
    if (activeFilter === "unread") return !m.read;
    if (activeFilter === "read") return m.read;
    return true;
  });

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div className="flex flex-col h-full">
      {/* Top Header & Filter Row */}
      <div className="p-3 sm:p-4 border-b border-white/[0.08] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white text-sm">Inbox</h3>
          <span className="text-[11px] text-slate-400 font-medium">
            {unreadCount} unread message{unreadCount === 1 ? "" : "s"}
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.06] text-xs">
          <button
            type="button"
            onClick={() => onFilterChange?.("all")}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium transition-colors",
              activeFilter === "all"
                ? "bg-white/[0.12] text-white font-semibold shadow-sm"
                : "text-slate-400 hover:text-white",
            )}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onFilterChange?.("unread")}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1",
              activeFilter === "unread"
                ? "bg-white/[0.12] text-white font-semibold shadow-sm"
                : "text-slate-400 hover:text-white",
            )}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="size-4 rounded-full bg-[#00f5a0]/20 text-[#00f5a0] text-[10px] font-bold inline-flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => onFilterChange?.("read")}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium transition-colors",
              activeFilter === "read"
                ? "bg-white/[0.12] text-white font-semibold shadow-sm"
                : "text-slate-400 hover:text-white",
            )}
          >
            Read
          </button>
        </div>
      </div>

      {/* Messages List */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center justify-center my-auto">
          <div className="size-10 rounded-2xl bg-[#00f5a0]/10 border border-[#00f5a0]/20 flex items-center justify-center text-[#00f5a0] mb-2 animate-float">
            ✉
          </div>
          <p className="text-xs font-semibold text-white">No messages here</p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
            Send an email or click &quot;Send Sample&quot; above.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.05] overflow-y-auto max-h-[520px]">
          {filtered.map((m) => {
            const isSelected = selectedId === m.id;
            const sender = m.fromName || m.fromAddress;
            const isNetflix = sender.toLowerCase().includes("netflix");

            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => onSelect(m.id)}
                  className={cn(
                    "w-full text-left p-3 sm:px-4 sm:py-3.5 flex items-start gap-3 transition-all duration-150 relative group",
                    isSelected
                      ? "bg-white/[0.08] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[#00f5a0] before:shadow-[0_0_8px_rgba(0,245,160,0.8)]"
                      : "hover:bg-white/[0.04]",
                  )}
                >
                  <SenderAvatar name={sender} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className={cn("text-xs font-semibold truncate", !m.read ? "text-white" : "text-slate-300")}>
                        {sender}
                      </h4>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!m.read && (
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              isNetflix ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" : "bg-[#00f5a0] shadow-[0_0_6px_rgba(0,245,160,0.8)]",
                            )}
                          />
                        )}
                        <span className="text-[11px] text-slate-400 font-medium">
                          {relativeTime(m.receivedAt)}
                        </span>
                      </div>
                    </div>

                    <p className={cn("text-xs truncate font-medium", !m.read ? "text-slate-200" : "text-slate-400")}>
                      {m.subject}
                    </p>

                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {truncate(m.snippet || "", 60)}
                    </p>
                  </div>

                  {m.hasAttachments && (
                    <Paperclip className="size-3.5 text-slate-500 shrink-0 self-center" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Bottom Link */}
      <div className="p-3 border-t border-white/[0.08] text-center mt-auto">
        <button
          type="button"
          onClick={() => onFilterChange?.("all")}
          className="text-xs font-semibold text-[#00f5a0] hover:underline"
        >
          View All Messages
        </button>
      </div>
    </div>
  );
}
