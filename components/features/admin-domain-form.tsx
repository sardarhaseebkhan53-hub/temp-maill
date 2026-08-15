"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ApiResponse {
  success?: boolean;
  data?: { mxOk?: boolean; lastHealthNote?: string };
  error?: { message?: string };
}

export function AdminDomainForm() {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [eligibility, setEligibility] = useState("FREE");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "error" | "warning"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/v1/admin/domains", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domain, eligibility, weight: 100 }),
      });
      const json = (await res.json()) as ApiResponse;
      if (!res.ok || !json.success) {
        setFeedback({ kind: "error", text: json.error?.message || "Could not add domain." });
        return;
      }
      setDomain("");
      setFeedback({
        kind: json.data?.mxOk ? "ok" : "warning",
        text: json.data?.mxOk
          ? "Domain added and inbound MX route verified."
          : json.data?.lastHealthNote || "Domain saved, but MX is not ready yet.",
      });
      router.refresh();
    } catch {
      setFeedback({ kind: "error", text: "Could not reach the domain API." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border bg-card p-4">
      <div>
        <h2 className="font-medium">Add a .com domain you control</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          It stays unavailable until its MX record points to the configured inbound provider.
        </p>
      </div>
      <input
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        placeholder="mail.your-domain.com"
        required
        aria-label="Domain name"
        className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
      />
      <select
        value={eligibility}
        onChange={(e) => setEligibility(e.target.value)}
        aria-label="Domain eligibility"
        className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
      >
        <option value="FREE">Free</option>
        <option value="PREMIUM_ONLY">Premium only</option>
        <option value="BUSINESS_ONLY">Business only</option>
      </select>
      {feedback ? (
        <p
          role="status"
          className={
            feedback.kind === "ok"
              ? "text-xs text-success"
              : feedback.kind === "warning"
                ? "text-xs text-warning"
                : "text-xs text-destructive"
          }
        >
          {feedback.text}
        </p>
      ) : null}
      <button
        disabled={pending}
        className="btn-primary h-10 w-full disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Checking MX…" : "Add and verify domain"}
      </button>
    </form>
  );
}
