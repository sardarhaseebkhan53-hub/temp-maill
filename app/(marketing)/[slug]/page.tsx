import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { PageShell } from "@/components/layout/page-shell";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page) return {};
  return buildMetadata({
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.title,
    path: `/${slug}`,
  });
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page || !page.published) notFound();

  return (
    <PageShell
      title={page.title}
      description={page.updatedAt ? `Last updated ${new Date(page.updatedAt).toLocaleDateString()}` : undefined}
    >
      <article
        className="prose-haven min-w-0"
        dangerouslySetInnerHTML={{ __html: page.contentHtml }}
      />
    </PageShell>
  );
}
