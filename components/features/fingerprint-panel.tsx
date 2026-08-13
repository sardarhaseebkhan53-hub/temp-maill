"use client";

import { useEffect, useState } from "react";

export function FingerprintPanel() {
  const [info, setInfo] = useState<Record<string, string>>({});
  useEffect(() => {
    setInfo({
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages?.join(", ") || "",
      platform: navigator.platform,
      cores: String(navigator.hardwareConcurrency || "?"),
      memory: String((navigator as Navigator & { deviceMemory?: number }).deviceMemory || "?"),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: `${screen.width}×${screen.height} @${window.devicePixelRatio}x`,
      cookies: String(navigator.cookieEnabled),
      dnt: String(navigator.doNotTrack),
      touch: String(navigator.maxTouchPoints),
    });
  }, []);
  return (
    <dl className="rounded-2xl border bg-card divide-y">
      {Object.entries(info).map(([k, v]) => (
        <div key={k} className="grid grid-cols-3 gap-2 px-4 py-3 text-sm">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="col-span-2 break-all">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
