import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";

const LEGAL = new Set(["privacy", "terms", "cookies", "acceptable-use", "abuse", "security"]);

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
  if (!LEGAL.has(slug)) {
    const page = await prisma.page.findUnique({ where: { slug } });
    if (!page || !page.published) notFound();
    return (
      <div className="container py-12 max-w-3xl">
        <div className="prose" dangerouslySetInnerHTML={{ __html: page.contentHtml }} />
      </div>
    );
  }
  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page) notFound();
  return (
    <div className="container py-12 max-w-3xl">
      <div className="prose" dangerouslySetInnerHTML={{ __html: page.contentHtml }} />
    </div>
  );
}
