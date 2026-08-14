"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SettingsEditor({ rows }: { rows: { key: string; value: string; group: string }[] }) {
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const settings = rows.map((r) => ({ key: r.key, value: String(fd.get(r.key) ?? r.value) }));
    const res = await fetch("/api/v1/admin/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ settings }),
    });
    const json = await res.json();
    if (json.success) toast.success("Settings saved");
    else toast.error(json.error?.message || "Failed");
  }
  return (
    <form onSubmit={onSubmit} className="space-y-3 max-w-2xl">
      {rows.map((r) => (
        <label
          key={r.key}
          className="grid min-w-0 items-center gap-2 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
        >
          <span className="font-mono text-xs">
            {r.group}/{r.key}
          </span>
          <input name={r.key} defaultValue={r.value} className="h-10 rounded-lg border px-3 bg-card" />
        </label>
      ))}
      <Button type="submit">Save all</Button>
    </form>
  );
}
