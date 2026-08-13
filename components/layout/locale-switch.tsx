"use client";

import { LOCALES, type Locale } from "@/types";

export function LocaleSwitch() {
  return (
    <select
      aria-label="Language"
      className="h-10 rounded-lg bg-transparent text-xs text-muted-foreground px-1"
      defaultValue="en"
      onChange={async (e) => {
        await fetch("/api/v1/locale", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ locale: e.target.value }),
        });
        window.location.reload();
      }}
    >
      {LOCALES.map((l: Locale) => (
        <option key={l} value={l}>
          {l.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
