"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { formatMoney } from "@/lib/utils";
import type { PlanView } from "@/types";
import { toast } from "sonner";

export function PricingGrid({ plans }: { plans: PlanView[] }) {
  const [interval, setInterval] = useState("month");
  const router = useRouter();

  async function choose(key: string) {
    if (key === "FREE") {
      router.push("/#inbox");
      return;
    }
    const res = await fetch("/api/v1/billing/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ planKey: key, interval, currency: "USD" }),
    });
    const json = await res.json();
    if (res.status === 401) {
      router.push("/login?next=/pricing");
      return;
    }
    if (!json.success) {
      toast.error(json.error?.message || "Could not start checkout");
      return;
    }
    if (json.data.checkoutUrl) router.push(json.data.checkoutUrl);
  }

  return (
    <div>
      <Tabs
        value={interval}
        onChange={setInterval}
        tabs={[
          { id: "month", label: "Monthly" },
          { id: "year", label: "Yearly" },
          { id: "lifetime", label: "Lifetime" },
        ]}
      />
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((p) => {
          const price = p.prices.find((x) => x.currency === "USD" && x.interval === interval);
          const fallback = p.prices.find((x) => x.currency === "USD");
          return (
            <div key={p.key} className="rounded-2xl border bg-card p-6 flex flex-col">
              {p.highlight ? <p className="text-xs text-primary font-medium mb-2">{p.highlight}</p> : null}
              <h2 className="font-display text-xl font-semibold">{p.name}</h2>
              <p className="text-sm text-muted-foreground mt-1 flex-1">{p.description}</p>
              <p className="font-display text-3xl mt-4">
                {p.key === "FREE"
                  ? "Free"
                  : price
                    ? formatMoney(price.amountCents, "USD")
                    : fallback
                      ? formatMoney(fallback.amountCents, "USD")
                      : "—"}
              </p>
              <ul className="mt-4 text-sm space-y-1 text-muted-foreground">
                <li>{p.limits.mailbox_ttl_minutes || "10"} min default TTL</li>
                <li>{p.limits.max_active_mailboxes || "3"} active inboxes</li>
                <li>{p.limits.max_aliases || "0"} aliases</li>
                <li>{p.limits.ads_excluded === "true" ? "Ads excluded" : "May include ads"}</li>
              </ul>
              <Button className="mt-6" onClick={() => choose(p.key)}>
                {p.key === "FREE" ? "Use free inbox" : "Choose plan"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
