import { buildMetadata } from "@/lib/seo";
import { AuthForm } from "@/components/features/auth-form";

export const metadata = buildMetadata({
  title: "Create account — Haven",
  description: "Optional Haven account for saved inboxes, aliases, and API keys.",
  path: "/register",
});

export default function RegisterPage() {
  return (
    <div className="container py-16 max-w-md">
      <h1 className="font-display text-3xl font-semibold">Create a Haven account</h1>
      <p className="text-sm text-muted-foreground mt-2">Optional. The inbox works without one.</p>
      <div className="mt-8">
        <AuthForm mode="register" />
      </div>
    </div>
  );
}
