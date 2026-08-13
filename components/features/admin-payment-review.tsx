"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function PaymentReview({
  rows,
}: {
  rows: {
    id: string;
    email: string;
    method: string;
    transactionId: string;
    status: string;
    amountCents: number;
    currency: string;
  }[];
}) {
  const router = useRouter();
  async function act(id: string, action: string) {
    const res = await fetch(`/api/v1/admin/payments/${id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const json = await res.json();
    if (!json.success) toast.error(json.error?.message || "Failed");
    else {
      toast.success(action);
      router.refresh();
    }
  }
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.id} className="rounded-xl border bg-card p-4">
          <p className="text-sm">
            {r.email} · {r.method} · {r.transactionId} · {(r.amountCents / 100).toFixed(2)} {r.currency} · {r.status}
          </p>
          {r.status === "PENDING" ? (
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={() => act(r.id, "APPROVED")}>
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => act(r.id, "NEEDS_INFO")}>
                Request info
              </Button>
              <Button size="sm" variant="ghost" onClick={() => act(r.id, "REJECTED")}>
                Reject
              </Button>
            </div>
          ) : null}
        </li>
      ))}
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">No manual payments.</p> : null}
    </ul>
  );
}
