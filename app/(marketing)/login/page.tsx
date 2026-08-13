import { buildMetadata } from "@/lib/seo";
import { AuthForm } from "@/components/features/auth-form";

export const metadata = buildMetadata({ title: "Log in — Haven", description: "Log in to Haven.", path: "/login", noindex: true });

export default function LoginPage() {
  return (
    <div className="container py-16 max-w-md">
      <h1 className="font-display text-3xl font-semibold">Welcome back</h1>
      <p className="text-sm text-muted-foreground mt-2">Sessions are httpOnly cookies. We never store a password in plaintext.</p>
      <div className="mt-8">
        <AuthForm mode="login" />
      </div>
    </div>
  );
}
