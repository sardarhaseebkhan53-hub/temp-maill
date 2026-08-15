"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { MailboxState } from "@/types";

export function ExpiryTimer({
  expiresAt,
  state,
}: {
  expiresAt: string;
  state: MailboxState;
}) {
  // Keep the SSR and hydration frame deterministic, then start the clock once
  // mounted. A Date.now() state initializer causes a one-second text mismatch.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = now === null ? null : Math.max(0, new Date(expiresAt).getTime() - now);
  const totalSec = Math.floor((remaining ?? 0) / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const urgency =
    remaining === null
      ? "pending"
      : remaining === 0 || state === "EXPIRED" || state === "PURGED"
        ? "dead"
        : remaining < 60_000
          ? "hot"
          : remaining < 3 * 60_000 || state === "EXPIRING_SOON"
            ? "warm"
            : "ok";
  const label =
    urgency === "pending"
      ? "--:--"
      : urgency === "dead"
        ? "Expired"
        : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tabular transition-colors duration-base",
        urgency === "pending" && "bg-muted text-muted-foreground",
        urgency === "ok" && "bg-success/15 text-success",
        urgency === "warm" && "bg-warning/15 text-warning",
        urgency === "hot" && "animate-pulse-soft bg-destructive/15 text-destructive",
        urgency === "dead" && "bg-muted text-muted-foreground",
      )}
      aria-live="polite"
      aria-busy={urgency === "pending"}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          urgency === "pending" && "bg-muted-foreground",
          urgency === "ok" && "bg-success",
          urgency === "warm" && "bg-warning",
          urgency === "hot" && "bg-destructive",
          urgency === "dead" && "bg-muted-foreground",
        )}
      />
      {label}
    </span>
  );
}
