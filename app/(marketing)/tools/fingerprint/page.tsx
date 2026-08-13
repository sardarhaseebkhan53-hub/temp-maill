import { buildMetadata } from "@/lib/seo";
import { FingerprintPanel } from "@/components/features/fingerprint-panel";

export const metadata = buildMetadata({
  title: "Browser Fingerprint & Tracker Check — Haven",
  description: "See a few signals your browser exposes. Educational, not a deanonymization service.",
  path: "/tools/fingerprint",
});

export default function Page() {
  return (
    <div className="container py-12 max-w-2xl">
      <h1 className="font-display text-3xl font-semibold">What this browser reveals</h1>
      <p className="mt-3 text-muted-foreground">
        A small educational panel. It does not claim to uniquely identify you and it does not store a fingerprint.
      </p>
      <div className="mt-8">
        <FingerprintPanel />
      </div>
    </div>
  );
}
