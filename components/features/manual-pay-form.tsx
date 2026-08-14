"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Building2, Copy, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export interface PublicPaymentMethod {
  key: string;
  displayName: string;
  description: string;
  instructions: string;
  accountNumber: string | null;
  accountTitle: string | null;
  merchantId: string | null;
  iban: string | null;
  bankName: string | null;
  qrImageUrl: string | null;
  currency: string;
}

export function ManualPayForm({
  planKey,
  interval,
  currency,
  amountLabel,
  methods,
}: {
  planKey: string;
  interval: string;
  currency: string;
  amountLabel: string;
  methods: PublicPaymentMethod[];
}) {
  const router = useRouter();
  const [selectedKey, setSelectedKey] = useState(methods[0]?.key ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => methods.find((method) => method.key === selectedKey) ?? null,
    [methods, selectedKey],
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !selected) return;

    setBusy(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const screenshotUrl = String(form.get("screenshotUrl") || "").trim();

    try {
      const res = await fetch("/api/v1/billing/manual", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          planKey,
          interval,
          currency,
          method: selected.key,
          transactionId: String(form.get("transactionId") || "").trim(),
          ...(screenshotUrl ? { screenshotUrl } : {}),
        }),
      });
      const json = (await res.json()) as { success: boolean; error?: { message?: string } };
      if (!res.ok || !json.success) {
        setError(json.error?.message || "We could not submit your payment. Please try again.");
        return;
      }
      toast.success("Submitted. Premium activates once an operator verifies it.");
      router.push("/dashboard/billing");
      router.refresh();
    } catch {
      setError("We could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (methods.length === 0) {
    return (
      <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-200">
        No manual payment methods are currently enabled. Please contact support to arrange payment.
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-5">
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs text-slate-400">You are paying for</p>
        <p className="mt-1 font-display text-lg font-bold text-white">
          Haven {planKey} · {interval}
        </p>
        <p className="mt-0.5 font-mono text-sm text-[#00f5a0]">{amountLabel}</p>
      </div>

      <fieldset className="min-w-0">
        <legend className="mb-2 text-xs font-semibold text-slate-300">Choose a payment method</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {methods.map((method) => (
            <label
              key={method.key}
              className={`flex min-w-0 cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-colors ${
                selectedKey === method.key
                  ? "border-[#00f5a0]/40 bg-[#00f5a0]/[0.07]"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.key}
                checked={selectedKey === method.key}
                onChange={() => setSelectedKey(method.key)}
                className="mt-0.5 size-3.5 shrink-0 accent-[#00f5a0]"
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white">
                  {method.displayName}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-slate-400">
                  {method.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {selected ? <MethodInstructions method={selected} /> : null}

      <form onSubmit={onSubmit} className="space-y-3">
        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-xs text-red-300"
          >
            <AlertCircle className="mt-px size-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0">{error}</span>
          </div>
        ) : null}

        <div className="min-w-0">
          <label htmlFor="transactionId" className="mb-1.5 block text-xs font-semibold text-slate-300">
            Transaction ID / reference
          </label>
          <input
            id="transactionId"
            name="transactionId"
            required
            minLength={4}
            maxLength={80}
            placeholder="e.g. TID 4829301882"
            className="w-full min-w-0 rounded-xl border border-white/10 bg-[#070a10] px-3.5 py-3 text-base sm:text-sm text-white placeholder:text-slate-600 focus:border-[#00f5a0]/60 focus:outline-none"
          />
        </div>

        <div className="min-w-0">
          <label htmlFor="screenshotUrl" className="mb-1.5 block text-xs font-semibold text-slate-300">
            Receipt screenshot URL <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id="screenshotUrl"
            name="screenshotUrl"
            type="url"
            placeholder="https://…"
            className="w-full min-w-0 rounded-xl border border-white/10 bg-[#070a10] px-3.5 py-3 text-base sm:text-sm text-white placeholder:text-slate-600 focus:border-[#00f5a0]/60 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#00f5a0] px-5 py-3 text-sm font-bold text-[#06090e] transition-colors hover:bg-[#00e092] disabled:cursor-wait disabled:opacity-70"
        >
          {busy ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> : null}
          {busy ? "Submitting…" : "Submit for review"}
        </button>

        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-500">
          <ShieldCheck className="mt-px size-3.5 shrink-0 text-[#00f5a0]" aria-hidden="true" />
          Your submission is marked pending. Premium activates only after an operator verifies the
          transaction — never automatically from this form.
        </p>
      </form>
    </div>
  );
}

function MethodInstructions({ method }: { method: PublicPaymentMethod }) {
  const details = [
    ["Account title", method.accountTitle],
    ["Account number", method.accountNumber],
    ["Merchant ID", method.merchantId],
    ["Bank", method.bankName],
    ["IBAN", method.iban],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied");
    } catch {
      toast.error("Could not copy");
    }
  }

  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-[#070a10] p-4">
      <div className="flex items-center gap-2">
        <Building2 className="size-4 shrink-0 text-[#00f5a0]" aria-hidden="true" />
        <h3 className="text-sm font-bold text-white">Send your payment to</h3>
      </div>

      {details.length ? (
        <dl className="mt-3 space-y-2">
          {details.map(([label, value]) => (
            <div key={label} className="flex min-w-0 items-center justify-between gap-3">
              <dt className="shrink-0 text-[11px] text-slate-500">{label}</dt>
              <dd className="flex min-w-0 items-center gap-2">
                <span className="truncate font-mono text-xs text-white">{value}</span>
                <button
                  type="button"
                  onClick={() => copy(value)}
                  aria-label={`Copy ${label}`}
                  className="shrink-0 rounded p-1 text-slate-500 transition-colors hover:text-[#00f5a0]"
                >
                  <Copy className="size-3.5" />
                </button>
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-2 text-xs text-slate-400">
          Contact support for the account details for this method.
        </p>
      )}

      {method.instructions ? (
        <p className="mt-3 border-t border-white/[0.07] pt-3 text-[11px] leading-relaxed text-slate-400">
          {method.instructions}
        </p>
      ) : null}

      {method.qrImageUrl ? (
        // Operator-supplied URL that may point anywhere, so next/image
        // optimisation is deliberately bypassed here.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={method.qrImageUrl}
          alt={`${method.displayName} payment QR code`}
          className="mt-3 size-40 rounded-xl border border-white/10 bg-white p-2"
          loading="lazy"
        />
      ) : null}
    </div>
  );
}
