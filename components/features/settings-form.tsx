"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";

export function SettingsForm({ name, locale, theme }: { name: string; locale: string; theme: string }) {
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/v1/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        displayName: fd.get("displayName"),
        locale: fd.get("locale"),
        theme: fd.get("theme"),
      }),
    });
    const json = await res.json();
    if (json.success) toast.success("Saved");
    else toast.error(json.error?.message || "Could not save");
  }
  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <Input name="displayName" defaultValue={name} placeholder="Display name" />
      <Select name="locale" defaultValue={locale}>
        {["en", "es", "fr", "de", "hi", "ar", "ur"].map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </Select>
      <Select name="theme" defaultValue={theme}>
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </Select>
      <Button type="submit">Save</Button>
    </form>
  );
}
