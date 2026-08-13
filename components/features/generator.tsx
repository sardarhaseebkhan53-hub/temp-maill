"use client";

import { useEffect, useState, useTransition } from "react";
import { MailboxCard } from "@/components/features/mailbox-card";
import { InboxList } from "@/components/features/inbox-list";
import { EmailViewer } from "@/components/features/email-viewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useInboxStream } from "@/hooks/use-inbox-stream";
import type { PublicMailbox, PublicMessage, PublicMessageDetail } from "@/types";
import { toast } from "sonner";

interface DomainOpt {
  id: string;
  domain: string;
  eligibility: string;
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
  const [custom, setCustom] = useState("");
  const [domainId, setDomainId] = useState(domains[0]?.id ?? "");
  const [pending, start] = useTransition();
  const { events, connected } = useInboxStream(mailbox?.id, mailbox?.publicToken);

  useEffect(() => {
    if (!mailbox && !initialMailbox) {
      void createBox();
    } else if (mailbox) {
      void fetch("/api/v1/mailboxes/remember", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: mailbox.id }),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mailbox) void loadMessages(mailbox);
    // loadMessages is stable enough for this list refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mailbox?.id]);

  useEffect(() => {
    if (!events.length) return;
    setMessages((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const e of events) map.set(e.id, e);
      return [...map.values()].sort((a, b) => +new Date(b.receivedAt) - +new Date(a.receivedAt));
    });
    setMailbox((current) =>
      current
        ? { ...current, unreadCount: current.unreadCount + 1, messageCount: current.messageCount + 1 }
        : current,
    );
  }, [events]);

  async function createBox(body?: Record<string, unknown>) {
    const res = await fetch("/api/v1/mailboxes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    const json = await res.json();
    if (!json.success) {
      toast.error(json.error?.message || "Could not create inbox");
      return;
    }
    setMailbox(json.data);
    setSelected(null);
    void fetch("/api/v1/mailboxes/remember", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: json.data.id }),
    });
    return json.data as PublicMailbox;
  }

  async function loadMessages(box: PublicMailbox) {
    const res = await fetch(`/api/v1/messages?mailboxId=${box.id}&token=${box.publicToken}`);
    const json = await res.json();
    if (json.success) setMessages(json.data.items);
  }

  async function openMessage(id: string) {
    if (!mailbox) return;
    const res = await fetch(`/api/v1/messages/${id}?token=${mailbox.publicToken}`);
    const json = await res.json();
    if (json.success) {
      setSelected(json.data);
      setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, read: true } : m)));
    }
  }

  async function act(path: string, method = "POST", body?: unknown) {
    const res = await fetch(path, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      throw new Error(json.error?.message || "Request failed");
    }
    return json;
  }

  if (!mailbox) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MailboxCard
        mailbox={mailbox}
        onRefresh={async () => {
          const next = await createBox({ domainId });
          if (next) toast.success("New address ready");
        }}
        onDelete={async () => {
          await act(`/api/v1/mailboxes/${mailbox.id}?token=${mailbox.publicToken}`, "DELETE");
          await createBox({ domainId });
        }}
        onExtend={async () => {
          const json = await act(`/api/v1/mailboxes/${mailbox.id}/extend`, "POST", {
            token: mailbox.publicToken,
            minutes: 10,
          });
          if (json.data) setMailbox(json.data);
          toast.success("Extended");
        }}
      />

      <div className="rounded-2xl border bg-card p-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Input
          placeholder="Custom username"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          aria-label="Custom username"
        />
        <Select value={domainId} onChange={(e) => setDomainId(e.target.value)} aria-label="Domain">
          {domains.map((d) => (
            <option key={d.id} value={d.id}>
              @{d.domain}
              {d.eligibility !== "FREE" ? " · premium" : ""}
            </option>
          ))}
        </Select>
        <Button
          loading={pending}
          onClick={() =>
            start(async () => {
              await createBox({ localPart: custom, domainId, custom: true });
            })
          }
        >
          Use this name
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{connected ? "Live" : "Reconnecting…"} · {messages.length} messages</p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              await act(`/api/v1/mailboxes/${mailbox.id}/demo`, "POST", { token: mailbox.publicToken });
              await loadMessages(mailbox);
              toast.success("Sample message delivered");
            }}
          >
            Send a sample message
          </Button>
          <Button size="sm" variant="ghost" onClick={() => loadMessages(mailbox)}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <InboxList messages={messages} selectedId={selected?.id} onSelect={(id) => void openMessage(id)} />
        {selected ? (
          <EmailViewer
            message={selected}
            mailboxToken={mailbox.publicToken}
            onDelete={async () => {
              await act(`/api/v1/messages/${selected.id}?token=${mailbox.publicToken}`, "DELETE");
              setMessages((ms) => ms.filter((m) => m.id !== selected.id));
              setSelected(null);
            }}
            onUnread={async () => {
              await act(`/api/v1/messages/${selected.id}`, "PATCH", { token: mailbox.publicToken, read: false });
            }}
            onReport={async () => {
              await act("/api/v1/reports", "POST", {
                mailboxId: mailbox.id,
                messageId: selected.id,
                category: "spam",
                details: "Reported from inbox",
              });
              toast.success("Report sent");
            }}
            onBlock={async () => {
              await act("/api/v1/block", "POST", {
                token: mailbox.publicToken,
                mailboxId: mailbox.id,
                pattern: selected.fromAddress,
                kind: "ADDRESS",
              });
              toast.success("Sender blocked");
            }}
          />
        ) : (
          <div className="hidden lg:flex rounded-2xl border border-dashed items-center justify-center text-sm text-muted-foreground min-h-48">
            Select a message to read it safely
          </div>
        )}
      </div>
    </div>
  );
}
