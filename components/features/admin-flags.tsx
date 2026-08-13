"use client";

import { useRouter } from "next/navigation";

export function FlagToggles({
  flags,
}: {
  flags: { key: string; enabled: boolean; description: string | null }[];
}) {
  const router = useRouter();
  async function toggle(key: string, enabled: boolean) {
    await fetch("/api/v1/admin/flags", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key, enabled }),
    });
    router.refresh();
  }
  return (
    <ul className="space-y-2">
      {flags.map((f) => (
        <li key={f.key} className="rounded-xl border bg-card p-3 flex items-center justify-between">
          <div>
            <p className="font-mono text-sm">{f.key}</p>
            <p className="text-xs text-muted-foreground">{f.description}</p>
          </div>
          <button className="text-sm text-primary" onClick={() => toggle(f.key, !f.enabled)}>
            {f.enabled ? "On" : "Off"}
          </button>
        </li>
      ))}
    </ul>
  );
}
