"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type { AdSlotKey } from "@/server/services/ads";

export interface AdSlotConfig {
  slot: AdSlotKey;
  label: string;
  size: string;
  enabled: boolean;
  unitId: string | null;
  excludePremium: boolean;
}

export function AdminAdsPanel({
  initialEnabled,
  initialTestMode,
  initialClientId,
  networks,
  initialNetworkKey,
  slots,
}: {
  initialEnabled: boolean;
  initialTestMode: boolean;
  initialClientId: string;
  networks: { key: string; name: string }[];
  initialNetworkKey: string;
  slots: AdSlotConfig[];
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [testMode, setTestMode] = useState(initialTestMode);
  const [clientId, setClientId] = useState(initialClientId);
  const [networkKey, setNetworkKey] = useState(initialNetworkKey);
  const [rows, setRows] = useState(slots);
  const [saving, setSaving] = useState(false);

  function updateRow(slot: AdSlotKey, patch: Partial<AdSlotConfig>) {
    setRows((current) =>
      current.map((row) => (row.slot === slot ? { ...row, ...patch } : row)),
    );
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/admin/ads", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          enabled,
          testMode,
          clientId: clientId.trim(),
          networkKey,
          slots: rows.map((row) => ({
            slot: row.slot,
            enabled: row.enabled,
            unitId: row.unitId?.trim() || null,
            excludePremium: row.excludePremium,
          })),
        }),
      });
      const json = (await res.json()) as { success: boolean; error?: { message?: string } };
      if (!res.ok || !json.success) {
        toast.error(json.error?.message || "Could not save the ad configuration.");
        return;
      }
      toast.success("Ad configuration saved");
      router.refresh();
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-w-0 space-y-6">
      <section className="min-w-0 space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="text-sm font-bold text-white">Global</h2>

        <label className="flex cursor-pointer items-start gap-2.5 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-slate-700 bg-[#070a10] accent-[#00f5a0]"
          />
          <span>
            <span className="block font-semibold text-white">Ads enabled</span>
            <span className="block text-[11px] text-slate-500">
              Turn every placement off at once. Premium plans are always ad-free regardless.
            </span>
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-2.5 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={testMode}
            onChange={(event) => setTestMode(event.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-slate-700 bg-[#070a10] accent-[#00f5a0]"
          />
          <span>
            <span className="block font-semibold text-white">Test mode</span>
            <span className="block text-[11px] text-slate-500">
              Render clearly labelled placeholders instead of live network units. Keep this on until
              your network account is approved.
            </span>
          </span>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor="network" className="mb-1.5 block text-xs font-semibold text-slate-300">
              Provider
            </label>
            <select
              id="network"
              value={networkKey}
              onChange={(event) => setNetworkKey(event.target.value)}
              className={fieldClass}
            >
              {networks.map((network) => (
                <option key={network.key} value={network.key}>
                  {network.name}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label htmlFor="clientId" className="mb-1.5 block text-xs font-semibold text-slate-300">
              Publisher / client ID
            </label>
            <input
              id="clientId"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              placeholder="ca-pub-…"
              className={fieldClass}
            />
          </div>
        </div>
      </section>

      <section className="min-w-0 space-y-2">
        <h2 className="text-sm font-bold text-white">Slots</h2>
        <p className="text-[11px] text-slate-500">
          Each slot renders only where the layout has room for it. Rails appear at 1600px and above.
        </p>

        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.slot}
              className="grid min-w-0 gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,200px)_auto] sm:items-center"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">{row.label}</p>
                <p className="truncate text-[11px] text-slate-500">
                  {row.slot} · {row.size}
                </p>
              </div>

              <div className="min-w-0">
                <label htmlFor={`unit_${row.slot}`} className="sr-only">
                  {row.label} unit id
                </label>
                <input
                  id={`unit_${row.slot}`}
                  value={row.unitId ?? ""}
                  onChange={(event) => updateRow(row.slot, { unitId: event.target.value })}
                  placeholder="Ad unit ID"
                  className={fieldClass}
                />
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-slate-300">
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={(event) => updateRow(row.slot, { enabled: event.target.checked })}
                    className="size-3.5 rounded border-slate-700 bg-[#070a10] accent-[#00f5a0]"
                  />
                  On
                </label>
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-slate-300">
                  <input
                    type="checkbox"
                    checked={row.excludePremium}
                    onChange={(event) =>
                      updateRow(row.slot, { excludePremium: event.target.checked })
                    }
                    className="size-3.5 rounded border-slate-700 bg-[#070a10] accent-[#00f5a0]"
                  />
                  Hide for premium
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl bg-[#00f5a0] px-5 py-2.5 text-xs font-bold text-[#06090e] transition-colors hover:bg-[#00e092] disabled:cursor-wait disabled:opacity-70"
      >
        {saving ? (
          <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" />
        ) : (
          <Save className="size-3.5" />
        )}
        {saving ? "Saving…" : "Save ad configuration"}
      </button>
    </div>
  );
}

const fieldClass =
  "w-full min-w-0 rounded-lg border border-white/10 bg-[#070a10] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-[#00f5a0]/60 focus:outline-none";
