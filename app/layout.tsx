import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Providers } from "@/components/providers";
import { isRtl } from "@/i18n";
import type { Locale } from "@/types";
import { LOCALES } from "@/types";
import "@/styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  title: {
    default: "Haven — Temporary Email & Privacy Tools",
    template: "%s · Haven",
  },
  description:
    "Create a disposable email address in seconds. No signup. Messages are sanitized before you see them and auto-delete.",
  applicationName: "Haven",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png" }],
  },
  openGraph: {
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Haven" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4fbf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1514" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const raw = (jar.get("haven_locale")?.value || "en") as Locale;
  const locale = LOCALES.includes(raw) ? raw : "en";
  const dir = isRtl(locale) ? "rtl" : "ltr";
  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className="font-sans pb-16 lg:pb-0">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
