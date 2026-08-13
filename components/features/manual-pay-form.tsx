"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ManualPayForm({ planKey, interval, currency }: { planKey: string; interval: string; currency: string }) {
  const router = useRouter();
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/v1/billing/manual", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        planKey,
        interval,
        currency,
        method: fd.get("method"),
        transactionId: fd.get("transactionId"),
        amountCents: Number(fd.get("amountCents")),
      }),
    });
    const json = await res.json();
    if (!json.success) toast.error(json.error?.message || "Could not submit");
    else {
      toast.success("Submitted for review");
      router.push("/dashboard/billing");
    }
  }
  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <p className="text-sm">
        {planKey} · {interval} · {currency}
      </p>
      <Select name="method" defaultValue="bank_transfer">
        <option value="bank_transfer">Bank transfer</option>
        <option value="jazzcash">JazzCash</option>
        <option value="easypaisa">Easypaisa</option>
        <option value="other">Other</option>
      </Select>
      <Input name="transactionId" placeholder="Transaction reference" required />
      <Input name="amountCents" type="number" placeholder="Amount in cents" required />
      <Button type="submit">Submit for review</Button>
    </form>
  );
}
