import { requireUser } from "@/lib/auth";
import { ManualPayForm } from "@/components/features/manual-pay-form";

export default async function ManualPayPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; interval?: string; currency?: string }>;
}) {
  await requireUser();
  const sp = await searchParams;
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Manual payment</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Bank transfer, JazzCash, or Easypaisa. Premium activates only after an operator approves the reference.
      </p>
      <div className="mt-6 max-w-md">
        <ManualPayForm
          planKey={sp.plan || "PRO"}
          interval={sp.interval || "month"}
          currency={sp.currency || "USD"}
        />
      </div>
    </div>
  );
}
