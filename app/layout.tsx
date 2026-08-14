import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Providers } from "@/components/providers";
import { isRtl } from "@/i18n";
import type { Locale } from "@/types";
import { LOCALES } from "@/types";
import { getEnv } from "@/config/env";
import "@/styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  title: {
    default: "Temporary Email — Free Disposable Inbox | Haven",
    template: "%s | Haven",
  },
  description:
    "Create a free temporary email address instantly. Receive email in a private disposable inbox with automatic expiry, real-time delivery and no signup required.",
  applicationName: "Haven",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    siteName: "Haven",
    locale: "en_US",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Haven — free temporary email and disposable inbox",
      },
    ],
  },
  twitter: { card: "summary_large_image", site: "@havenmail" },
  // Only emitted when an operator has configured a token.
  verification: {
    ...(getEnv().GOOGLE_SITE_VERIFICATION
      ? { google: getEnv().GOOGLE_SITE_VERIFICATION }
      : {}),
    ...(getEnv().BING_SITE_VERIFICATION
      ? { other: { "msvalidate.01": getEnv().BING_SITE_VERIFICATION } }
      : {}),
  },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  // The application shell is dark in both schemes, so the browser chrome
  // should match rather than flashing a light bar.
  themeColor: "#06080d",
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
