import Link from "next/link";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Blog — Haven",
  description: "Notes on disposable mail, retention, and using privacy tools without magical thinking.",
  path: "/blog",
});

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    include: { category: true },
  });
  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="font-display text-4xl font-semibold">Journal</h1>
      <div className="mt-8 space-y-6">
        {posts.map((p) => (
          <Link key={p.id} href={`/blog/${p.slug}`} className="block rounded-2xl border bg-card p-6 hover:border-primary/40">
            <p className="text-xs text-muted-foreground">
              {p.category?.name} · {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : ""}
            </p>
            <h2 className="font-display text-2xl font-semibold mt-1">{p.title}</h2>
            <p className="text-sm text-muted-foreground mt-2">{p.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
