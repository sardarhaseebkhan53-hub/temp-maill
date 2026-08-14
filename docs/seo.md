# SEO

Haven's SEO is implemented through Next.js metadata APIs and a small set of
shared helpers in `lib/seo.ts`. Nothing is hand-written per page beyond the
title, description, and content.

## Metadata

Every public page calls `buildMetadata()`:

```ts
export const metadata = buildMetadata({
  title: "Temporary Email Address — Free Instant Inbox",
  description: "…70–165 characters…",
  path: "/temporary-email",
});
```

It produces the title, description, canonical URL, robots directives, hreflang
alternates, Open Graph tags (including a 1200×630 image), and a Twitter summary
card. Options: `noindex`, `image`, `imageAlt`, `absoluteTitle`, and the article
fields (`type: "article"`, `publishedTime`, `modifiedTime`, `authors`,
`section`).

The root layout applies the template `%s | Haven`. The homepage passes
`absoluteTitle: true` so its title is not suffixed twice.

## Keyword map

One primary keyword per page — no two indexable pages target the same term.

| Page | Primary keyword |
| --- | --- |
| `/` | temporary email, temp mail |
| `/temporary-email` | temporary email address |
| `/temp-mail` | temp mail |
| `/disposable-email` | disposable email address |
| `/temporary-inbox` | temporary inbox online |
| `/10-minute-mail` | 10 minute mail |
| `/burner-email` | burner email address |
| `/temporary-email-generator` | temporary email generator |
| `/disposable-email-generator` | disposable email generator |
| `/free-temporary-email` | free temporary email |
| `/temporary-email-without-signup` | temporary email without signup |
| `/temporary-email-for-testing` | temporary email for testing |
| `/temporary-email-for-verification` | temporary email for verification |
| `/private-email` | private temporary email |
| `/temporary-phone` | temporary phone number |
| `/sms-receiver` | receive SMS online |
| `/temporary-email-api` | temporary email API |
| `/developer-api` | disposable email API |
| `/pricing` | ad-free temporary email, custom domain |
| `/tools` | online privacy tools |
| `/blog/*` | informational long-tail |

## Structured data

Builders in `lib/seo.ts` return typed nodes; `graph(...)` wraps them in one
`@graph` document.

| Page type | Schema |
| --- | --- |
| Homepage | Organization, WebSite, SoftwareApplication, FAQPage |
| SEO landers | WebPage, BreadcrumbList, SoftwareApplication, FAQPage |
| Blog index | CollectionPage, BreadcrumbList, ItemList |
| Blog article | WebPage, BreadcrumbList, Article |
| Other pages | WebPage, BreadcrumbList |

Rules enforced by tests:

- **No review or rating markup.** Haven has no verified public reviews, so
  `aggregateRating` is impossible to emit. A test asserts this.
- **FAQPage only where questions are visible.** The homepage emits it only when
  FAQs actually render.
- **BreadcrumbList only with a visible trail.** `PageShell` emits the schema and
  the `<Breadcrumbs />` component together.

## Index control

Private surfaces are protected at three layers, because `robots.txt` alone only
prevents crawling — a disallowed URL can still be indexed from an external link.

1. `robots.txt` disallows `/admin`, `/dashboard`, `/api/`, `/login`,
   `/register`, `/forgot-password`, `/inbox`.
2. Those pages set `noindex, nofollow` via `buildMetadata({ noindex: true })`.
3. `next.config.ts` sends `X-Robots-Tag: noindex, nofollow` headers for the same
   routes, plus `noarchive` and `no-store` on `/api`, `/admin`, `/dashboard`.

**Mailbox contents are never on a crawlable URL.** The inbox renders for the
session holder and the messages API requires a mailbox token, so there is no
public address for a crawler to reach in the first place.

## Sitemap

`app/sitemap.ts` lists curated public routes with real priorities, plus
published blog posts and published CMS pages. Private paths are excluded and
covered by a test. Priorities: homepage 1.0, primary landers 0.9, intent landers
0.7–0.8, blog posts 0.6, legal 0.3–0.4.

## Search Console

Set the verification token per deployment — never commit one:

```bash
GOOGLE_SITE_VERIFICATION=…
BING_SITE_VERIFICATION=…
```

The meta tag is omitted entirely when the variable is unset. Then submit
`https://your-domain/sitemap.xml`.

## Auditing

Two scripts were used during implementation and are worth re-running after
content changes:

- Metadata audit — titles, descriptions, H1 counts, canonicals, OG images,
  JSON-LD validity, and duplicate detection across all public pages.
- Link audit — inbound/outbound counts per page, orphan detection, and broken
  internal links.

Automated coverage lives in `tests/unit/seo.test.ts` (19 tests).

## Content rules

- One `<h1>` per page. `stripLeadingH1()` removes the duplicate heading stored
  inside CMS and article HTML.
- Descriptions are 70–165 characters. `summarizeHtml()` derives one from page
  text when a CMS page has no explicit `seoDescription`.
- Descriptive anchor text, never "click here".
- No keyword stuffing, no doorway pages, no fabricated statistics or reviews.
  Every claim on a landing page must be true of the running system.
