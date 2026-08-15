"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { RefreshCw, Zap } from "lucide-react";
import { MailboxCard } from "@/components/features/mailbox-card";
import { InboxList } from "@/components/features/inbox-list";
import { EmailViewer } from "@/components/features/email-viewer";
import { MobileMessageReader } from "@/components/features/mobile-message-reader";
import { useInboxStream } from "@/hooks/use-inbox-stream";
import type { PublicMailbox, PublicMessage, PublicMessageDetail } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DomainOpt {
  id: string;
  domain: string;
  eligibility: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { message?: string };
}

interface MessagePage {
  items: PublicMessage[];
  nextCursor: string | null;
}

interface MailboxAccess {
  id: string;
  publicToken: string;
}

export function InboxGenerator({
  initialMailbox,
  domains,
}: {
  initialMailbox?: PublicMailbox | null;
  domains: DomainOpt[];
}) {
  const [mailbox, setMailbox] = useState<PublicMailbox | null>(initialMailbox ?? null);
  const [messages, setMessages] = useState<PublicMessage[]>([]);
  const [selected, setSelected] = useState<PublicMessageDetail | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "read">("all");
  const [customName, setCustomName] = useState("");
  const [selectedDomainId, setSelectedDomainId] = useState(domains[0]?.id ?? "");
  const [messagesLoading, setMessagesLoading] = useState(
    Boolean(initialMailbox && initialMailbox.messageCount > 0),
  );
  const [pending, start] = useTransition();
  const loadSequence = useRef(0);
  const notifiedMessageIds = useRef(new Set<string>());
  const { events, connected } = useInboxStream(mailbox?.id, mailbox?.publicToken);

  const rememberBox = useCallback(async (id: string) => {
    await fetch("/api/v1/mailboxes/remember", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }, []);

  const createBox = useCallback(
    async (body?: Record<string, unknown>) => {
      try {
        const res = await fetch("/api/v1/mailboxes", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body ?? {}),
        });
        const json = (await res.json()) as ApiEnvelope<PublicMailbox>;
        if (!res.ok || !json.success || !json.data) {
          toast.error(json.error?.message || "Could not create inbox");
          return null;
        }

        loadSequence.current += 1;
        notifiedMessageIds.current.clear();
        setMessages([]);
        setSelected(null);
        setActiveFilter("all");
        setMessagesLoading(false);
        setMailbox(json.data);
        void rememberBox(json.data.id);
        return json.data;
      } catch {
        toast.error("Could not create temporary mailbox");
        return null;
      }
    },
    [rememberBox],
  );

  const loadMessages = useCallback(async (box: MailboxAccess, showLoading = true) => {
    const sequence = ++loadSequence.current;
    if (showLoading) setMessagesLoading(true);

    try {
      const [messagesRes, mailboxRes] = await Promise.all([
        fetch(`/api/v1/messages?mailboxId=${box.id}&token=${box.publicToken}&limit=100`, {
          cache: "no-store",
        }),
        fetch(`/api/v1/mailboxes/${box.id}?token=${box.publicToken}`, { cache: "no-store" }),
      ]);
      const messagesJson = (await messagesRes.json()) as ApiEnvelope<MessagePage>;
      const mailboxJson = (await mailboxRes.json()) as ApiEnvelope<PublicMailbox>;

      if (sequence !== loadSequence.current) return;

      if (messagesRes.ok && messagesJson.success && messagesJson.data) {
        const realMessages = messagesJson.data.items;
        for (const item of realMessages) notifiedMessageIds.current.add(item.id);
        setMessages(realMessages);
        setSelected((current) =>
          current && realMessages.some((message) => message.id === current.id) ? current : null,
        );
      } else {
        setMessages([]);
        setSelected(null);
        toast.error(messagesJson.error?.message || "Could not refresh inbox");
      }

      if (mailboxRes.ok && mailboxJson.success && mailboxJson.data) {
        setMailbox((current) => (current?.id === box.id ? mailboxJson.data ?? current : current));
      }
    } catch {
      if (sequence === loadSequence.current) {
        setMessages([]);
        setSelected(null);
        toast.error("Could not refresh inbox");
      }
    } finally {
      if (sequence === loadSequence.current) setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialMailbox) {
      void rememberBox(initialMailbox.id);
      return;
    }
    void createBox();
  }, [createBox, initialMailbox, rememberBox]);

  const mailboxId = mailbox?.id;
  const mailboxToken = mailbox?.publicToken;

  useEffect(() => {
    if (!mailboxId || !mailboxToken) return;
    setMessages([]);
    setSelected(null);
    setActiveFilter("all");
    void loadMessages({ id: mailboxId, publicToken: mailboxToken }, false);
  }, [loadMessages, mailboxId, mailboxToken]);

  useEffect(() => {
    if (!mailbox || events.length === 0) return;
    const fresh = events.filter(
      (event) =>
        event.toAddress.toLowerCase() === mailbox.address.toLowerCase() &&
        !notifiedMessageIds.current.has(event.id),
    );
    if (fresh.length === 0) return;

    for (const event of fresh) notifiedMessageIds.current.add(event.id);
    void loadMessages(mailbox);

    const latest = fresh[0];
    if (latest) {
      toast.success(`New email from ${latest.fromName || latest.fromAddress}`, {
        description: latest.subject,
        duration: 6000,
      });
    }
  }, [events, loadMessages, mailbox]);

  async function openMessage(id: string, box = mailbox) {
    if (!box) return;
    try {
      const wasUnread = messages.some((message) => message.id === id && !message.read);
      const res = await fetch(`/api/v1/messages/${id}?token=${box.publicToken}`, { cache: "no-store" });
      const json = (await res.json()) as ApiEnvelope<PublicMessageDetail>;
      if (!res.ok || !json.success || !json.data) {
        toast.error(json.error?.message || "Could not load message");
        return;
      }

      const detail = { ...json.data, read: true };
      setSelected(detail);
      setMessages((current) =>
        current.map((message) => (message.id === id ? { ...message, read: true } : message)),
      );
      if (wasUnread) {
        setMailbox((current) =>
          current ? { ...current, unreadCount: Math.max(0, current.unreadCount - 1) } : current,
        );
      }
    } catch {
      toast.error("Could not load message");
    }
  }

  async function act(path: string, method = "POST", body?: unknown) {
    const res = await fetch(path, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = (await res.json().catch(() => ({}))) as ApiEnvelope<unknown>;
    if (!res.ok || json.success === false) {
      throw new Error(json.error?.message || "Request failed");
    }
    return json;
  }

  async function copyAddress() {
    if (!mailbox) return;
    try {
      await navigator.clipboard.writeText(mailbox.address);
      toast.success("Email address copied");
    } catch {
      toast.error("Could not copy the address");
    }
  }

  // Message actions are shared between the desktop reader pane and the
  // mobile full-screen reader, so both expose identical behaviour.
  async function deleteSelectedMessage() {
    if (!mailbox || !selected) return;
    await act(`/api/v1/messages/${selected.id}?token=${mailbox.publicToken}`, "DELETE");
    setMessages((current) => current.filter((message) => message.id !== selected.id));
    setMailbox((current) =>
      current
        ? {
            ...current,
            messageCount: Math.max(0, current.messageCount - 1),
            unreadCount: Math.max(0, current.unreadCount - (selected.read ? 0 : 1)),
          }
        : current,
    );
    setSelected(null);
    toast.success("Message deleted");
  }

  async function markSelectedUnread() {
    if (!mailbox || !selected || !selected.read) return;
    await act(`/api/v1/messages/${selected.id}`, "PATCH", {
      token: mailbox.publicToken,
      read: false,
    });
    setMessages((current) =>
      current.map((message) =>
        message.id === selected.id ? { ...message, read: false } : message,
      ),
    );
    setSelected((current) => (current ? { ...current, read: false } : current));
    setMailbox((current) =>
      current ? { ...current, unreadCount: current.unreadCount + 1 } : current,
    );
    toast.success("Marked as unread");
  }

  async function reportSelectedMessage() {
    if (!mailbox || !selected) return;
    await act("/api/v1/reports", "POST", {
      mailboxId: mailbox.id,
      messageId: selected.id,
      category: "spam",
      details: "Reported from inbox reader",
    });
    toast.success("Report submitted to security queue");
  }

  async function blockSelectedSender() {
    if (!mailbox || !selected) return;
    await act("/api/v1/block", "POST", {
      token: mailbox.publicToken,
      mailboxId: mailbox.id,
      pattern: selected.fromAddress,
      kind: "ADDRESS",
    });
    toast.success("Sender blocked");
  }

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      {mailbox ? (
        <MailboxCard
          mailbox={mailbox}
          live={connected}
          onRefresh={async () => {
            const next = await createBox({ domainId: selectedDomainId });
            if (next) toast.success("New temporary address ready");
          }}
          onDelete={async () => {
            await act(`/api/v1/mailboxes/${mailbox.id}?token=${mailbox.publicToken}`, "DELETE");
            const next = await createBox({ domainId: selectedDomainId });
            if (next) toast.success("Mailbox deleted. New address generated.");
          }}
          onExtend={async () => {
            const json = await act(`/api/v1/mailboxes/${mailbox.id}/extend`, "POST", {
              token: mailbox.publicToken,
              minutes: 10,
            });
            const updated = json.data as PublicMailbox | undefined;
            if (updated) setMailbox(updated);
            toast.success("Inbox life extended by 10 minutes");
          }}
        />
      ) : (
        <div
          className="h-[250px] w-full animate-pulse rounded-2xl border border-white/[0.08] bg-[#0c1017]/90"
          aria-label="Preparing your temporary email"
        />
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-[#0c1017]/75 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="flex min-w-0 items-center gap-2 text-xs text-slate-400">
          <span
            className={`size-2 shrink-0 rounded-full ${connected ? "bg-[#00f5a0] shadow-[0_0_7px_rgba(0,245,160,0.7)]" : "bg-amber-400"}`}
          />
          <span>{connected ? "Live inbox connected" : "Inbox refresh active"}</span>
          <span className="text-slate-600">·</span>
          <span className="whitespace-nowrap">
            {mailbox?.messageCount ?? 0} {(mailbox?.messageCount ?? 0) === 1 ? "message" : "messages"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => mailbox && void loadMessages(mailbox)}
          disabled={!mailbox || messagesLoading}
          className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.1] hover:text-white disabled:cursor-wait disabled:opacity-60 sm:min-h-0 sm:w-auto"
        >
          <RefreshCw className={`size-3.5 ${messagesLoading ? "animate-spin" : ""}`} />
          <span>{messagesLoading ? "Refreshing…" : "Refresh inbox"}</span>
        </button>
      </div>

      <section
        aria-label="Temporary email inbox"
        className="min-w-0 rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 shadow-2xl backdrop-blur-2xl"
      >
        {messages.length === 0 ? (
          <InboxList
            messages={messages}
            messageCount={mailbox?.messageCount ?? 0}
            unreadCount={mailbox?.unreadCount ?? 0}
            mailboxAddress={mailbox?.address}
            loading={messagesLoading}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onSelect={(id) => void openMessage(id)}
            onCopyAddress={() => void copyAddress()}
          />
        ) : (
          <div className="grid min-w-0 grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)]">
            <div
              className={cn(
                "min-w-0 border-b border-white/[0.08] bg-[#0b0e16]/80 xl:border-b-0 xl:border-r",
                // On mobile the reader takes over the full screen instead of
                // living under the list, so hide the list while one is open.
                selected && "max-xl:hidden",
              )}
            >
              <InboxList
                messages={messages}
                messageCount={mailbox?.messageCount ?? messages.length}
                unreadCount={mailbox?.unreadCount ?? messages.filter((message) => !message.read).length}
                mailboxAddress={mailbox?.address}
                loading={messagesLoading}
                selectedId={selected?.id}
                onSelect={(id) => void openMessage(id)}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                onCopyAddress={() => void copyAddress()}
              />
            </div>

            {/* Desktop/tablet-wide reader pane; phones get the full-screen
                reader below instead of this stacked column. */}
            <div className="hidden min-w-0 bg-[#0a0d14]/70 p-3 sm:p-4 xl:block">
              {selected ? (
                <EmailViewer
                  key={selected.id}
                  message={selected}
                  mailboxToken={mailbox?.publicToken || ""}
                  onDelete={() => void deleteSelectedMessage()}
                  onUnread={() => void markSelectedUnread()}
                  onReport={() => void reportSelectedMessage()}
                  onBlock={() => void blockSelectedSender()}
                />
              ) : (
                <div className="flex min-h-72 flex-col items-center justify-center p-6 text-center text-slate-400 sm:p-12">
                  <div className="mb-3 flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-slate-300">
                    ✉
                  </div>
                  <p className="text-sm font-semibold text-white">Choose a message to read</p>
                  <p className="mt-1 max-w-xs text-xs text-slate-400">
                    Message content opens in a sanitized, isolated reader.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Phones open messages into a dedicated full-screen reader with a
            real back action instead of squeezing the multi-pane layout. */}
        {selected ? (
          <MobileMessageReader
            key={`mobile-${selected.id}`}
            message={selected}
            mailboxToken={mailbox?.publicToken || ""}
            onBack={() => setSelected(null)}
            onDelete={() => void deleteSelectedMessage()}
            onUnread={() => void markSelectedUnread()}
            onReport={() => void reportSelectedMessage()}
            onBlock={() => void blockSelectedSender()}
          />
        ) : null}
      </section>

      <section className="flex min-w-0 flex-col gap-3 rounded-xl border border-white/[0.06] bg-[#0c1017]/60 p-3 text-xs sm:p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-slate-300">
          <Zap className="size-3.5 shrink-0 text-[#00f5a0]" />
          <span>Need a specific name or domain?</span>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:w-auto">
          <input
            type="text"
            placeholder="custom-name"
            value={customName}
            onChange={(event) => setCustomName(event.target.value)}
            className="min-w-0 rounded-lg border border-slate-800 bg-[#070a10] px-3 py-2.5 text-base text-white placeholder:text-slate-500 focus:border-[#00f5a0] focus:outline-none sm:py-2 sm:text-xs"
          />

          <select
            value={selectedDomainId}
            onChange={(event) => setSelectedDomainId(event.target.value)}
            className="min-w-0 rounded-lg border border-slate-800 bg-[#070a10] px-2.5 py-2.5 text-base text-slate-200 focus:border-[#00f5a0] focus:outline-none sm:py-2 sm:text-xs"
          >
            {domains.map((domain) => (
              <option key={domain.id} value={domain.id}>
                @{domain.domain} {domain.eligibility !== "FREE" ? "(Pro)" : ""}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={pending || !customName.trim()}
            onClick={() =>
              start(async () => {
                const next = await createBox({
                  localPart: customName.trim(),
                  domainId: selectedDomainId,
                  custom: true,
                });
                if (next) {
                  setCustomName("");
                  toast.success("Custom address created");
                }
              })
            }
            className="min-h-11 rounded-lg border border-white/10 bg-white/[0.08] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#00f5a0]/20 hover:text-[#00f5a0] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0"
          >
            {pending ? "Applying…" : "Apply name"}
          </button>
        </div>
      </section>
    </div>
  );
}
