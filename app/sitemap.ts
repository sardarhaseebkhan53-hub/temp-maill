import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo";

/**
 * Only public, canonical, indexable URLs belong here.
 *
 * Deliberately excluded: /admin, /dashboard, /login, /register,
 * /forgot-password, /inbox (session-specific), and every API route. Those are
 * also blocked in robots.txt and carry a noindex robots meta.
 */
const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },

  // Primary keyword landers
  { path: "/temporary-email", priority: 0.9, changeFrequency: "weekly" },
  { path: "/temp-mail", priority: 0.9, changeFrequency: "weekly" },
  { path: "/disposable-email", priority: 0.9, changeFrequency: "weekly" },
  { path: "/temporary-inbox", priority: 0.8, changeFrequency: "weekly" },
  { path: "/10-minute-mail", priority: 0.8, changeFrequency: "weekly" },
  { path: "/burner-email", priority: 0.8, changeFrequency: "weekly" },

  // Intent landers
  { path: "/temporary-email-generator", priority: 0.8, changeFrequency: "weekly" },
  { path: "/disposable-email-generator", priority: 0.7, changeFrequency: "weekly" },
  { path: "/free-temporary-email", priority: 0.8, changeFrequency: "weekly" },
  { path: "/temporary-email-without-signup", priority: 0.7, changeFrequency: "weekly" },
  { path: "/temporary-email-for-testing", priority: 0.7, changeFrequency: "weekly" },
  { path: "/temporary-email-for-verification", priority: 0.7, changeFrequency: "weekly" },
  { path: "/private-email", priority: 0.7, changeFrequency: "weekly" },

  // Products
  { path: "/temporary-phone", priority: 0.7, changeFrequency: "weekly" },
  { path: "/sms-receiver", priority: 0.6, changeFrequency: "weekly" },
  { path: "/temporary-email-api", priority: 0.7, changeFrequency: "weekly" },
  { path: "/developer-api", priority: 0.7, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.8, changeFrequency: "weekly" },

  // Tools
  { path: "/tools", priority: 0.7, changeFrequency: "weekly" },
  { path: "/tools/breach-checker", priority: 0.6, changeFrequency: "monthly" },
  { path: "/tools/fingerprint", priority: 0.6, changeFrequency: "monthly" },

  // Content and trust
  { path: "/blog", priority: 0.8, changeFrequency: "daily" },
  { path: "/faq", priority: 0.7, changeFrequency: "weekly" },
  { path: "/help", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/status", priority: 0.4, changeFrequency: "daily" },

  // Legal
  { path: "/privacy", priority: 0.4, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.4, changeFrequency: "monthly" },
  { path: "/cookies", priority: 0.3, changeFrequency: "monthly" },
  { path: "/acceptable-use", priority: 0.3, changeFrequency: "monthly" },
  { path: "/abuse", priority: 0.3, changeFrequency: "monthly" },
  { path: "/security", priority: 0.4, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [posts, pages] = await Promise.all([
    prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true, publishedAt: true },
    }),
    // CMS pages are only listed once an operator has published them.
    prisma.page
      .findMany({ where: { published: true }, select: { slug: true, updatedAt: true } })
      .catch(() => [] as { slug: string; updatedAt: Date }[]),
  ]);

  const staticEntries = routes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const known = new Set(routes.map((route) => route.path));

  const cmsEntries = pages
    .filter((page) => !known.has(`/${page.slug}`))
    .map((page) => ({
      url: absoluteUrl(`/${page.slug}`),
      lastModified: page.updatedAt ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    }));

  const postEntries = posts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: post.updatedAt ?? post.publishedAt ?? now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...cmsEntries, ...postEntries];
}
