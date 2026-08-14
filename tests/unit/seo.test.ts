import { describe, expect, it } from "vitest";
import {
  absoluteUrl,
  articleSchema,
  breadcrumbSchema,
  buildMetadata,
  faqSchema,
  organizationSchema,
  softwareApplicationSchema,
  webPageSchema,
  websiteSchema,
} from "@/lib/seo";
import { stripLeadingH1, summarizeHtml } from "@/lib/content";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";

/** Surfaces that must never appear in the sitemap or be indexable. */
const PRIVATE_PATHS = ["/admin", "/dashboard", "/login", "/register", "/inbox", "/api/"];

describe("page metadata", () => {
  it("sets canonical, Open Graph, and Twitter data", () => {
    const meta = buildMetadata({
      title: "Temporary Email",
      description: "A description long enough to be useful in a search result snippet.",
      path: "/temporary-email",
    });

    expect(meta.alternates?.canonical).toBe(absoluteUrl("/temporary-email"));
    expect(meta.openGraph?.title).toBe("Temporary Email");
    expect(meta.openGraph?.url).toBe(absoluteUrl("/temporary-email"));
    // An OG image is required or social cards fall back to a bare link.
    expect(meta.openGraph?.images).toBeTruthy();
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("marks private pages noindex and drops their hreflang alternates", () => {
    const meta = buildMetadata({
      title: "Log in",
      description: "Log in to your account.",
      path: "/login",
      noindex: true,
    });

    expect(meta.robots).toMatchObject({ index: false, follow: false });
    expect(meta.alternates?.languages).toBeUndefined();
  });

  it("advertises hreflang alternates on indexable pages", () => {
    const meta = buildMetadata({ title: "T", description: "D", path: "/" });
    const languages = meta.alternates?.languages as Record<string, string> | undefined;

    expect(languages?.en).toBe(absoluteUrl("/"));
    expect(languages?.["x-default"]).toBe(absoluteUrl("/"));
  });

  it("emits article Open Graph fields only for articles", () => {
    const article = buildMetadata({
      title: "Post",
      description: "Description",
      path: "/blog/post",
      type: "article",
      publishedTime: "2026-01-01T00:00:00.000Z",
      authors: ["Haven Editorial"],
    });
    expect(article.openGraph).toMatchObject({ type: "article" });

    const page = buildMetadata({ title: "Page", description: "D", path: "/x" });
    expect(page.openGraph).toMatchObject({ type: "website" });
    expect(page.openGraph).not.toHaveProperty("publishedTime");
  });
});

describe("structured data", () => {
  it("produces valid, typed schema nodes", () => {
    expect(organizationSchema()["@type"]).toBe("Organization");
    expect(websiteSchema()["@type"]).toBe("WebSite");
    expect(softwareApplicationSchema()["@type"]).toBe("SoftwareApplication");
    expect(webPageSchema({ path: "/x", name: "X", description: "D" })["@type"]).toBe("WebPage");
  });

  it("never advertises a rating Haven cannot substantiate", () => {
    // Fabricated review/rating markup is a policy violation, so the builder
    // must not be able to emit one.
    const serialized = JSON.stringify(softwareApplicationSchema());
    expect(serialized).not.toContain("aggregateRating");
    expect(serialized).not.toContain("reviewCount");
    expect(serialized).not.toContain("ratingValue");
  });

  it("numbers breadcrumb positions from one with absolute URLs", () => {
    const schema = breadcrumbSchema(
      [
        { name: "Home", path: "/" },
        { name: "Blog", path: "/blog" },
      ],
      "/blog",
    );

    expect(schema.itemListElement).toHaveLength(2);
    expect(schema.itemListElement[0]).toMatchObject({ position: 1, item: absoluteUrl("/") });
    expect(schema.itemListElement[1]).toMatchObject({ position: 2, item: absoluteUrl("/blog") });
  });

  it("maps FAQ entries to Question/Answer pairs", () => {
    const schema = faqSchema([{ question: "Is it free?", answer: "Yes." }]);
    expect(schema.mainEntity[0]).toMatchObject({
      "@type": "Question",
      name: "Is it free?",
      acceptedAnswer: { "@type": "Answer", text: "Yes." },
    });
  });

  it("includes author and dates on articles", () => {
    const schema = articleSchema({
      path: "/blog/x",
      headline: "X",
      description: "D",
      author: "Haven Editorial",
      published: "2026-01-01T00:00:00.000Z",
      modified: "2026-02-01T00:00:00.000Z",
    });

    expect(schema).toMatchObject({
      "@type": "Article",
      author: { "@type": "Person", name: "Haven Editorial" },
      datePublished: "2026-01-01T00:00:00.000Z",
      dateModified: "2026-02-01T00:00:00.000Z",
    });
  });
});

describe("sitemap", () => {
  it("lists the homepage at the highest priority", async () => {
    const entries = await sitemap();
    const home = entries.find((entry) => entry.url === absoluteUrl("/"));
    expect(home?.priority).toBe(1);
  });

  it("excludes every private surface", async () => {
    const entries = await sitemap();
    for (const entry of entries) {
      const path = entry.url.replace(absoluteUrl(""), "");
      for (const priv of PRIVATE_PATHS) {
        // /temporary-inbox is a public marketing page, so compare exactly.
        expect(path === priv || path.startsWith(`${priv}/`)).toBe(false);
      }
    }
  });

  it("contains no duplicate URLs", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("uses absolute URLs throughout", async () => {
    const entries = await sitemap();
    for (const entry of entries) expect(entry.url).toMatch(/^https?:\/\//);
  });
});

describe("robots", () => {
  it("blocks private surfaces without blocking the site", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const primary = rules[0]!;
    const disallow = (
      Array.isArray(primary.disallow) ? primary.disallow : [primary.disallow]
    ).filter(Boolean) as string[];

    expect(primary.allow).toBe("/");
    // A bare "/" here would deindex the entire site.
    expect(disallow).not.toContain("/");
    for (const path of ["/admin", "/dashboard", "/api/", "/login", "/inbox"]) {
      expect(disallow).toContain(path);
    }
  });

  it("advertises the sitemap", () => {
    expect(robots().sitemap).toBe(absoluteUrl("/sitemap.xml"));
  });
});

describe("content helpers", () => {
  it("removes a duplicate leading H1 from stored HTML", () => {
    const html = '<article class="prose"><h1>Privacy Policy</h1><p>Body</p></article>';
    const out = stripLeadingH1(html);
    expect(out).not.toContain("<h1>");
    expect(out).toContain("<p>Body</p>");
  });

  it("keeps headings that are not the leading H1", () => {
    const html = "<p>Intro</p><h1>Not first</h1>";
    expect(stripLeadingH1(html)).toContain("<h1>Not first</h1>");
  });

  it("summarizes HTML into a usable description length", () => {
    const html = `<h1>Title</h1><p>${"Haven keeps temporary inboxes short lived. ".repeat(12)}</p>`;
    const summary = summarizeHtml(html, "fallback");

    expect(summary.length).toBeLessThanOrEqual(160);
    expect(summary).not.toContain("<");
    expect(summary).not.toContain("Title");
  });

  it("falls back when there is too little text to summarize", () => {
    expect(summarizeHtml("<p>Hi</p>", "fallback")).toBe("fallback");
  });
});
