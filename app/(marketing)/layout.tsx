import { cookies } from "next/headers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MobileNav, MobileNavSpacer } from "@/components/layout/mobile-nav";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LOCALES, type Locale } from "@/types";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [ctx, jar] = await Promise.all([getCurrentUser().catch(() => null), cookies()]);

  const raw = (jar.get("haven_locale")?.value || "en") as Locale;
  const locale = LOCALES.includes(raw) ? raw : "en";

  const announcement = await prisma.announcement.findFirst({
    where: { enabled: true, OR: [{ audience: "ALL" }, { audience: ctx ? "AUTH" : "ANON" }] },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-clip bg-[#06080d] text-slate-200">
      {announcement ? (
        <div className="border-b border-[#00f5a0]/25 bg-emerald-950/70 px-4 py-1.5 text-center text-xs font-semibold text-[#00f5a0]">
          {announcement.body}
        </div>
      ) : null}
      <Navbar user={ctx?.user ?? null} locale={locale} />
      <main className="min-w-0 flex-1">{children}</main>
      <Footer />
      <MobileNavSpacer />
      <MobileNav />
    </div>
  );
}
