"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { LOCALES, type Locale } from "@/types";

const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  ur: "اردو",
  hi: "हिन्दी",
  ar: "العربية",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
};

/**
 * Persists the locale server-side, then refreshes so the document `lang` and
 * `dir` attributes update — a full page reload is not needed.
 */
export function NavLocaleSwitch({ value = "en" }: { value?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const locale = event.target.value;
    start(async () => {
      await fetch("/api/v1/locale", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      router.refresh();
    });
  }

  return (
    <div className="relative inline-flex items-center">
      <Globe
        className="pointer-events-none absolute left-2.5 size-3.5 text-slate-400"
        aria-hidden="true"
      />
      <select
        aria-label="Language"
        value={value}
        onChange={onChange}
        disabled={pending}
        className="appearance-none rounded-xl border border-transparent bg-transparent py-2 pl-8 pr-6 text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.06] focus:border-[#00f5a0]/40 focus:outline-none disabled:opacity-60"
      >
        {LOCALES.map((locale: Locale) => (
          <option key={locale} value={locale} className="bg-[#0d121c] text-white">
            {LOCALE_NAMES[locale] ?? locale.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Legacy export kept so existing imports continue to work. */
export function LocaleSwitch() {
  return <NavLocaleSwitch />;
}
