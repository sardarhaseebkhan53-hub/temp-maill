"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function AdminDomainVerifyButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function verify() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/v1/admin/domains", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = (await response.json()) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !json.success) {
        setError(json.error?.message || "Verification failed.");
        return;
      }
      router.refresh();
    } catch {
      setError("Verification request failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={verify}
        disabled={pending}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium hover:bg-muted disabled:cursor-wait disabled:opacity-60"
      >
        <RefreshCw className={`size-3 ${pending ? "animate-spin" : ""}`} />
        {pending ? "Checking" : "Verify MX"}
      </button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
