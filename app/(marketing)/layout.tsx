import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCurrentUser().catch(() => null);
  const announcement = await prisma.announcement.findFirst({
    where: { enabled: true, OR: [{ audience: "ALL" }, { audience: ctx ? "AUTH" : "ANON" }] },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="min-h-screen flex flex-col">
      {announcement ? (
        <div className="bg-primary text-primary-foreground text-sm text-center px-4 py-2">{announcement.body}</div>
      ) : null}
      <Navbar user={ctx?.user ?? null} />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileNav />
    </div>
  );
}
