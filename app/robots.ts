import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

/**
 * Private surfaces are blocked here *and* carry a noindex robots meta, because
 * robots.txt only prevents crawling — a disallowed URL can still be indexed
 * from external links if it is reachable.
 *
 * Temporary mailbox content is never exposed on a crawlable URL at all: the
 * inbox is rendered for the session holder and the API requires a token.
 */
const disallow = [
  "/admin",
  "/admin/",
  "/dashboard",
  "/dashboard/",
  "/api/",
  "/login",
  "/register",
  "/forgot-password",
  // Session-specific inbox view; contents differ per visitor.
  "/inbox",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
      // Ad crawlers must still reach pages that display ads in order to serve
      // relevant creatives.
      {
        userAgent: "Mediapartners-Google",
        allow: "/",
        disallow: ["/admin", "/dashboard", "/api/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/").replace(/\/$/, ""),
  };
}
