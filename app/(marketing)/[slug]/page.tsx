import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { PageShell } from "@/components/layout/page-shell";
import { stripLeadingH1 } from "@/lib/content";

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
      description={
        page.updatedAt
          ? `Last updated ${new Date(page.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`
          : undefined
      }
      path={`/${slug}`}
      crumbs={[
        { name: "Home", path: "/" },
        { name: page.title, path: `/${slug}` },
      ]}
    >
      <article
        className="prose-haven min-w-0"
        // The shell renders the title as the page's single H1.
        dangerouslySetInnerHTML={{ __html: stripLeadingH1(page.contentHtml) }}
      />
    </PageShell>
  );
}
