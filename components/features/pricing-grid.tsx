"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { formatMoney } from "@/lib/utils";
import { Crystal3DIcon, Crown3DIcon, Vault3DIcon, CubePremium3DIcon } from "@/components/brand/3d-icons";
import type { PlanView } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
    <div className="space-y-8">
      <div className="flex justify-center">
        <Tabs
          value={interval}
          onChange={setInterval}
          tabs={[
            { id: "month", label: "Monthly" },
            { id: "year", label: "Yearly (Save 20%)" },
            { id: "lifetime", label: "Lifetime" },
          ]}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 items-stretch">
        {plans.map((p) => {
          const price = p.prices.find((x) => x.currency === "USD" && x.interval === interval);
          const fallback = p.prices.find((x) => x.currency === "USD");
          const isPopular = p.key === "PRO" || Boolean(p.highlight?.toLowerCase().includes("popular"));

          return (
            <div
              key={p.key}
              className={cn(
                "relative rounded-2xl border p-6 flex flex-col justify-between backdrop-blur-xl transition-all duration-200",
                isPopular
                  ? "border-purple-500/40 bg-gradient-to-b from-[#130f26] to-[#0c0919] shadow-[0_0_35px_rgba(139,92,246,0.2)]"
                  : "border-white/[0.08] bg-[#0c1017]/95 shadow-xl hover:border-white/20",
              )}
            >
              {isPopular && (
                <div className="absolute -top-3 right-5">
                  <span className="rounded-full bg-purple-500/25 border border-purple-500/50 text-purple-300 text-[10px] font-bold px-3 py-0.5 tracking-wide shadow-md">
                    Most Popular
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-display text-lg font-bold text-white">{p.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 min-h-[32px]">{p.description}</p>
                  </div>
                  {p.key === "FREE" && <Crystal3DIcon className="scale-90 shrink-0" />}
                  {p.key === "PRO" && <Crown3DIcon className="scale-90 shrink-0" />}
                  {p.key === "DEVELOPER" && <CubePremium3DIcon className="scale-90 shrink-0" />}
                  {p.key === "BUSINESS" && <Vault3DIcon className="scale-90 shrink-0" />}
                </div>

                <div className="font-display text-3xl font-extrabold text-white mt-2">
                  {p.key === "FREE"
                    ? "Free"
                    : price
                      ? formatMoney(price.amountCents, "USD")
                      : fallback
                        ? formatMoney(fallback.amountCents, "USD")
                        : "—"}
                  {p.key !== "FREE" && (
                    <span className="text-xs font-normal text-slate-400 ml-1">
                      /{interval === "lifetime" ? "once" : interval === "year" ? "yr" : "mo"}
                    </span>
                  )}
                </div>

                <div className="my-5 border-t border-white/[0.08]" />

                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2.5">
                    <Check className={cn("size-3.5", isPopular ? "text-purple-400" : "text-[#00f5a0]")} />
                    <span>{p.limits.mailbox_ttl_minutes || "10"} min default TTL</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className={cn("size-3.5", isPopular ? "text-purple-400" : "text-[#00f5a0]")} />
                    <span>{p.limits.max_active_mailboxes || "3"} active inboxes</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className={cn("size-3.5", isPopular ? "text-purple-400" : "text-[#00f5a0]")} />
                    <span>{p.limits.max_aliases || "0"} email aliases</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className={cn("size-3.5", isPopular ? "text-purple-400" : "text-[#00f5a0]")} />
                    <span>{p.limits.ads_excluded === "true" ? "100% Ad-free experience" : "Includes test ads"}</span>
                  </li>
                  {p.limits.premium_domains === "true" && (
                    <li className="flex items-center gap-2.5">
                      <Check className={cn("size-3.5", isPopular ? "text-purple-400" : "text-[#00f5a0]")} />
                      <span>Access to premium domains</span>
                    </li>
                  )}
                  {p.limits.api_rpm && p.limits.api_rpm !== "0" && (
                    <li className="flex items-center gap-2.5">
                      <Check className={cn("size-3.5", isPopular ? "text-purple-400" : "text-[#00f5a0]")} />
                      <span>Developer API ({p.limits.api_rpm} req/min)</span>
                    </li>
                  )}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => choose(p.key)}
                className={cn(
                  "w-full rounded-xl py-2.5 font-bold text-xs transition-all shadow-md mt-6 active:scale-95",
                  isPopular
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                    : p.key === "FREE"
                      ? "bg-white/[0.08] hover:bg-white/[0.14] text-white"
                      : "bg-[#00f5a0] hover:bg-[#00e092] text-[#06090e] shadow-[0_0_15px_rgba(0,245,160,0.25)]",
                )}
              >
                {p.key === "FREE" ? "Use free inbox" : "Choose " + p.name}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
