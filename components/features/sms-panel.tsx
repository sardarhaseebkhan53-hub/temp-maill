"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Check,
  Clock,
  Copy,
  MessageSquareText,
  Phone,
  Plus,
  QrCode,
  RefreshCw,
  Share2,
  Smartphone,
  Trash2,
} from "lucide-react";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { OtpCodeCard } from "@/components/features/otp-code-card";
import { useClipboard } from "@/hooks/use-clipboard";
import { cn, relativeTime } from "@/lib/utils";
import { toast } from "sonner";

interface NumberRow {
  id: string;
  e164: string;
  country: string;
  status: string;
  expiresAt: string;
  /** Returned once at assignment; required for all subsequent access. */
  publicToken?: string;
}

interface SmsRow {
  id: string;
  fromNumber: string;
  body: string;
  detectedCode: string | null;
  read: boolean;
  receivedAt: string;
}

interface AvailableRow {
  e164: string;
  country: string;
}

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  PK: "Pakistan",
  DE: "Germany",
  FR: "France",
  NL: "Netherlands",
  AU: "Australia",
  IN: "India",
  ES: "Spain",
};

const STORAGE_KEY = "haven_sms_assignment";
const POLL_MS = 12_000; // Same cadence as the email polling fallback.

function loadStored(): NumberRow | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NumberRow;
    if (!parsed?.id || !parsed.publicToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveStored(row: NumberRow | null) {
  try {
    if (row) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(row));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode */
  }
}

export function SmsPanel() {
  const { copied, copy } = useClipboard();
  const [countries, setCountries] = useState<string[]>([]);
  const [country, setCountry] = useState("");
  const [num, setNum] = useState<NumberRow | null>(null);
  const [messages, setMessages] = useState<SmsRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const unauthenticated = Boolean(num && !num.publicToken);

  // Available countries from the configured provider — never hardcoded.
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/v1/sms/numbers");
        const json = (await res.json()) as { success: boolean; data?: AvailableRow[] };
        if (json.success && json.data) {
          setCountries([...new Set(json.data.map((n) => n.country))].sort());
        }
      } catch {
        /* provider list unavailable; the assign call will surface the error */
      }
    })();
  }, []);

  // Restore this browser-tab's assignment after a reload.
  useEffect(() => {
    const stored = loadStored();
    if (!stored) return;
    if (new Date(stored.expiresAt).getTime() <= Date.now()) {
      saveStored(null);
      return;
    }
    setNum(stored);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const loadMessages = useCallback(
    async (row: NumberRow, silent = true) => {
      if (!row.publicToken) return;
      try {
        const res = await fetch(
          `/api/v1/sms/numbers/${row.id}/messages?token=${encodeURIComponent(row.publicToken)}`,
          { cache: "no-store" },
        );
        const json = (await res.json()) as { success: boolean; data?: SmsRow[] };
        if (json.success && json.data) {
          setMessages((current) => {
            const fresh = json.data!.filter((m) => !current.some((c) => c.id === m.id));
            if (fresh.length > 0 && current.length > 0) {
              const latest = fresh[0]!;
              toast.success(`New SMS from ${latest.fromNumber}`, {
                description: latest.detectedCode ? `Code detected: ${latest.detectedCode}` : latest.body.slice(0, 90),
                duration: 6000,
              });
            }
            return json.data!;
          });
        } else if (!silent) {
          toast.error("Could not refresh SMS inbox");
        }
      } catch {
        if (!silent) toast.error("Could not refresh SMS inbox");
      }
    },
    [],
  );

  // Poll while an assignment is live — mirrors the email polling fallback.
  useEffect(() => {
    if (!num) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    void loadMessages(num);
    pollRef.current = setInterval(() => {
      if (document.visibilityState === "visible") void loadMessages(num);
      // A clock tick keeps the countdown honest even when the tab sleeps.
      setNow(Date.now());
    }, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [num, loadMessages]);

  async function run(name: string, action: () => Promise<void>) {
    setBusy(name);
    try {
      await action();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  async function assign() {
    await run("assign", async () => {
      const res = await fetch("/api/v1/sms/numbers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ country: country || undefined }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "No numbers available");
      const row = json.data as NumberRow;
      if (num) await expire(num, { silent: true });
      setNum(row);
      setMessages([]);
      saveStored(row);
      toast.success("Temporary number assigned");
    });
  }

  async function expire(target: NumberRow, opts: { silent?: boolean } = {}) {
    if (!target.publicToken) return;
    try {
      await fetch(`/api/v1/sms/numbers/${target.id}?token=${encodeURIComponent(target.publicToken)}`, {
        method: "DELETE",
      });
    } catch {
      /* the number expires server-side regardless */
    }
    if (!opts.silent) {
      setNum(null);
      setMessages([]);
      saveStored(null);
      toast.success("Number released");
    }
  }

  async function extend() {
    const token = num?.publicToken;
    if (!num || !token) return;
    await run("extend", async () => {
      const res = await fetch(`/api/v1/sms/numbers/${num.id}/extend`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, minutes: 10 }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Could not extend");
      const next = { ...num, expiresAt: json.data.expiresAt as string };
      setNum(next);
      saveStored(next);
      toast.success("Number life extended by 10 minutes");
    });
  }

  async function showQr() {
    const token = num?.publicToken;
    if (!num || !token) return;
    await run("qr", async () => {
      const res = await fetch(`/api/v1/sms/numbers/${num.id}/qr?token=${encodeURIComponent(token)}`);
      const json = await res.json();
      if (!json.success || !json.data?.dataUrl) throw new Error(json.error?.message || "Could not create QR code");
      setQr(json.data.dataUrl as string);
    });
  }

  async function share() {
    if (!num) return;
    const data = { title: "Haven temporary number", text: num.e164, url: window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch {
        /* user cancelled */
      }
    }
    await copy(num.e164, "Number copied to clipboard");
  }

  const remaining = num ? Math.max(0, new Date(num.expiresAt).getTime() - now) : 0;
  const totalSeconds = Math.floor(remaining / 1000);
  const timeFormatted = `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
  const live = Boolean(num && remaining > 0 && num.status === "ASSIGNED");

  return (
    <div className="min-w-0 space-y-4">
      {/* ── Assignment card ─────────────────────────────────────────── */}
      <div className="relative min-w-0 overflow-hidden rounded-2xl border border-[#38bdf8]/30 bg-[#0c1017]/95 p-4 shadow-[0_0_40px_rgba(56,189,248,0.1)] backdrop-blur-2xl sm:p-5">
        <div className="pointer-events-none absolute -right-24 -top-24 size-48 rounded-full bg-[#38bdf8]/10 blur-3xl" />

        <div className="relative mb-3.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="size-2 shrink-0 rounded-full bg-[#38bdf8] shadow-[0_0_8px_rgba(56,189,248,0.9)]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 sm:text-xs">
              Your temporary phone number
            </span>
          </div>
          {num ? (
            <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#38bdf8]/20 bg-[#38bdf8]/10 px-2.5 py-1 font-mono text-xs font-medium text-[#38bdf8]">
              <Clock className="size-3.5" aria-hidden="true" />
              <span>{remaining > 0 ? `Expires in ${timeFormatted}` : "Expired"}</span>
            </div>
          ) : null}
        </div>

        {num ? (
          <>
            <div className="group relative flex min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-800/90 bg-[#070a10] px-3 py-3 sm:gap-3 sm:px-4 sm:py-4">
              <button
                type="button"
                onClick={() => copy(num.e164, "Number copied")}
                className="min-w-0 flex-1 break-all text-left font-mono text-lg font-bold tracking-tight text-white xs:text-xl sm:text-2xl"
                title="Copy phone number"
              >
                {num.e164}
              </button>
              <button
                type="button"
                onClick={() => copy(num.e164, "Number copied")}
                className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg bg-white/[0.06] px-2.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-[#38bdf8]/20 hover:text-[#38bdf8] sm:px-3"
                aria-label="Copy phone number"
              >
                {copied ? <Check className="size-4 text-[#38bdf8]" /> : <Copy className="size-4" />}
                <span className="hidden xs:inline">{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <p className="mt-2 text-[11px] font-medium text-slate-400">
              {live
                ? "Texts sent to this number appear below in real time."
                : "This assignment has expired — get a new number to keep receiving SMS."}
            </p>

            <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => copy(num.e164, "Number copied")}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/[0.12]"
              >
                {copied ? <Check className="size-3.5 text-[#38bdf8]" /> : <Copy className="size-3.5" />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
              <button
                type="button"
                disabled={busy === "qr" || unauthenticated}
                onClick={showQr}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/[0.12] disabled:opacity-50"
              >
                <QrCode className="size-3.5 text-slate-300" />
                <span>QR code</span>
              </button>
              <button
                type="button"
                onClick={share}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/[0.12]"
              >
                <Share2 className="size-3.5 text-slate-300" />
                <span>Share</span>
              </button>
              <button
                type="button"
                disabled={busy === "assign"}
                onClick={assign}
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-[#38bdf8]/30 bg-[#38bdf8]/15 px-3 py-2.5 text-xs font-bold text-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.15)] transition-colors hover:bg-[#38bdf8]/25 disabled:opacity-60"
              >
                {busy === "assign" ? <RefreshCw className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                <span>New number</span>
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-3">
              <button
                type="button"
                disabled={busy === "extend" || !live || unauthenticated}
                onClick={extend}
                className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/[0.08] disabled:opacity-50"
              >
                <Clock className="size-3.5 text-[#38bdf8]" />
                <span>{busy === "extend" ? "Extending…" : "Extend"}</span>
              </button>
              <button
                type="button"
                disabled={busy === "expire" || unauthenticated}
                onClick={() => run("expire", async () => expire(num))}
                className="flex min-h-11 items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-60"
              >
                <Trash2 className="size-3.5" />
                <span>{busy === "expire" ? "Releasing…" : "Expire now"}</span>
              </button>
            </div>

            {countries.length > 0 ? (
              <div className="mt-4 flex min-w-0 flex-col gap-2 border-t border-white/[0.07] pt-3 sm:flex-row sm:items-center">
                <span className="text-xs text-slate-400">Country for the next number:</span>
                <Select
                  aria-label="Country for the next number"
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  className="min-w-0 max-w-full sm:max-w-xs"
                >
                  <option value="">First available</option>
                  {countries.map((code) => (
                    <option key={code} value={code}>
                      {COUNTRY_NAMES[code] ?? code}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}
          </>
        ) : (
          <div className="relative flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-[#38bdf8]/25 bg-[#38bdf8]/10 text-[#38bdf8]">
              <Smartphone className="size-5" aria-hidden="true" />
            </div>
            <div className="max-w-sm">
              <p className="text-sm font-semibold text-white">Get a real temporary number</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Numbers come from the configured carrier and expire automatically. If none are
                available Haven says so — it never invents one.
              </p>
            </div>
            {countries.length > 0 ? (
              <Select
                aria-label="Country"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                className="min-w-0 max-w-full sm:max-w-xs"
              >
                <option value="">First available country</option>
                {countries.map((code) => (
                  <option key={code} value={code}>
                    {COUNTRY_NAMES[code] ?? code}
                  </option>
                ))}
              </Select>
            ) : null}
            <button
              type="button"
              disabled={busy === "assign"}
              onClick={assign}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#38bdf8] px-6 py-3 text-sm font-bold text-[#06121f] shadow-[0_0_24px_rgba(56,189,248,0.28)] transition-colors hover:bg-[#2aadf2] disabled:opacity-60 sm:w-auto"
            >
              {busy === "assign" ? <RefreshCw className="size-4 animate-spin" /> : <Phone className="size-4" />}
              Get temporary number
            </button>
          </div>
        )}
      </div>

      {/* ── SMS inbox ───────────────────────────────────────────────── */}
      {num ? (
        <section
          aria-label="SMS inbox"
          className="min-w-0 rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 shadow-2xl backdrop-blur-2xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] px-4 py-3">
            <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-white">
              <MessageSquareText className="size-4 shrink-0 text-[#38bdf8]" aria-hidden="true" />
              SMS inbox
              <span className="text-[11px] font-medium text-slate-400">
                {messages.length} {messages.length === 1 ? "message" : "messages"}
              </span>
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  live ? "bg-[#38bdf8] shadow-[0_0_6px_rgba(56,189,248,0.8)]" : "bg-amber-400",
                )}
              />
              {live ? "Listening — refreshes automatically" : "Assignment expired"}
            </div>
          </div>

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-10 text-center sm:py-12">
              <div className="relative mb-4 flex size-14 items-center justify-center rounded-2xl border border-[#38bdf8]/25 bg-[#38bdf8]/10 text-[#38bdf8]">
                <MessageSquareText className="size-6" aria-hidden="true" />
                <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-[#0c1017] bg-[#38bdf8]" />
              </div>
              <h3 className="font-display text-base font-bold text-white">
                {live ? "Your number is listening." : "No SMS to show."}
              </h3>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-slate-400 sm:text-sm">
                Messages sent to {num.e164} will appear here automatically. Nothing is pre-filled —
                only genuinely received SMS show up.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {messages.map((message) => (
                <li key={message.id} className="min-w-0 px-4 py-3.5">
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <p className="min-w-0 truncate font-mono text-xs font-semibold text-[#38bdf8]">
                      {message.fromNumber}
                    </p>
                    <time className="shrink-0 text-[10px] font-medium text-slate-500" dateTime={message.receivedAt}>
                      {relativeTime(message.receivedAt)}
                    </time>
                  </div>
                  {message.detectedCode ? (
                    <div className="mt-2">
                      <OtpCodeCard code={message.detectedCode} />
                    </div>
                  ) : null}
                  <p className="mt-1.5 min-w-0 break-words text-sm leading-relaxed text-slate-200">{message.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <Dialog open={Boolean(qr)} onClose={() => setQr(null)} title="Scan temporary number">
        {qr && num ? (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <Image
              src={qr}
              alt={`QR code for ${num.e164}`}
              width={224}
              height={224}
              unoptimized
              className="size-48 rounded-2xl bg-white p-3 shadow-xl xs:size-56"
            />
            <p className="max-w-full break-all font-mono text-sm text-slate-300">{num.e164}</p>
            <a
              href={qr}
              download={`haven-number.png`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#38bdf8] px-5 py-2.5 text-xs font-bold text-[#06121f] shadow-lg transition-colors hover:bg-[#2aadf2]"
            >
              Download QR PNG
            </a>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
