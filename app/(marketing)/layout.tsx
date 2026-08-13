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
    <div className="min-h-screen flex flex-col bg-[#06080d] text-slate-200">
      {announcement ? (
        <div className="bg-emerald-950/70 border-b border-[#00f5a0]/25 text-[#00f5a0] text-xs font-semibold text-center px-4 py-1.5 shadow-sm">
          {announcement.body}
        </div>
      ) : null}
      <Navbar user={ctx?.user ?? null} />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileNav />
    </div>
  );
}
