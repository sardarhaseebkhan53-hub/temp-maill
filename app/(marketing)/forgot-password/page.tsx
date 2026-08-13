import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Forgot password — Haven",
  description: "Password reset is delivered only when outbound SMTP is configured.",
  path: "/forgot-password",
  noindex: true,
});

export default function Page() {
  return (
    <div className="container py-16 max-w-md">
      <h1 className="font-display text-3xl font-semibold">Forgot password</h1>
      <p className="text-sm text-muted-foreground mt-3">
        If outbound SMTP is configured, operators can send a reset from the admin console. Until then, contact support
        from an address on the account.
      </p>
    </div>
  );
}
