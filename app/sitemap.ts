import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "/",
    "/temporary-email",
    "/temp-mail",
    "/disposable-email",
    "/10-minute-mail",
    "/temporary-inbox",
    "/private-email",
    "/temporary-email-api",
    "/developer-api",
    "/temporary-phone",
    "/sms-receiver",
    "/pricing",
    "/tools",
    "/tools/breach-checker",
    "/tools/fingerprint",
    "/blog",
    "/faq",
    "/privacy",
    "/terms",
    "/cookies",
    "/acceptable-use",
    "/abuse",
    "/security",
    "/contact",
    "/help",
  ];
  const posts = await prisma.blogPost.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } });
  return [
    ...staticPaths.map((p) => ({ url: absoluteUrl(p), lastModified: new Date(), changeFrequency: "weekly" as const, priority: p === "/" ? 1 : 0.7 })),
    ...posts.map((p) => ({
      url: absoluteUrl(`/blog/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
