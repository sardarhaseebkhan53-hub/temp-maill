import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, User } from "lucide-react";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { AdSlot } from "@/components/ads/ad-slot";
import { RailAds } from "@/components/ads/rail-ads";
import { resolveAdSlots } from "@/server/services/ads";
import { splitHtmlForInContentAd } from "@/lib/content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post) return {};
  return buildMetadata({
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    path: `/blog/${slug}`,
  });
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: { category: true },
  });
  if (!post || post.status !== "PUBLISHED") notFound();

  const [related, ads] = await Promise.all([
    prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 4,
    }),
    resolveAdSlots(["TOP_LEADERBOARD", "BLOG", "RECTANGLE", "CONTENT"]),
  ]);

  // The in-content ad is injected at a paragraph boundary so it never splits
  // a sentence or interrupts a list.
  const [firstHalf, secondHalf] = splitHtmlForInContentAd(post.contentHtml);
  const relatedPosts = related.filter((item) => item.id !== post.id).slice(0, 3);

  return (
    <>
      <RailAds />
      <div className="relative min-h-screen min-w-0 overflow-x-clip bg-[#06080d] bg-ambient-radial pb-16 text-slate-200">
        <div className="mx-auto w-full max-w-[1480px] min-w-0 px-3 pt-6 sm:px-5">
          <AdSlot slot="TOP_LEADERBOARD" resolved={ads.TOP_LEADERBOARD} />

          <div className="mt-6 grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <article className="min-w-0">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition-colors hover:text-[#00f5a0]"
              >
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                All articles
              </Link>

              <header className="mt-4 min-w-0">
                {post.category?.name ? (
                  <span className="rounded-full border border-[#00f5a0]/20 bg-[#00f5a0]/10 px-2.5 py-1 text-[11px] font-semibold text-[#00f5a0]">
                    {post.category.name}
                  </span>
                ) : null}
                <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
                  {post.title}
                </h1>
                {post.excerpt ? (
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{post.excerpt}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-4 border-y border-white/[0.07] py-3 text-[11px] text-slate-500">
                  {post.authorName ? (
                    <span className="inline-flex items-center gap-1.5">
                      <User className="size-3" aria-hidden="true" />
                      {post.authorName}
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
              </header>

              <div
                className="prose-haven mt-6 min-w-0"
                dangerouslySetInnerHTML={{ __html: firstHalf }}
              />

              {secondHalf ? (
                <>
                  <div className="my-8">
                    <AdSlot slot="BLOG" resolved={ads.BLOG} />
                  </div>
                  <div
                    className="prose-haven min-w-0"
                    dangerouslySetInnerHTML={{ __html: secondHalf }}
                  />
                </>
              ) : null}

              {relatedPosts.length ? (
                <section className="mt-10 min-w-0">
                  <h2 className="font-display text-lg font-bold tracking-tight text-white">
                    Related reading
                  </h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {relatedPosts.map((item) => (
                      <Link
                        key={item.id}
                        href={`/blog/${item.slug}`}
                        className="group min-w-0 rounded-xl border border-white/[0.07] bg-[#0c1017]/90 p-4 transition-colors hover:border-[#00f5a0]/25"
                      >
                        <h3 className="text-sm font-semibold text-white transition-colors group-hover:text-[#00f5a0]">
                          {item.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">
                          {item.excerpt}
                        </p>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              <div className="mt-8">
                <AdSlot slot="CONTENT" resolved={ads.CONTENT} />
              </div>
            </article>

            <aside className="min-w-0 space-y-4 lg:sticky lg:top-24">
              <AdSlot slot="RECTANGLE" resolved={ads.RECTANGLE} />
              <div className="rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 p-4">
                <h2 className="text-sm font-bold text-white">Need an address right now?</h2>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                  Haven generates a temporary inbox the moment you open the homepage — no signup.
                </p>
                <Link
                  href="/#inbox"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[#00f5a0] px-4 py-2.5 text-xs font-bold text-[#06090e] transition-colors hover:bg-[#00e092]"
                >
                  Generate temporary email
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
