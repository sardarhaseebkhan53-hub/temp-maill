import { buildMetadata } from "@/lib/seo";
import { BreachForm } from "@/components/features/breach-form";

export const metadata = buildMetadata({
  title: "Username Breach Checker — Haven",
  description: "Educational check against a local sample of known-bad patterns. Not a full breach corpus.",
  path: "/tools/breach-checker",
});

export default function Page() {
  return (
    <div className="container py-12 max-w-xl">
      <h1 className="font-display text-3xl font-semibold">Username / password breach hint</h1>
      <p className="mt-3 text-muted-foreground">
        This tool never sends your password to a third party. It checks locally against a small educational wordlist
        and common patterns. It is not a substitute for a dedicated breach service.
      </p>
      <div className="mt-8">
        <BreachForm />
      </div>
    </div>
  );
}
