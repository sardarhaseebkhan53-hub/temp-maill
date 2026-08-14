"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface PaymentReviewRow {
  id: string;
  email: string;
  method: string;
  transactionId: string;
  status: string;
  amountCents: number;
  currency: string;
  plan: string;
  submittedAt: string;
  note: string | null;
}

const statusStyles: Record<string, string> = {
  PENDING: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  APPROVED: "border-[#00f5a0]/30 bg-[#00f5a0]/10 text-[#00f5a0]",
  REJECTED: "border-red-500/30 bg-red-500/10 text-red-300",
  NEEDS_INFO: "border-sky-500/30 bg-sky-500/10 text-sky-300",
};

export function PaymentReview({ rows }: { rows: PaymentReviewRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function act(id: string, action: "APPROVED" | "REJECTED" | "NEEDS_INFO") {
    // A rejection without a reason is not actionable for the customer.
    if (action !== "APPROVED" && !notes[id]?.trim()) {
      toast.error("Add a short reason so the customer knows what to do next.");
      return;
    }

    setBusy(id);
    try {
      const res = await fetch(`/api/v1/admin/payments/${id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, note: notes[id]?.trim() || undefined }),
      });
      const json = (await res.json()) as { success: boolean; error?: { message?: string } };
      if (!res.ok || !json.success) {
        toast.error(json.error?.message || "Could not update the payment.");
        return;
      }
      toast.success(
        action === "APPROVED"
          ? "Payment approved and the plan is now active."
          : action === "REJECTED"
            ? "Payment rejected. Premium stays inactive."
            : "More information requested.",
      );
      router.refresh();
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setBusy(null);
    }
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
        No manual payments have been submitted.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.id} className="min-w-0 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{row.email}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {row.plan} · {row.method} ·{" "}
                <span className="font-mono">{row.transactionId}</span>
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Submitted {new Date(row.submittedAt).toLocaleString()}
              </p>
              {row.note ? (
                <p className="mt-1.5 text-[11px] italic text-slate-400">Note: {row.note}</p>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span className="font-mono text-sm font-bold text-white">
                {(row.amountCents / 100).toFixed(2)} {row.currency}
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                  statusStyles[row.status] ?? "border-white/10 bg-white/5 text-slate-300"
                }`}
              >
                {row.status}
              </span>
            </div>
          </div>

          {row.status === "PENDING" ? (
            <div className="mt-3 space-y-2 border-t border-white/[0.07] pt-3">
              <label htmlFor={`note_${row.id}`} className="sr-only">
                Review note
              </label>
              <input
                id={`note_${row.id}`}
                value={notes[row.id] ?? ""}
                onChange={(event) =>
                  setNotes((current) => ({ ...current, [row.id]: event.target.value }))
                }
                placeholder="Reason (required to reject or request info)"
                className="w-full min-w-0 rounded-lg border border-white/10 bg-[#070a10] px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:border-[#00f5a0]/60 focus:outline-none"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy === row.id}
                  onClick={() => act(row.id, "APPROVED")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#00f5a0] px-3 py-2 text-xs font-bold text-[#06090e] transition-colors hover:bg-[#00e092] disabled:opacity-60"
                >
                  {busy === row.id ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busy === row.id}
                  onClick={() => act(row.id, "NEEDS_INFO")}
                  className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/[0.12] disabled:opacity-60"
                >
                  Request info
                </button>
                <button
                  type="button"
                  disabled={busy === row.id}
                  onClick={() => act(row.id, "REJECTED")}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-60"
                >
                  Reject
                </button>
              </div>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
