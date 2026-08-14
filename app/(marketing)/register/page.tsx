import { redirect } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { AuthForm } from "@/components/features/auth-form";
import { AuthShell } from "@/components/features/auth-shell";
import { getCurrentUser, hasPermission } from "@/lib/auth";

export const metadata = buildMetadata({
  title: "Create account — Haven",
  description:
    "Create an optional Haven account for saved inboxes, aliases, API keys, and billing. The temporary email service works without one.",
  path: "/register",
  // Auth surface: useful to people, not to search results.
  noindex: true,
});

export default async function RegisterPage() {
  const ctx = await getCurrentUser().catch(() => null);
  if (ctx && ctx.user.status === "ACTIVE") {
    redirect(hasPermission(ctx.user, "admin.access") ? "/admin" : "/dashboard");
  }

  return (
    <AuthShell
      eyebrow="Create account"
      title="Create a Haven account"
      description="Entirely optional — the temporary inbox works without one. An account adds saved mailboxes, aliases, API keys, and billing."
    >
      <AuthForm mode="register" />
    </AuthShell>
  );
}
