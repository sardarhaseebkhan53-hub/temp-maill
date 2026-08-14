import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { prisma } from "@/lib/db";
import {
  absoluteUrl,
  breadcrumbSchema,
  buildMetadata,
  graph,
  webPageSchema,
} from "@/lib/seo";
import { PageShell } from "@/components/layout/page-shell";
import { AdSlot } from "@/components/ads/ad-slot";
import { RailAds } from "@/components/ads/rail-ads";
import { resolveAdSlots } from "@/server/services/ads";

export const metadata = buildMetadata({
  title: "Blog — Temporary Email & Online Privacy Guides",
  description:
    "Practical guides on temporary email, disposable inboxes, email security, and online privacy — written without magical thinking or overblown claims.",
  path: "/blog",
});

export default async function BlogPage() {
  const [posts, ads] = await Promise.all([
    prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      include: { category: true },
    }),
    resolveAdSlots(["TOP_LEADERBOARD", "BLOG", "RECTANGLE", "CONTENT"]),
  ]);

  // An in-feed ad after the third post keeps the list readable.
  const inFeedAfter = 3;

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
  ];

  return (
    <>
      <RailAds />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={graph(
          {
            ...webPageSchema({
              path: "/blog",
              name: "Haven Blog",
              description:
                "Practical guides on temporary email, disposable inboxes, email security, and online privacy.",
              breadcrumb: true,
            }),
            "@type": "CollectionPage",
          },
          breadcrumbSchema(crumbs, "/blog"),
          posts.length
            ? {
                "@type": "ItemList",
                itemListElement: posts.map((post, index) => ({
                  "@type": "ListItem",
                  position: index + 1,
                  url: absoluteUrl(`/blog/${post.slug}`),
                  name: post.title,
                })),
              }
            : null,
        )}
      />
      <PageShell
        path="/blog"
        crumbs={crumbs}
        eyebrow="Journal"
        title="Privacy, plainly explained"
        description="Notes on disposable mail, retention, deliverability, and using privacy tools without magical thinking."
        aside={
          <>
            <AdSlot slot="RECTANGLE" resolved={ads.RECTANGLE} />
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 p-4">
              <h2 className="text-sm font-bold text-white">Try Haven now</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                A working temporary inbox is created the moment you open the homepage.
              </p>
              <Link
                href="/#inbox"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#00f5a0] hover:underline"
              >
                Generate an address <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
            <AdSlot slot="BLOG" resolved={ads.BLOG} />
          </>
        }
      >
        <AdSlot slot="TOP_LEADERBOARD" resolved={ads.TOP_LEADERBOARD} />

        {posts.length === 0 ? (
          <p className="rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 p-6 text-sm text-slate-400">
            No articles have been published yet.
          </p>
        ) : (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <div key={post.id} className="min-w-0 space-y-4">
                <article className="min-w-0">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group block min-w-0 rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 p-5 shadow-lg transition-all hover:-translate-y-0.5 hover:border-[#00f5a0]/30 motion-reduce:transform-none motion-reduce:transition-none sm:p-6"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      {post.category?.name ? (
                        <span className="rounded-full border border-[#00f5a0]/20 bg-[#00f5a0]/10 px-2 py-0.5 font-semibold text-[#00f5a0]">
                          {post.category.name}
                        </span>
                      ) : null}
                      {post.publishedAt ? (
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="size-3" aria-hidden="true" />
                          <time dateTime={new Date(post.publishedAt).toISOString()}>
                            {new Date(post.publishedAt).toLocaleDateString()}
                          </time>
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-2 font-display text-xl font-bold tracking-tight text-white transition-colors group-hover:text-[#00f5a0]">
                      {post.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{post.excerpt}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#00f5a0]">
                      Read article
                      <ArrowRight
                        className="size-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
                        aria-hidden="true"
                      />
                    </span>
                  </Link>
                </article>

                {index === inFeedAfter - 1 ? (
                  <AdSlot slot="CONTENT" resolved={ads.CONTENT} />
                ) : null}
              </div>
            ))}
          </div>
        )}
      </PageShell>
    </>
  );
}
