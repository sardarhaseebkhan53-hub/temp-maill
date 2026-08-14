import type { Metadata } from "next";
import { getEnv } from "@/config/env";
import { LOCALES } from "@/types";

export const SITE_NAME = "Haven";
export const DEFAULT_OG_IMAGE = "/og.png";
export const TWITTER_HANDLE = "@havenmail";

export function absoluteUrl(path = "/"): string {
  const base = getEnv().APP_URL.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Language alternates. Haven serves one URL per page and switches locale from
 * a cookie, so every locale points at the same canonical URL. That is the
 * honest signal: we do not have separate localized URLs to advertise.
 */
function languageAlternates(url: string): Record<string, string> {
  const alternates: Record<string, string> = {};
  for (const locale of LOCALES) alternates[locale] = url;
  alternates["x-default"] = url;
  return alternates;
}

export interface SeoOptions {
  title: string;
  description: string;
  path?: string;
  /** Suppress indexing for private or session-specific pages. */
  noindex?: boolean;
  /** Absolute or root-relative image used for OG and Twitter cards. */
  image?: string;
  imageAlt?: string;
  /** Set for blog posts so Open Graph reports an article rather than a page. */
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  section?: string;
  tags?: string[];
}

export function buildMetadata(opts: SeoOptions): Metadata {
  const url = absoluteUrl(opts.path || "/");
  const image = absoluteUrl(opts.image || DEFAULT_OG_IMAGE);
  const imageAlt = opts.imageAlt || `${opts.title} — ${SITE_NAME}`;

  return {
    title: opts.title,
    description: opts.description,
    alternates: {
      canonical: url,
      // Private pages should not advertise alternates at all.
      ...(opts.noindex ? {} : { languages: languageAlternates(url) }),
    },
    robots: opts.noindex
      ? { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
        },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: SITE_NAME,
      type: opts.type ?? "website",
      locale: "en_US",
      images: [{ url: image, width: 1200, height: 630, alt: imageAlt }],
      ...(opts.type === "article"
        ? {
            publishedTime: opts.publishedTime,
            modifiedTime: opts.modifiedTime,
            authors: opts.authors,
            section: opts.section,
            tags: opts.tags,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
      title: opts.title,
      description: opts.description,
      images: [{ url: image, alt: imageAlt }],
    },
  };
}

export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data) };
}

/* ── Structured data builders ──────────────────────────────────────────── */

export function organizationSchema() {
  return {
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/icons/icon-512.png"),
      width: 512,
      height: 512,
    },
    description:
      "Haven provides free temporary email addresses and privacy tools. Disposable inboxes receive mail in real time, sanitize it, and expire automatically.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: absoluteUrl("/contact"),
      availableLanguage: ["English"],
    },
  };
}

export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: SITE_NAME,
    url: absoluteUrl("/"),
    publisher: { "@id": absoluteUrl("/#organization") },
    inLanguage: "en",
  };
}

export function webPageSchema(opts: {
  path: string;
  name: string;
  description: string;
  breadcrumb?: boolean;
}) {
  return {
    "@type": "WebPage",
    "@id": `${absoluteUrl(opts.path)}#webpage`,
    url: absoluteUrl(opts.path),
    name: opts.name,
    description: opts.description,
    isPartOf: { "@id": absoluteUrl("/#website") },
    ...(opts.breadcrumb
      ? { breadcrumb: { "@id": `${absoluteUrl(opts.path)}#breadcrumb` } }
      : {}),
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbSchema(crumbs: Crumb[], pagePath: string) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${absoluteUrl(pagePath)}#breadcrumb`,
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export function articleSchema(opts: {
  path: string;
  headline: string;
  description: string;
  image?: string;
  author: string;
  published?: string | null;
  modified?: string | null;
  section?: string | null;
}) {
  return {
    "@type": "Article",
    "@id": `${absoluteUrl(opts.path)}#article`,
    headline: opts.headline,
    description: opts.description,
    image: absoluteUrl(opts.image || DEFAULT_OG_IMAGE),
    author: { "@type": "Person", name: opts.author },
    publisher: { "@id": absoluteUrl("/#organization") },
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(opts.path) },
    ...(opts.published ? { datePublished: opts.published } : {}),
    ...(opts.modified ? { dateModified: opts.modified } : {}),
    ...(opts.section ? { articleSection: opts.section } : {}),
    inLanguage: "en",
  };
}

/**
 * The free temporary-email service itself. Offer price is genuinely 0 — this
 * describes the free tier, not a discount. No aggregateRating is emitted
 * because Haven does not collect verified public reviews.
 */
export function softwareApplicationSchema() {
  return {
    "@type": "SoftwareApplication",
    "@id": absoluteUrl("/#app"),
    name: "Haven Temporary Email",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any (web browser)",
    url: absoluteUrl("/"),
    description:
      "Generate a free temporary email address instantly and receive mail in a disposable inbox that expires automatically.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@id": absoluteUrl("/#organization") },
  };
}

/** Wrap nodes in a single @graph document. */
export function graph(...nodes: unknown[]) {
  return jsonLd({ "@context": "https://schema.org", "@graph": nodes.filter(Boolean) });
}
