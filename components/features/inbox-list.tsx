"use client";

import { Paperclip } from "lucide-react";
import { cn, relativeTime, truncate } from "@/lib/utils";
import type { PublicMessage } from "@/types";

export function InboxList({
  messages,
  selectedId,
  onSelect,
}: {
  messages: PublicMessage[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  if (messages.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center">
        <div className="mx-auto mb-3 size-12 rounded-2xl bg-primary/10 animate-float" />
        <p className="font-medium">Nothing here yet</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
          Send a message to this address from any mailbox you own. Keep this tab open — new mail appears as soon as it is accepted.
        </p>
      </div>
    );
  }
  return (
    <ul className="divide-y rounded-2xl border bg-card overflow-hidden">
      {messages.map((m, i) => (
        <li key={m.id}>
          <button
            type="button"
            onClick={() => onSelect(m.id)}
            className={cn(
              "w-full text-left px-4 py-3 hover:bg-muted/60 transition-colors min-h-16",
              selectedId === m.id && "bg-muted",
              !m.read && "bg-primary/[0.04]",
              i === 0 && "animate-slide-up",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {!m.read ? <span className="size-2 rounded-full bg-primary shrink-0" aria-label="Unread" /> : null}
                  <p className="font-medium truncate" title={m.fromName || m.fromAddress}>
                    {m.fromName || m.fromAddress}
                  </p>
                </div>
                <p className="text-sm truncate" title={m.subject}>
                  {m.subject}
                </p>
                <p className="text-xs text-muted-foreground truncate">{truncate(m.snippet, 100)}</p>
              </div>
              <div className="shrink-0 text-right text-xs text-muted-foreground space-y-1">
                <div>{relativeTime(m.receivedAt)}</div>
                {m.hasAttachments ? <Paperclip className="size-3.5 ml-auto" /> : null}
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
