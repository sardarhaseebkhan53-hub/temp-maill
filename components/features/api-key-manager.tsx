"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ApiKeyManager({
  keys,
}: {
  keys: { id: string; name: string; prefix: string; lastFour: string; mode: string; revokedAt: string | null }[];
}) {
  const router = useRouter();
  const [name, setName] = useState("Default");
  const [plaintext, setPlaintext] = useState<string | null>(null);

  async function create(mode: "live" | "test") {
    const res = await fetch("/api/v1/api-keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, mode }),
    });
    const json = await res.json();
    if (!json.success) toast.error(json.error?.message || "Could not create key");
    else {
      setPlaintext(json.data.plaintext);
      toast.success("Copy this key now");
      router.refresh();
    }
  }

  async function revoke(id: string) {
    await fetch(`/api/v1/api-keys/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {plaintext ? (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm break-all">
          <p className="font-medium mb-1">Copy this key. It will not be shown again.</p>
          <code>{plaintext}</code>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" />
        <Button onClick={() => create("live")}>New live key</Button>
        <Button variant="outline" onClick={() => create("test")}>
          New test key
        </Button>
      </div>
      <ul className="space-y-2">
        {keys.map((k) => (
          <li key={k.id} className="rounded-xl border bg-card p-4 flex justify-between gap-3">
            <div>
              <p className="font-medium">{k.name}</p>
              <p className="text-xs text-muted-foreground font-mono">
                {k.prefix}…{k.lastFour} · {k.mode}
                {k.revokedAt ? " · revoked" : ""}
              </p>
            </div>
            {!k.revokedAt ? (
              <Button size="sm" variant="ghost" onClick={() => revoke(k.id)}>
                Revoke
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
