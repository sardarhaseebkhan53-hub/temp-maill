import type { Locale } from "@/types";
import { RTL_LOCALES } from "@/types";
import en, { type Dictionary } from "@/i18n/en";

const overrides: Record<Exclude<Locale, "en">, DeepPartial<Dictionary>> = {
  es: {
    brand: { tagline: "Tu bandeja privada. Al instante." },
    hero: {
      title: "Tu bandeja privada. Al instante.",
      subtitle: "Crea un correo temporal en segundos. Sin registro. Sin seguimiento innecesario.",
      cta: "Crear correo temporal",
      secondary: "Explorar herramientas",
    },
    nav: { home: "Inicio", inbox: "Bandeja", pricing: "Precios", login: "Entrar" },
    trust: {
      noSignup: "Sin registro",
      autoDelete: "Se elimina solo",
      sanitized: "HTML sanitizado antes de mostrarlo",
    },
  },
  fr: {
    brand: { tagline: "Votre boîte privée. Instantanément." },
    hero: {
      title: "Votre boîte privée. Instantanément.",
      subtitle: "Créez une adresse jetable en quelques secondes. Sans inscription.",
      cta: "Créer un e-mail temporaire",
      secondary: "Explorer les outils",
    },
    nav: { home: "Accueil", inbox: "Boîte", pricing: "Tarifs", login: "Connexion" },
  },
  de: {
    brand: { tagline: "Ihr privates Postfach. Sofort." },
    hero: {
      title: "Ihr privates Postfach. Sofort.",
      subtitle: "Wegwerfadresse in Sekunden. Keine Anmeldung. Kein unnötiges Tracking.",
      cta: "Temporäre E-Mail erstellen",
      secondary: "Datenschutz-Tools",
    },
    nav: { home: "Start", inbox: "Posteingang", pricing: "Preise", login: "Anmelden" },
  },
  hi: {
    brand: { tagline: "आपका निजी इनबॉक्स। तुरंत।" },
    hero: {
      title: "आपका निजी इनबॉक्स। तुरंत।",
      subtitle: "सेकंडों में अस्थायी ईमेल। साइनअप नहीं। अनावश्यक ट्रैकिंग नहीं।",
      cta: "अस्थायी ईमेल बनाएँ",
      secondary: "गोपनीयता टूल",
    },
  },
  ar: {
    brand: { tagline: "صندوق بريدك الخاص. فورًا." },
    hero: {
      title: "صندوق بريدك الخاص. فورًا.",
      subtitle: "أنشئ عنوانًا مؤقتًا في ثوانٍ. بلا تسجيل. بلا تتبع غير ضروري.",
      cta: "إنشاء بريد مؤقت",
      secondary: "أدوات الخصوصية",
    },
    nav: { home: "الرئيسية", inbox: "الوارد", pricing: "الأسعار", login: "دخول" },
  },
  ur: {
    brand: { tagline: "آپ کا نجی ان باکس۔ فوراً۔" },
    hero: {
      title: "آپ کا نجی ان باکس۔ فوراً۔",
      subtitle: "سیکنڈوں میں عارضی ای میل۔ سائن اپ نہیں۔ غیر ضروری ٹریکنگ نہیں۔",
      cta: "عارضی ای میل بنائیں",
      secondary: "پرائیویسی ٹولز",
    },
  },
};

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

function merge<T extends Record<string, unknown>>(base: T, over?: DeepPartial<T>): T {
  if (!over) return base;
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) {
    const key = k as keyof T;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out[key] = merge(base[key] as Record<string, unknown>, v as never) as T[keyof T];
    } else if (v !== undefined) {
      out[key] = v as T[keyof T];
    }
  }
  return out;
}

export function getDictionary(locale: Locale): Dictionary {
  if (locale === "en") return en;
  return merge(en, overrides[locale]);
}

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

export function tGet(dict: Dictionary, path: string): string {
  const parts = path.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (typeof cur !== "object" || cur === null) return path;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : path;
}
