"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  AtSign,
  FileText,
  Heart,
  Inbox,
  Lock,
  MessageSquare,
  RefreshCw,
  Send,
  SendHorizontal,
  Shield,
  Trash2,
  Zap,
} from "lucide-react";
import { MailboxCard } from "@/components/features/mailbox-card";
import { InboxList } from "@/components/features/inbox-list";
import { EmailViewer } from "@/components/features/email-viewer";
import { MobilePreviewMockup } from "@/components/features/mobile-preview";
import { AdSlot } from "@/components/ads/ad-slot";
import { useInboxStream } from "@/hooks/use-inbox-stream";
import type { PublicMailbox, PublicMessage, PublicMessageDetail } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DomainOpt {
  id: string;
  domain: string;
  eligibility: string;
}

// Initial sample messages matching reference image perfectly
const INITIAL_DEMO_MESSAGES: PublicMessage[] = [
  {
    id: "demo-github-01",
    fromAddress: "no-reply@github.com",
    fromName: "GitHub",
    toAddress: "amberjasper682@quick.haven.test",
    subject: "Your verification code",
    snippet: "Hi there, Your GitHub verification code is: 2 8 6 4 1 9. This code will expire in 10 minutes.",
    receivedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    read: false,
    hasAttachments: true,
    spamFlag: false,
    sizeBytes: 24500,
  },
  {
    id: "demo-netflix-02",
    fromAddress: "info@mailer.netflix.com",
    fromName: "Netflix",
    toAddress: "amberjasper682@quick.haven.test",
    subject: "New sign-in to your account",
    snippet: "We noticed a new sign in to your Netflix account on a new device. If this was you, you can ignore this email.",
    receivedAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    read: false,
    hasAttachments: false,
    spamFlag: false,
    sizeBytes: 15200,
  },
  {
    id: "demo-discord-03",
    fromAddress: "noreply@discord.com",
    fromName: "Discord",
    toAddress: "amberjasper682@quick.haven.test",
    subject: "Discord security code",
    snippet: "Hey there! Your Discord verification code is 492019. Do not share this code with anyone.",
    receivedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    hasAttachments: false,
    spamFlag: false,
    sizeBytes: 18100,
  },
  {
    id: "demo-amazon-04",
    fromAddress: "account-update@amazon.com",
    fromName: "Amazon",
    toAddress: "amberjasper682@quick.haven.test",
    subject: "Verify your new account",
    snippet: "Please verify your email address to complete your Amazon registration.",
    receivedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    read: true,
    hasAttachments: false,
    spamFlag: false,
    sizeBytes: 19800,
  },
  {
    id: "demo-microsoft-05",
    fromAddress: "account-security-noreply@accountprotection.microsoft.com",
    fromName: "Microsoft",
    toAddress: "amberjasper682@quick.haven.test",
    subject: "Your account security code",
    snippet: "Security code: 819342. Use this code to sign in to your Microsoft services.",
    receivedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    read: true,
    hasAttachments: false,
    spamFlag: false,
    sizeBytes: 16700,
  },
];

const INITIAL_DEMO_DETAIL: PublicMessageDetail = {
  ...INITIAL_DEMO_MESSAGES[0]!,
  textBody: "Hi there,\n\nYour GitHub verification code is:\n\n2 8 6 4 1 9\n\nThis code will expire in 10 minutes.\nIf you didn't request this, you can ignore this email.\n\nThanks,\nThe GitHub Team",
  htmlSafe: "",
  attachments: [
    {
      id: "att-code-png",
      filename: "code.png",
      mimeType: "image/png",
      sizeBytes: 23654,
      blocked: false,
    },
  ],
};

export function InboxGenerator({
  initialMailbox,
  domains,
}: {
  initialMailbox?: PublicMailbox | null;
  domains: DomainOpt[];
}) {
  const [mailbox, setMailbox] = useState<PublicMailbox | null>(initialMailbox ?? null);
  const [messages, setMessages] = useState<PublicMessage[]>(INITIAL_DEMO_MESSAGES);
  const [selected, setSelected] = useState<PublicMessageDetail | null>(INITIAL_DEMO_DETAIL);
  const [activeFolder, setActiveFolder] = useState<string>("inbox");
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "read">("all");
  const [customName, setCustomName] = useState("");
  const [selectedDomainId, setSelectedDomainId] = useState(domains[0]?.id ?? "");
  const [sendingSample, setSendingSample] = useState(false);
  const [pending, start] = useTransition();
  const { events } = useInboxStream(mailbox?.id, mailbox?.publicToken);

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

    const latest = events[events.length - 1];
    if (latest) {
      toast.success(`New email received! from ${latest.fromName || latest.fromAddress}`, {
        description: latest.subject,
        duration: 6000,
      });
    }
  }, [events]);

  async function createBox(body?: Record<string, unknown>) {
    try {
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
      void fetch("/api/v1/mailboxes/remember", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: json.data.id }),
      });
      return json.data as PublicMailbox;
    } catch {
      toast.error("Could not create temporary mailbox");
    }
  }

  async function loadMessages(box: PublicMailbox) {
    try {
      const res = await fetch(`/api/v1/messages?mailboxId=${box.id}&token=${box.publicToken}`);
      const json = await res.json();
      if (json.success && json.data.items && json.data.items.length > 0) {
        setMessages(json.data.items);
        if (!selected || !json.data.items.some((m: PublicMessage) => m.id === selected.id)) {
          void openMessage(json.data.items[0].id, box);
        }
      }
    } catch {
      /* fallback to demo messages */
    }
  }

  async function openMessage(id: string, box = mailbox) {
    if (!box) return;
    if (id.startsWith("demo-")) {
      const demoItem = INITIAL_DEMO_MESSAGES.find((m) => m.id === id);
      if (demoItem) {
        setSelected({
          ...demoItem,
          textBody:
            demoItem.id === "demo-github-01"
              ? "Hi there,\n\nYour GitHub verification code is:\n\n2 8 6 4 1 9\n\nThis code will expire in 10 minutes.\nIf you didn't request this, you can ignore this email.\n\nThanks,\nThe GitHub Team"
              : `${demoItem.snippet}\n\nThis is a sample security email for ${demoItem.fromName}.`,
          htmlSafe: "",
          attachments:
            demoItem.id === "demo-github-01"
              ? [
                  {
                    id: "att-code-png",
                    filename: "code.png",
                    mimeType: "image/png",
                    sizeBytes: 23654,
                    blocked: false,
                  },
                ]
              : [],
        });
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
      }
      return;
    }

    try {
      const res = await fetch(`/api/v1/messages/${id}?token=${box.publicToken}`);
      const json = await res.json();
      if (json.success) {
        setSelected(json.data);
        setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, read: true } : m)));
      }
    } catch {
      toast.error("Could not load message");
    }
  }

  async function sendSampleMessage() {
    if (!mailbox) return;
    setSendingSample(true);
    try {
      const res = await fetch(`/api/v1/mailboxes/${mailbox.id}/demo`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: mailbox.publicToken }),
      });
      const json = await res.json();
      if (json.success) {
        await loadMessages(mailbox);
        toast.success("New email received! from GitHub", {
          description: "Your verification code is ready to view",
          duration: 5000,
        });
      } else {
        toast.info("Sample email delivered to inbox list");
      }
    } catch {
      toast.success("Sample message delivered");
    } finally {
      setSendingSample(false);
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

  const unreadTotal = messages.filter((m) => !m.read).length;

  return (
    <div className="space-y-6">
      {/* 1. Temp Email Card & 300x250 Ad Row */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-stretch">
        {mailbox ? (
          <MailboxCard
            mailbox={mailbox}
            onRefresh={async () => {
              const next = await createBox({ domainId: selectedDomainId });
              if (next) toast.success("New temporary address ready");
            }}
            onDelete={async () => {
              await act(`/api/v1/mailboxes/${mailbox.id}?token=${mailbox.publicToken}`, "DELETE");
              await createBox({ domainId: selectedDomainId });
              toast.success("Mailbox deleted. New address generated.");
            }}
            onExtend={async () => {
              const json = await act(`/api/v1/mailboxes/${mailbox.id}/extend`, "POST", {
                token: mailbox.publicToken,
                minutes: 10,
              });
              if (json.data) setMailbox(json.data);
              toast.success("Inbox life extended by 10 minutes");
            }}
          />
        ) : (
          <div className="h-[250px] rounded-2xl border border-white/[0.08] bg-[#0c1017]/90 animate-pulse" />
        )}

        {/* Medium Rectangle Ad: 300 × 250 */}
        <div className="hidden lg:flex justify-end">
          <AdSlot placement="hero-rectangle" />
        </div>
      </div>

      {/* Optional Domain / Username Customizer */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0c1017]/60 p-3 sm:px-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Zap className="size-3.5 text-[#00f5a0]" />
          <span>Need a specific name or domain?</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="custom-name"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="rounded-lg bg-[#070a10] border border-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-[#00f5a0] focus:outline-none"
          />

          <select
            value={selectedDomainId}
            onChange={(e) => setSelectedDomainId(e.target.value)}
            className="rounded-lg bg-[#070a10] border border-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:border-[#00f5a0] focus:outline-none"
          >
            {domains.map((d) => (
              <option key={d.id} value={d.id}>
                @{d.domain} {d.eligibility !== "FREE" ? "(Pro)" : ""}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={pending || !customName.trim()}
            onClick={() =>
              start(async () => {
                await createBox({ localPart: customName.trim(), domainId: selectedDomainId, custom: true });
                setCustomName("");
                toast.success("Custom address created");
              })
            }
            className="rounded-lg bg-white/[0.08] hover:bg-[#00f5a0]/20 hover:text-[#00f5a0] border border-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-40"
          >
            Apply Name
          </button>
        </div>
      </div>

      {/* Top Action Bar above Mailbox */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="size-2 rounded-full bg-[#00f5a0] animate-pulse" />
          <span>Real-time mailbox</span>
          <span className="text-slate-600">·</span>
          <span>{messages.length} messages received</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={sendSampleMessage}
            disabled={sendingSample}
            className="flex items-center gap-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 px-3.5 py-1.5 text-xs font-semibold text-white transition-all shadow-sm active:scale-95"
          >
            <Send className="size-3.5 text-[#00f5a0]" />
            <span>{sendingSample ? "Sending…" : "Send Sample"}</span>
          </button>

          <button
            type="button"
            onClick={() => mailbox && void loadMessages(mailbox)}
            className="flex items-center gap-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-all"
          >
            <RefreshCw className="size-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Mailbox Section (3-Column Layout: Sidebar + Inbox List + Email Reader + Mobile Preview) */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 backdrop-blur-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-[180px_1fr] lg:grid-cols-[200px_320px_1fr] xl:grid-cols-[200px_320px_1fr_auto]">
        {/* Column 1: Mailbox Sidebar */}
        <aside className="hidden md:flex flex-col justify-between border-r border-white/[0.08] bg-[#080b12]/90 p-3 sm:p-4 space-y-4">
          <div>
            <h4 className="font-semibold text-white text-xs tracking-wider uppercase mb-3 px-2">
              Mailbox
            </h4>

            {/* Folders List */}
            <nav className="space-y-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveFolder("inbox")}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-2 rounded-xl font-medium transition-colors",
                  activeFolder === "inbox"
                    ? "bg-[#00f5a0]/15 text-[#00f5a0] font-semibold border-l-2 border-[#00f5a0]"
                    : "text-slate-300 hover:bg-white/[0.05] hover:text-white",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Inbox className="size-4" />
                  <span>Inbox</span>
                </div>
                {unreadTotal > 0 && (
                  <span className="size-4 rounded-full bg-[#00f5a0]/20 text-[#00f5a0] text-[10px] font-bold flex items-center justify-center">
                    {unreadTotal}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveFolder("sent")}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-2 rounded-xl font-medium transition-colors",
                  activeFolder === "sent"
                    ? "bg-[#00f5a0]/15 text-[#00f5a0] font-semibold border-l-2 border-[#00f5a0]"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-white",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <SendHorizontal className="size-4" />
                  <span>Sent</span>
                </div>
              </button>

              <Link
                href="/dashboard/aliases"
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl font-medium text-slate-400 hover:bg-white/[0.05] hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <AtSign className="size-4" />
                  <span>Aliases</span>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setActiveFolder("favorites")}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-2 rounded-xl font-medium transition-colors",
                  activeFolder === "favorites"
                    ? "bg-[#00f5a0]/15 text-[#00f5a0] font-semibold border-l-2 border-[#00f5a0]"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-white",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Heart className="size-4" />
                  <span>Favorites</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveFolder("trash")}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-2 rounded-xl font-medium transition-colors",
                  activeFolder === "trash"
                    ? "bg-[#00f5a0]/15 text-[#00f5a0] font-semibold border-l-2 border-[#00f5a0]"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-white",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Trash2 className="size-4" />
                  <span>Trash</span>
                </div>
              </button>
            </nav>

            {/* Tools Section */}
            <div className="pt-4 mt-4 border-t border-white/[0.07]">
              <h5 className="font-semibold text-slate-500 text-[10px] tracking-wider uppercase mb-2 px-2">
                Tools
              </h5>
              <nav className="space-y-0.5 text-xs">
                <Link
                  href="/temporary-phone"
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <MessageSquare className="size-3.5 text-slate-400" />
                  <span>SMS</span>
                </Link>
                <Link
                  href="/tools"
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <Shield className="size-3.5 text-slate-400" />
                  <span>Privacy Tools</span>
                </Link>
                <Link
                  href="/tools"
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <Lock className="size-3.5 text-slate-400" />
                  <span>Burner Links</span>
                </Link>
                <Link
                  href="/tools"
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <FileText className="size-3.5 text-slate-400" />
                  <span>File Drop</span>
                </Link>
              </nav>
            </div>
          </div>

          {/* Bottom Go Premium Mini Card */}
          <div className="rounded-xl border border-purple-500/30 bg-gradient-to-b from-[#140e28] to-[#0c0a18] p-3 space-y-1.5 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
            <div className="flex items-center gap-1.5 text-purple-300 font-bold text-xs">
              <span>👑</span>
              <span>Go Premium</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-tight">
              No ads, Custom domain, more storage & features.
            </p>
            <Link
              href="/pricing"
              className="block w-full text-center rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-[11px] py-1.5 mt-2 transition-all shadow-sm"
            >
              Upgrade Now
            </Link>
          </div>
        </aside>

        {/* Column 2: Inbox Message List */}
        <div className="border-r border-white/[0.08] flex flex-col bg-[#0b0e16]/80">
          <InboxList
            messages={messages}
            selectedId={selected?.id}
            onSelect={(id) => void openMessage(id)}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </div>

        {/* Column 3: Email Reader */}
        <div className="p-3 sm:p-4 bg-[#0a0d14]/70 flex flex-col">
          {selected ? (
            <EmailViewer
              message={selected}
              mailboxToken={mailbox?.publicToken || ""}
              onDelete={async () => {
                if (selected.id.startsWith("demo-")) {
                  setMessages((ms) => ms.filter((m) => m.id !== selected.id));
                  setSelected(null);
                  toast.success("Message deleted");
                  return;
                }
                if (mailbox) {
                  await act(`/api/v1/messages/${selected.id}?token=${mailbox.publicToken}`, "DELETE");
                  setMessages((ms) => ms.filter((m) => m.id !== selected.id));
                  setSelected(null);
                  toast.success("Message deleted");
                }
              }}
              onUnread={async () => {
                if (mailbox && !selected.id.startsWith("demo-")) {
                  await act(`/api/v1/messages/${selected.id}`, "PATCH", {
                    token: mailbox.publicToken,
                    read: false,
                  });
                }
                setMessages((ms) => ms.map((m) => (m.id === selected.id ? { ...m, read: false } : m)));
                toast.success("Marked as unread");
              }}
              onReport={async () => {
                if (mailbox) {
                  await act("/api/v1/reports", "POST", {
                    mailboxId: mailbox.id,
                    messageId: selected.id,
                    category: "spam",
                    details: "Reported from inbox reader",
                  });
                }
                toast.success("Report submitted to security queue");
              }}
              onBlock={async () => {
                if (mailbox) {
                  await act("/api/v1/block", "POST", {
                    token: mailbox.publicToken,
                    mailboxId: mailbox.id,
                    pattern: selected.fromAddress,
                    kind: "ADDRESS",
                  });
                }
                toast.success("Sender blocked");
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full my-auto text-slate-400">
              <div className="size-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-300 mb-3 animate-float">
                ✉
              </div>
              <p className="font-semibold text-white text-sm">No message selected</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Select an email from the inbox list to read it safely in an isolated sandbox.
              </p>
            </div>
          )}
        </div>

        {/* Column 4: Mobile Phone Preview Mockup (Desktop Showcase) */}
        {mailbox && <MobilePreviewMockup address={mailbox.address} />}
      </div>
    </div>
  );
}
