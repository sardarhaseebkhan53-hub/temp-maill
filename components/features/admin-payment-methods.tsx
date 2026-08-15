"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export interface AdminPaymentMethod {
  key: string;
  kind: "MANUAL" | "STRIPE";
  name: string;
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
  minAmountCents: number | null;
  maxAmountCents: number | null;
  planKeys: string[];
  sortOrder: number;
  status: string;
  enabled: boolean;
}

export function AdminPaymentMethods({
  methods,
  planKeys,
}: {
  methods: AdminPaymentMethod[];
  planKeys: string[];
}) {
  return (
    <div className="space-y-3">
      {methods.map((method) => (
        <MethodEditor key={method.key} method={method} planKeys={planKeys} />
      ))}
      {methods.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
          No payment methods are configured yet.
        </p>
      ) : null}
    </div>
  );
}

function MethodEditor({
  method,
  planKeys,
}: {
  method: AdminPaymentMethod;
  planKeys: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(method.enabled);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) || "").trim();
    const cents = (name: string) => {
      const raw = text(name);
      if (!raw) return null;
      const value = Number(raw);
      return Number.isFinite(value) ? Math.round(value * 100) : null;
    };

    const payload = {
      key: method.key,
      kind: method.kind,
      name: text("name"),
      displayName: text("displayName"),
      description: text("description"),
      instructions: text("instructions"),
      accountNumber: text("accountNumber") || null,
      accountTitle: text("accountTitle") || null,
      merchantId: text("merchantId") || null,
      iban: text("iban") || null,
      bankName: text("bankName") || null,
      qrImageUrl: text("qrImageUrl") || null,
      currency: text("currency").toUpperCase() || "USD",
      minAmountCents: cents("minAmount"),
      maxAmountCents: cents("maxAmount"),
      planKeys: planKeys.filter((plan) => form.get(`plan_${plan}`) === "on"),
      sortOrder: Number(text("sortOrder") || 0),
      status: text("status") || "ACTIVE",
      enabled,
    };

    try {
      const res = await fetch("/api/v1/admin/payment-methods", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { success: boolean; error?: { message?: string } };
      if (!res.ok || !json.success) {
        toast.error(json.error?.message || "Could not save the payment method.");
        return;
      }
      toast.success(`${payload.displayName} saved`);
      router.refresh();
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  const isStripe = method.kind === "STRIPE";

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 items-center gap-2 text-left"
          aria-expanded={open}
        >
          <ChevronDown
            className={`size-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-white">
              {method.displayName}
            </span>
            <span className="block truncate text-[11px] text-slate-500">
              {method.key} · {method.kind === "STRIPE" ? "Automatic" : "Manual review"} ·{" "}
              {method.currency}
            </span>
          </span>
        </button>

        <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 text-xs font-medium text-slate-300">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            className="size-4 rounded border-slate-700 bg-[#070a10] accent-[#00f5a0]"
          />
          {enabled ? "Enabled" : "Disabled"}
        </label>
      </div>

      {open ? (
        <form onSubmit={onSubmit} className="space-y-4 border-t border-white/[0.07] p-4">
          {isStripe ? (
            <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-200">
              Stripe API keys and the webhook secret are read from environment variables
              (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET) and are never stored here.
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <Text name="name" label="Internal name" defaultValue={method.name} required />
            <Text
              name="displayName"
              label="Display name"
              defaultValue={method.displayName}
              required
            />
          </div>

          <Text name="description" label="Description" defaultValue={method.description} />
          <Area
            name="instructions"
            label="Customer instructions"
            defaultValue={method.instructions}
          />

          {!isStripe ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Text name="accountNumber" label="Account number" defaultValue={method.accountNumber ?? ""} />
              <Text name="accountTitle" label="Account title" defaultValue={method.accountTitle ?? ""} />
              <Text name="merchantId" label="Merchant ID" defaultValue={method.merchantId ?? ""} />
              <Text name="iban" label="IBAN" defaultValue={method.iban ?? ""} />
              <Text name="bankName" label="Bank name" defaultValue={method.bankName ?? ""} />
              <Text name="qrImageUrl" label="QR image URL" defaultValue={method.qrImageUrl ?? ""} />
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-4">
            <Text name="currency" label="Currency" defaultValue={method.currency} maxLength={3} />
            <Text
              name="minAmount"
              label="Min amount"
              type="number"
              step="0.01"
              defaultValue={method.minAmountCents != null ? String(method.minAmountCents / 100) : ""}
            />
            <Text
              name="maxAmount"
              label="Max amount"
              type="number"
              step="0.01"
              defaultValue={method.maxAmountCents != null ? String(method.maxAmountCents / 100) : ""}
            />
            <Text
              name="sortOrder"
              label="Sort order"
              type="number"
              defaultValue={String(method.sortOrder)}
            />
          </div>

          <fieldset className="min-w-0">
            <legend className="mb-1.5 text-xs font-semibold text-slate-300">
              Plans this method may sell
            </legend>
            <p className="mb-2 text-[11px] text-slate-500">
              Leave all unchecked to allow every paid plan.
            </p>
            <div className="flex flex-wrap gap-3">
              {planKeys.map((plan) => (
                <label
                  key={plan}
                  className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-slate-300"
                >
                  <input
                    type="checkbox"
                    name={`plan_${plan}`}
                    defaultChecked={method.planKeys.includes(plan)}
                    className="size-3.5 rounded border-slate-700 bg-[#070a10] accent-[#00f5a0]"
                  />
                  {plan}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="min-w-0">
            <label htmlFor={`status_${method.key}`} className="mb-1.5 block text-xs font-semibold text-slate-300">
              Status
            </label>
            <select
              id={`status_${method.key}`}
              name="status"
              defaultValue={method.status}
              className="w-full min-w-0 rounded-lg border border-white/10 bg-[#070a10] px-3 py-2 text-base sm:text-sm text-white focus:border-[#00f5a0]/60 focus:outline-none sm:max-w-xs"
            >
              <option value="ACTIVE">Active</option>
              <option value="HIDDEN">Hidden</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#00f5a0] px-4 py-2.5 text-xs font-bold text-[#06090e] transition-colors hover:bg-[#00e092] disabled:cursor-wait disabled:opacity-70"
          >
            {saving ? (
              <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" />
            ) : (
              <Save className="size-3.5" />
            )}
            {saving ? "Saving…" : "Save method"}
          </button>
        </form>
      ) : null}
    </section>
  );
}

const fieldClass =
  "w-full min-w-0 rounded-lg border border-white/10 bg-[#070a10] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-[#00f5a0]/60 focus:outline-none";

function Text({
  name,
  label,
  ...rest
}: { name: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="min-w-0">
      <label htmlFor={name} className="mb-1.5 block text-xs font-semibold text-slate-300">
        {label}
      </label>
      <input id={name} name={name} className={fieldClass} {...rest} />
    </div>
  );
}

function Area({
  name,
  label,
  ...rest
}: { name: string; label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="min-w-0">
      <label htmlFor={name} className="mb-1.5 block text-xs font-semibold text-slate-300">
        {label}
      </label>
      <textarea id={name} name={name} rows={3} className={fieldClass} {...rest} />
    </div>
  );
}
