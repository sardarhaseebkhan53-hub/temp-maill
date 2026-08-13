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
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = Math.max(0, new Date(expiresAt).getTime() - now);
  const totalSec = Math.floor(remaining / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const urgency = remaining === 0 || state === "EXPIRED" || state === "PURGED"
    ? "dead"
    : remaining < 60_000
      ? "hot"
      : remaining < 3 * 60_000 || state === "EXPIRING_SOON"
        ? "warm"
        : "ok";
  const label =
    urgency === "dead" ? "Expired" : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tabular transition-colors duration-base",
        urgency === "ok" && "bg-success/15 text-success",
        urgency === "warm" && "bg-warning/15 text-warning",
        urgency === "hot" && "bg-destructive/15 text-destructive animate-pulse-soft",
        urgency === "dead" && "bg-muted text-muted-foreground",
      )}
      aria-live="polite"
    >
      <span className={cn("size-1.5 rounded-full", urgency === "ok" && "bg-success", urgency === "warm" && "bg-warning", urgency === "hot" && "bg-destructive", urgency === "dead" && "bg-muted-foreground")} />
      {label}
    </span>
  );
}
