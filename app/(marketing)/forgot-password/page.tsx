import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { AuthShell } from "@/components/features/auth-shell";

export const metadata = buildMetadata({
  title: "Forgot password — Haven",
  description: "Password reset is delivered only when outbound SMTP is configured.",
  path: "/forgot-password",
  noindex: true,
});

export default function Page() {
  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Forgot your password?"
      description="Self-service reset requires outbound email to be configured on this deployment."
    >
      <div className="space-y-4 text-sm leading-relaxed text-slate-400">
        <p>
          If outbound SMTP is configured, an operator can send a reset link from the admin console.
          Until then, contact support from an address on the account and we will verify you manually.
        </p>
        <Link
          href="/contact"
          className="inline-flex w-full items-center justify-center rounded-xl bg-[#00f5a0] px-5 py-3 text-sm font-bold text-[#06090e] transition-colors hover:bg-[#00e092]"
        >
          Contact support
        </Link>
        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.1]"
        >
          Back to log in
        </Link>
      </div>
    </AuthShell>
  );
}
