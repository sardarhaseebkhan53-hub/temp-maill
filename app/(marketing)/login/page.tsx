import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { AuthForm } from "@/components/features/auth-form";
import { AuthShell } from "@/components/features/auth-shell";
import { getCurrentUser, hasPermission } from "@/lib/auth";

export const metadata = buildMetadata({
  title: "Log in — Haven",
  description:
    "Log in to your Haven account to manage saved inboxes, aliases, API keys, and billing.",
  path: "/login",
  noindex: true,
});

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const ctx = await getCurrentUser().catch(() => null);

  // An authenticated visitor should never be parked on the login screen.
  if (ctx && ctx.user.status === "ACTIVE") {
    const target =
      next && next.startsWith("/") && !next.startsWith("//")
        ? next
        : hasPermission(ctx.user, "admin.access")
          ? "/admin"
          : "/dashboard";
    redirect(target);
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in to Haven"
      description="Your inbox works without an account. Log in for saved mailboxes, aliases, API keys, and billing."
    >
      <AuthForm mode="login" next={next} />
      <div className="mt-6 flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 text-[11px] leading-relaxed text-slate-400">
        <ShieldCheck className="mt-px size-3.5 shrink-0 text-[#00f5a0]" aria-hidden="true" />
        <span>
          Sessions use httpOnly cookies and passwords are stored as Argon2id hashes. We never keep a
          plaintext password. Read our{" "}
          <Link href="/privacy" className="font-medium text-slate-300 underline hover:text-white">
            privacy policy
          </Link>
          .
        </span>
      </div>
    </AuthShell>
  );
}
