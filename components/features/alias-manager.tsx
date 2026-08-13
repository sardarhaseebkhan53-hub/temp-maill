"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AliasManager({
  aliases,
  domains,
}: {
  aliases: { id: string; address: string; status: string; label: string | null }[];
  domains: { id: string; domain: string }[];
}) {
  const router = useRouter();
  const [localPart, setLocalPart] = useState("");
  const [domainId, setDomainId] = useState(domains[0]?.id ?? "");

  async function create() {
    const res = await fetch("/api/v1/aliases", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ localPart: localPart || undefined, domainId }),
    });
    const json = await res.json();
    if (!json.success) toast.error(json.error?.message || "Could not create alias");
    else {
      toast.success("Alias created");
      router.refresh();
    }
  }

  async function setStatus(id: string, status: string) {
    await fetch(`/api/v1/aliases/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Input placeholder="local part" value={localPart} onChange={(e) => setLocalPart(e.target.value)} className="max-w-xs" />
        <Select value={domainId} onChange={(e) => setDomainId(e.target.value)} className="max-w-xs">
          {domains.map((d) => (
            <option key={d.id} value={d.id}>
              @{d.domain}
            </option>
          ))}
        </Select>
        <Button onClick={create}>Create alias</Button>
      </div>
      <ul className="space-y-2">
        {aliases.map((a) => (
          <li key={a.id} className="rounded-xl border bg-card p-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-mono text-sm">{a.address}</p>
              <p className="text-xs text-muted-foreground">{a.status}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setStatus(a.id, a.status === "PAUSED" ? "ACTIVE" : "PAUSED")}>
                {a.status === "PAUSED" ? "Reactivate" : "Pause"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setStatus(a.id, "DELETED")}>
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
