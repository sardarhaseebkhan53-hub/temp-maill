import { listPublicPlans } from "@/server/services/plans";
import { buildMetadata } from "@/lib/seo";
import { PricingGrid } from "@/components/features/pricing-grid";

export const metadata = buildMetadata({
  title: "Pricing — Haven",
  description: "Free disposable inboxes, plus Pro, Developer, and Business plans. Prices live in the database.",
  path: "/pricing",
});

export default async function PricingPage() {
  const plans = await listPublicPlans();
  return (
    <div className="container py-12">
      <h1 className="font-display text-4xl font-semibold">Stay only as long as you need</h1>
      <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
        The free inbox is genuinely useful. Paid plans add time, domains, aliases, and API room. Prices are operator
        configurable.
      </p>
      <div className="mt-10">
        <PricingGrid plans={plans} />
      </div>
    </div>
  );
}
